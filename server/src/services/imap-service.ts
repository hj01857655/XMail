import { EventEmitter } from 'events'
import IMAPClient, { IMAPMessage, SyncProgress } from './imap-client'
import { AccountDAO, AccountData } from '../database/account-dao'
import { EmailDAO, EmailData } from '../database/email-dao'
import { FolderDAO, FolderData } from '../database/folder-dao'
import { AttachmentDAO } from '../database/attachment-dao'
import DatabaseUtils from '../utils/database-utils'

export interface SyncResult {
  accountId: string
  folderId: string
  newEmails: number
  updatedEmails: number
  errors: string[]
}

export class IMAPService extends EventEmitter {
  private clients: Map<string, IMAPClient> = new Map()
  private accountDAO: AccountDAO
  private emailDAO: EmailDAO
  private folderDAO: FolderDAO
  private attachmentDAO: AttachmentDAO
  private syncInProgress: Set<string> = new Set()

  constructor() {
    super()
    this.accountDAO = new AccountDAO()
    this.emailDAO = new EmailDAO()
    this.folderDAO = new FolderDAO()
    this.attachmentDAO = new AttachmentDAO()
  }

  /**
   * 初始化所有活跃账户的IMAP连接
   */
  async initializeAllAccounts(): Promise<void> {
    try {
      const accounts = await this.accountDAO.findAllActive()
      console.log(`初始化 ${accounts.length} 个IMAP账户连接`)

      for (const account of accounts) {
        try {
          await this.initializeAccount(account.id!)
        } catch (error) {
          console.error(`初始化账户 ${account.email} 失败:`, error)
        }
      }
    } catch (error) {
      console.error('初始化IMAP账户失败:', error)
      throw error
    }
  }

  /**
   * 初始化单个账户的IMAP连接
   */
  async initializeAccount(accountId: string): Promise<void> {
    try {
      const account = await this.accountDAO.getById(accountId)
      if (!account) {
        throw new Error(`账户不存在: ${accountId}`)
      }

      if (!account.isActive) {
        console.log(`跳过非活跃账户: ${account.email}`)
        return
      }

      // 如果已存在连接，先断开
      if (this.clients.has(accountId)) {
        await this.disconnectAccount(accountId)
      }

      const client = new IMAPClient(account)

      // 设置事件监听器
      client.on('connected', () => {
        console.log(`IMAP账户连接成功: ${account.email}`)
        this.emit('accountConnected', accountId)
      })

      client.on('disconnected', () => {
        console.log(`IMAP账户连接断开: ${account.email}`)
        this.emit('accountDisconnected', accountId)
      })

      client.on('error', (error) => {
        console.error(`IMAP账户错误 ${account.email}:`, error)
        this.emit('accountError', accountId, error)
      })

      client.on('maxReconnectAttemptsReached', (error) => {
        console.error(`IMAP账户重连失败 ${account.email}:`, error)
        this.clients.delete(accountId)
        this.emit('accountConnectionFailed', accountId, error)
      })

      // 连接并保存客户端
      await client.connect()
      this.clients.set(accountId, client)

      // 同步文件夹结构
      await this.syncFolders(accountId)

    } catch (error) {
      console.error(`初始化IMAP账户 ${accountId} 失败:`, error)
      throw error
    }
  }

  /**
   * 断开账户连接
   */
  async disconnectAccount(accountId: string): Promise<void> {
    const client = this.clients.get(accountId)
    if (client) {
      await client.disconnect()
      this.clients.delete(accountId)
    }
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map(
      accountId => this.disconnectAccount(accountId)
    )
    await Promise.all(disconnectPromises)
  }

  /**
   * 同步账户的文件夹结构
   */
  async syncFolders(accountId: string): Promise<void> {
    const client = this.clients.get(accountId)
    if (!client) {
      throw new Error(`账户 ${accountId} 未连接`)
    }

    try {
      const imapFolders = await client.getFolders()

      // 获取现有文件夹
      const existingFolders = await this.folderDAO.findByAccountId(accountId)
      const existingFolderNames = new Set(existingFolders.map(f => f.name))

      // 创建新文件夹
      for (const imapFolder of this.flattenFolders(imapFolders)) {
        if (!existingFolderNames.has(imapFolder.name)) {
          const folderType = this.determineFolderType(imapFolder.name, imapFolder.flags)

          await this.folderDAO.create({
            accountId,
            name: imapFolder.name,
            type: folderType,
            sortOrder: this.getFolderSortOrder(folderType),
          })

          console.log(`创建文件夹: ${imapFolder.name} (${folderType})`)
        }
      }
    } catch (error) {
      console.error(`同步文件夹失败 (账户 ${accountId}):`, error)
      throw error
    }
  }

