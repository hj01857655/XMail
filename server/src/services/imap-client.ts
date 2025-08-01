import Imap from 'node-imap'
import { simpleParser, ParsedMail, Attachment } from 'mailparser'
import { EventEmitter } from 'events'
import { AccountData } from '../database/account-dao'
import { EmailData, EmailAddress } from '../database/email-dao'
import { FolderData } from '../database/folder-dao'
import { AttachmentData } from '../database/attachment-dao'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export interface IMAPFolder {
  name: string
  delimiter: string
  flags: string[]
  children?: IMAPFolder[]
}

export interface IMAPMessage {
  uid: number
  messageId: string
  subject: string
  from: EmailAddress[]
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  date: Date
  flags: string[]
  bodyText?: string
  bodyHtml?: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
    content: Buffer
  }>
  size: number
}

export interface SyncProgress {
  current: number
  total: number
  status: 'connecting' | 'syncing' | 'completed' | 'error'
  message: string
}

export class IMAPClient extends EventEmitter {
  private imap: Imap | null = null
  private account: AccountData
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 5000

  constructor(account: AccountData) {
    super()
    this.account = account
  }

  /**
   * 连接到IMAP服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.imap = new Imap({
          user: this.account.username,
          password: this.account.password,
          host: this.account.imapHost,
          port: this.account.imapPort,
          tls: this.account.imapSecure,
          tlsOptions: {
            rejectUnauthorized: false, // 在生产环境中应该设置为true
          },
          connTimeout: 60000,
          authTimeout: 30000,
          keepalive: true,
        })

        this.imap.once('ready', () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected')
          console.log(`IMAP连接成功: ${this.account.email}`)
          resolve()
        })

        this.imap.once('error', (error) => {
          this.isConnected = false
          console.error(`IMAP连接错误 (${this.account.email}):`, error)
          this.handleConnectionError(error)
          reject(error)
        })

        this.imap.once('end', () => {
          this.isConnected = false
          this.emit('disconnected')
          console.log(`IMAP连接已断开: ${this.account.email}`)
        })

        this.imap.connect()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开IMAP连接
   */
  async disconnect(): Promise<void> {
    if (this.imap && this.isConnected) {
      this.imap.end()
      this.isConnected = false
    }
  }

  /**
   * 获取文件夹列表
   */
  async getFolders(): Promise<IMAPFolder[]> {
    if (!this.imap || !this.isConnected) {
      throw new Error('IMAP未连接')
    }

    return new Promise((resolve, reject) => {
      this.imap!.getBoxes((error, boxes) => {
        if (error) {
          reject(error)
          return
        }

        const folders = this.parseBoxes(boxes)
        resolve(folders)
      })
    })
  }