  /**
   * 同步账户的所有邮件
   */
  async syncAccount(
    accountId: string,
    onProgress?: (progress: SyncProgress & { folderId?: string }) => void
  ): Promise<SyncResult[]> {
    if (this.syncInProgress.has(accountId)) {
      throw new Error(`账户 ${accountId} 正在同步中`)
    }

    this.syncInProgress.add(accountId)

    try {
      const client = this.clients.get(accountId)
      if (!client) {
        throw new Error(`账户 ${accountId} 未连接`)
      }

      const folders = await this.folderDAO.findByAccountId(accountId)
      const results: SyncResult[] = []

      for (const folder of folders) {
        try {
          onProgress?.({
            current: 0,
            total: 0,
            status: 'connecting',
            message: `开始同步文件夹: ${folder.name}`,
            folderId: folder.id,
          })

          const result = await this.syncFolder(accountId, folder.id!, onProgress)
          results.push(result)
        } catch (error) {
          console.error(`同步文件夹 ${folder.name} 失败:`, error)
          results.push({
            accountId,
            folderId: folder.id!,
            newEmails: 0,
            updatedEmails: 0,
            errors: [(error as Error).message],
          })
        }
      }

      return results
    } finally {
      this.syncInProgress.delete(accountId)
    }
  }

  /**
   * 同步单个文件夹
   */
  async syncFolder(
    accountId: string,
    folderId: string,
    onProgress?: (progress: SyncProgress & { folderId?: string }) => void
  ): Promise<SyncResult> {
    const client = this.clients.get(accountId)
    if (!client) {
      throw new Error(`账户 ${accountId} 未连接`)
    }

    const folder = await this.folderDAO.getById(folderId)
    if (!folder) {
      throw new Error(`文件夹不存在: ${folderId}`)
    }

    const result: SyncResult = {
      accountId,
      folderId,
      newEmails: 0,
      updatedEmails: 0,
      errors: [],
    }

    try {
      // 获取最后同步时间
      const lastSyncDate = await this.emailDAO.getLatestEmailDate(accountId, folderId)

      // 同步邮件
      const messages = await client.syncFolder(
        folder.name,
        lastSyncDate || undefined,
        (progress) => {
          onProgress?.({
            ...progress,
            folderId,
          })
        }
      )

      // 保存邮件到数据库
      for (const message of messages) {
        try {
          const existingEmail = await this.emailDAO.findByMessageId(accountId, message.messageId)

          if (existingEmail) {
            // 更新现有邮件
            await this.updateEmailFromIMAP(existingEmail, message)
            result.updatedEmails++
          } else {
            // 创建新邮件
            await this.createEmailFromIMAP(accountId, folderId, message)
            result.newEmails++
          }
        } catch (error) {
          console.error(`保存邮件失败 (${message.messageId}):`, error)
          result.errors.push(`保存邮件失败: ${(error as Error).message}`)
        }
      }

      console.log(`文件夹 ${folder.name} 同步完成: 新邮件 ${result.newEmails}, 更新邮件 ${result.updatedEmails}`)

    } catch (error) {
      console.error(`同步文件夹 ${folder.name} 失败:`, error)
      result.errors.push((error as Error).message)
    }

    return result
  }

  /**
   * 从IMAP消息创建邮件记录
   */
  private async createEmailFromIMAP(
    accountId: string,
    folderId: string,
    message: IMAPMessage
  ): Promise<string> {
    const emailData: EmailData = {
      accountId,
      folderId,
      messageId: message.messageId,
      subject: message.subject,
      fromAddress: message.from[0] || { address: 'unknown@unknown.com' },
      toAddresses: message.to,
      ccAddresses: message.cc,
      bccAddresses: message.bcc,
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml,
      dateReceived: message.date,
      dateSent: message.date,
      isRead: message.flags.includes('\\Seen'),
      isStarred: message.flags.includes('\\Flagged'),
      isDeleted: message.flags.includes('\\Deleted'),
      hasAttachments: message.attachments.length > 0,
      sizeBytes: message.size,
    }

    const emailId = await this.emailDAO.create(emailData)

    // 保存附件
    if (message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          const client = this.clients.get(accountId)!
          const attachmentData = await client.saveAttachment(attachment, emailId)
          await this.attachmentDAO.create(attachmentData)
        } catch (error) {
          console.error(`保存附件失败 (${attachment.filename}):`, error)
        }
      }
    }

    return emailId
  }

  /**
   * 从IMAP消息更新邮件记录
   */
  private async updateEmailFromIMAP(
    existingEmail: EmailData,
    message: IMAPMessage
  ): Promise<void> {
    const updates: Partial<EmailData> = {
      isRead: message.flags.includes('\\Seen'),
      isStarred: message.flags.includes('\\Flagged'),
      isDeleted: message.flags.includes('\\Deleted'),
    }

    // 只更新状态变化的字段
    const hasChanges = Object.entries(updates).some(
      ([key, value]) => existingEmail[key as keyof EmailData] !== value
    )

    if (hasChanges) {
      await this.emailDAO.update(existingEmail.id!, updates)
    }
  }

  /**
   * 标记邮件为已读
   */
  async markEmailAsRead(accountId: string, emailId: string): Promise<void> {
    const client = this.clients.get(accountId)
    if (!client) {
      throw new Error(`账户 ${accountId} 未连接`)
    }

    const email = await this.emailDAO.getById(emailId)
    if (!email) {
      throw new Error(`邮件不存在: ${emailId}`)
    }

    const folder = await this.folderDAO.getById(email.folderId)
    if (!folder) {
      throw new Error(`文件夹不存在: ${email.folderId}`)
    }

    // 在IMAP服务器上标记为已读
    // 注意：这里需要UID，实际实现中需要存储UID
    // await client.markAsRead(folder.name, uid)

    // 更新本地数据库
    await this.emailDAO.update(emailId, { isRead: true })
  }

  /**
   * 获取账户连接状态
   */
  getAccountStatus(accountId: string): {
    connected: boolean
    lastSync?: Date
    error?: string
  } {
    const client = this.clients.get(accountId)
    return {
      connected: client?.isConnectedToServer() || false,
      // TODO: 实现最后同步时间跟踪
    }
  }

  /**
   * 获取所有账户状态
   */
  getAllAccountsStatus(): Record<string, {
    connected: boolean
    lastSync?: Date
    error?: string
  }> {
    const status: Record<string, any> = {}

    for (const [accountId, client] of this.clients) {
      status[accountId] = {
        connected: client.isConnectedToServer(),
        // TODO: 实现最后同步时间跟踪
      }
    }

    return status
  }

  /**
   * 扁平化文件夹结构
   */
  private flattenFolders(folders: any[], parent?: string): any[] {
    const result: any[] = []

    for (const folder of folders) {
      const fullName = parent ? `${parent}${folder.delimiter}${folder.name}` : folder.name
      result.push({
        ...folder,
        name: fullName,
      })

      if (folder.children) {
        result.push(...this.flattenFolders(folder.children, fullName))
      }
    }

    return result
  }

  /**
   * 确定文件夹类型
   */
  private determineFolderType(name: string, flags: string[]): FolderData['type'] {
    const lowerName = name.toLowerCase()

    if (flags.includes('\\Inbox') || lowerName.includes('inbox') || lowerName === 'inbox') {
      return 'inbox'
    }
    if (flags.includes('\\Sent') || lowerName.includes('sent') || lowerName.includes('已发送')) {
      return 'sent'
    }
    if (flags.includes('\\Drafts') || lowerName.includes('draft') || lowerName.includes('草稿')) {
      return 'drafts'
    }
    if (flags.includes('\\Trash') || lowerName.includes('trash') || lowerName.includes('垃圾')) {
      return 'trash'
    }

    return 'custom'
  }

  /**
   * 获取文件夹排序顺序
   */
  private getFolderSortOrder(type: FolderData['type']): number {
    switch (type) {
      case 'inbox': return 1
      case 'sent': return 2
      case 'drafts': return 3
      case 'trash': return 4
      default: return 10
    }
  }
}

export default IMAPService