  /**
   * 打开指定文件夹
   */
  async openFolder(folderName: string, readOnly: boolean = true): Promise<void> {
    if (!this.imap || !this.isConnected) {
      throw new Error('IMAP未连接')
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, readOnly, (error, box) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  /**
   * 获取文件夹中的邮件列表
   */
  async getMessages(
    folderName: string,
    options: {
      since?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<IMAPMessage[]> {
    await this.openFolder(folderName)

    return new Promise((resolve, reject) => {
      // 构建搜索条件
      const searchCriteria: any[] = ['ALL']
      if (options.since) {
        searchCriteria.push(['SINCE', options.since])
      }

      this.imap!.search(searchCriteria, (error, results) => {
        if (error) {
          reject(error)
          return
        }

        if (!results || results.length === 0) {
          resolve([])
          return
        }

        // 应用分页
        let messageIds = results
        if (options.offset || options.limit) {
          const start = options.offset || 0
          const end = options.limit ? start + options.limit : undefined
          messageIds = results.slice(start, end)
        }

        this.fetchMessages(messageIds)
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * 获取单个邮件的完整内容
   */
  async getMessage(folderName: string, uid: number): Promise<IMAPMessage | null> {
    await this.openFolder(folderName)

    const messages = await this.fetchMessages([uid])
    return messages[0] || null
  }

  /**
   * 标记邮件为已读
   */
  async markAsRead(folderName: string, uid: number): Promise<void> {
    await this.openFolder(folderName, false) // 需要写权限

    return new Promise((resolve, reject) => {
      this.imap!.addFlags(uid, '\\Seen', (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  /**
   * 标记邮件为未读
   */
  async markAsUnread(folderName: string, uid: number): Promise<void> {
    await this.openFolder(folderName, false)

    return new Promise((resolve, reject) => {
      this.imap!.delFlags(uid, '\\Seen', (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  /**
   * 移动邮件到指定文件夹
   */
  async moveMessage(uid: number, targetFolder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap!.move(uid, targetFolder, (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  /**
   * 删除邮件
   */
  async deleteMessage(uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap!.addFlags(uid, '\\Deleted', (error) => {
        if (error) {
          reject(error)
          return
        }

        // 执行expunge以永久删除
        this.imap!.expunge((expungeError) => {
          if (expungeError) {
            reject(expungeError)
            return
          }
          resolve()
        })
      })
    })
  }

  /**
   * 同步文件夹邮件
   */
  async syncFolder(
    folderName: string,
    lastSyncDate?: Date,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<IMAPMessage[]> {
    try {
      onProgress?.({
        current: 0,
        total: 0,
        status: 'connecting',
        message: `连接到文件夹: ${folderName}`,
      })

      await this.openFolder(folderName)

      // 获取邮件列表
      const searchCriteria: any[] = ['ALL']
      if (lastSyncDate) {
        searchCriteria.push(['SINCE', lastSyncDate])
      }

      const messageIds = await new Promise<number[]>((resolve, reject) => {
        this.imap!.search(searchCriteria, (error, results) => {
          if (error) reject(error)
          else resolve(results || [])
        })
      })

      if (messageIds.length === 0) {
        onProgress?.({
          current: 0,
          total: 0,
          status: 'completed',
          message: '没有新邮件',
        })
        return []
      }

      onProgress?.({
        current: 0,
        total: messageIds.length,
        status: 'syncing',
        message: `开始同步 ${messageIds.length} 封邮件`,
      })

      // 分批获取邮件以避免内存问题
      const batchSize = 50
      const allMessages: IMAPMessage[] = []

      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize)
        const batchMessages = await this.fetchMessages(batch)
        allMessages.push(...batchMessages)

        onProgress?.({
          current: Math.min(i + batchSize, messageIds.length),
          total: messageIds.length,
          status: 'syncing',
          message: `已同步 ${Math.min(i + batchSize, messageIds.length)}/${messageIds.length} 封邮件`,
        })
      }

      onProgress?.({
        current: messageIds.length,
        total: messageIds.length,
        status: 'completed',
        message: `同步完成，共 ${messageIds.length} 封邮件`,
      })

      return allMessages
    } catch (error) {
      onProgress?.({
        current: 0,
        total: 0,
        status: 'error',
        message: `同步失败: ${(error as Error).message}`,
      })
      throw error
    }
  }

  /**
   * 获取邮件内容
   */
  private async fetchMessages(messageIds: number[]): Promise<IMAPMessage[]> {
    if (messageIds.length === 0) return []

    return new Promise((resolve, reject) => {
      const messages: IMAPMessage[] = []
      const fetch = this.imap!.fetch(messageIds, {
        bodies: '',
        struct: true,
        envelope: true,
      })

      fetch.on('message', (msg, seqno) => {
        let buffer = Buffer.alloc(0)
        let attributes: any = null

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk])
          })
        })

        msg.once('attributes', (attrs) => {
          attributes = attrs
        })

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer)
            const imapMessage = await this.parseMessage(parsed, attributes)
            messages.push(imapMessage)
          } catch (error) {
            console.error('解析邮件失败:', error)
          }
        })
      })

      fetch.once('error', reject)
      fetch.once('end', () => resolve(messages))
    })
  }

  /**
   * 解析邮件内容
   */
  private async parseMessage(parsed: ParsedMail, attributes: any): Promise<IMAPMessage> {
    const message: IMAPMessage = {
      uid: attributes.uid,
      messageId: parsed.messageId || '',
      subject: parsed.subject || '',
      from: this.parseAddresses(parsed.from),
      to: this.parseAddresses(parsed.to),
      cc: this.parseAddresses(parsed.cc),
      bcc: this.parseAddresses(parsed.bcc),
      date: parsed.date || new Date(),
      flags: attributes.flags || [],
      bodyText: parsed.text,
      bodyHtml: parsed.html || undefined,
      attachments: [],
      size: attributes.size || 0,
    }

    // 处理附件
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const attachment of parsed.attachments) {
        message.attachments.push({
          filename: attachment.filename || 'unknown',
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.size || 0,
          content: attachment.content,
        })
      }
    }

    return message
  }

  /**
   * 解析邮件地址
   */
  private parseAddresses(addresses: any): EmailAddress[] {
    if (!addresses) return []

    const addressArray = Array.isArray(addresses) ? addresses : [addresses]
    return addressArray.map(addr => ({
      name: addr.name,
      address: addr.address,
    }))
  }

  /**
   * 解析文件夹结构
   */
  private parseBoxes(boxes: any, delimiter: string = '/'): IMAPFolder[] {
    const folders: IMAPFolder[] = []

    for (const [name, box] of Object.entries(boxes)) {
      const boxData = box as any
      const folder: IMAPFolder = {
        name,
        delimiter: boxData.delimiter || delimiter,
        flags: boxData.attribs || [],
      }

      if (boxData.children) {
        folder.children = this.parseBoxes(boxData.children, boxData.delimiter)
      }

      folders.push(folder)
    }

    return folders
  }

  /**
   * 处理连接错误和重连
   */
  private async handleConnectionError(error: Error): Promise<void> {
    this.emit('error', error)

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重连 IMAP (${this.reconnectAttempts}/${this.maxReconnectAttempts}): ${this.account.email}`)

      setTimeout(async () => {
        try {
          await this.connect()
        } catch (reconnectError) {
          console.error('IMAP重连失败:', reconnectError)
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error(`IMAP重连失败，已达到最大重试次数: ${this.account.email}`)
      this.emit('maxReconnectAttemptsReached', error)
    }
  }

  /**
   * 保存附件到本地
   */
  async saveAttachment(
    attachment: { filename: string; contentType: string; content: Buffer },
    emailId: string
  ): Promise<AttachmentData> {
    const uploadsDir = process.env.UPLOAD_DIR || 'uploads'
    const attachmentsDir = path.join(uploadsDir, 'attachments', emailId)

    // 确保目录存在
    await fs.mkdir(attachmentsDir, { recursive: true })

    // 生成安全的文件名
    const safeFilename = this.sanitizeFilename(attachment.filename)
    const filePath = path.join(attachmentsDir, safeFilename)

    // 保存文件
    await fs.writeFile(filePath, attachment.content)

    // 生成校验和
    const checksum = crypto
      .createHash('sha256')
      .update(attachment.content)
      .digest('hex')

    return {
      emailId,
      filename: attachment.filename,
      contentType: attachment.contentType,
      sizeBytes: attachment.content.length,
      filePath,
      checksum,
    }
  }

  /**
   * 清理文件名，移除不安全字符
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255)
  }

  /**
   * 检查连接状态
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.imap !== null
  }

  /**
   * 获取账户信息
   */
  getAccount(): AccountData {
    return this.account
  }
}

export default IMAPClient