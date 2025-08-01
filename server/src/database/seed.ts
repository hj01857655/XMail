import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import DatabaseManager from './connection'

export class DatabaseSeeder {
  private db: DatabaseManager

  constructor() {
    this.db = DatabaseManager.getInstance()
  }

  // 执行数据库种子数据填充
  public async seed(): Promise<void> {
    try {
      console.log('开始填充种子数据...')

      // 创建测试用户
      const users = await this.createTestUsers()
      console.log('测试用户创建完成')

      // 创建测试邮箱账户
      const accounts = await this.createTestAccounts(users)
      console.log('测试邮箱账户创建完成')

      // 创建文件夹
      const folders = await this.createTestFolders(accounts)
      console.log('测试文件夹创建完成')

      // 创建测试邮件
      await this.createTestEmails(accounts, folders)
      console.log('测试邮件创建完成')

      // 创建测试联系人
      await this.createTestContacts(users)
      console.log('测试联系人创建完成')

      console.log('种子数据填充完成')
    } catch (error) {
      console.error('种子数据填充失败:', error)
      throw error
    }
  }

  // 创建测试用户
  private async createTestUsers(): Promise<any[]> {
    const users = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: '测试用户',
      },
      {
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123',
        displayName: '演示用户',
      },
    ]

    const createdUsers = []

    for (const user of users) {
      // 检查用户是否已存在
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      )

      if (existingUser.rows.length > 0) {
        console.log(`用户 ${user.email} 已存在，跳过创建`)
        createdUsers.push(existingUser.rows[0])
        continue
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(user.password, 10)

      // 创建用户
      const result = await this.db.query(`
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, display_name
      `, [user.username, user.email, passwordHash, user.displayName])

      createdUsers.push(result.rows[0])
      console.log(`创建用户: ${user.email}`)
    }

    return createdUsers
  }

  // 创建测试邮箱账户
  private async createTestAccounts(users: any[]): Promise<any[]> {
    const accounts = [
      {
        userId: users[0].id,
        name: '个人邮箱',
        email: 'personal@gmail.com',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        username: 'personal@gmail.com',
        password: 'encrypted_password_1',
      },
      {
        userId: users[0].id,
        name: '工作邮箱',
        email: 'work@company.com',
        imapHost: 'mail.company.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'mail.company.com',
        smtpPort: 587,
        smtpSecure: true,
        username: 'work@company.com',
        password: 'encrypted_password_2',
      },
    ]

    const createdAccounts = []

    for (const account of accounts) {
      // 检查账户是否已存在
      const existingAccount = await this.db.query(
        'SELECT id FROM accounts WHERE email = $1 AND user_id = $2',
        [account.email, account.userId]
      )

      if (existingAccount.rows.length > 0) {
        console.log(`账户 ${account.email} 已存在，跳过创建`)
        createdAccounts.push(existingAccount.rows[0])
        continue
      }

      // 创建账户
      const result = await this.db.query(`
        INSERT INTO accounts (
          user_id, name, email, imap_host, imap_port, imap_secure,
          smtp_host, smtp_port, smtp_secure, username, password_encrypted
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, name, email
      `, [
        account.userId, account.name, account.email,
        account.imapHost, account.imapPort, account.imapSecure,
        account.smtpHost, account.smtpPort, account.smtpSecure,
        account.username, account.password
      ])

      createdAccounts.push(result.rows[0])
      console.log(`创建账户: ${account.email}`)
    }

    return createdAccounts
  }

  // 创建测试文件夹
  private async createTestFolders(accounts: any[]): Promise<any[]> {
    const folderTypes = [
      { name: '收件箱', type: 'inbox' },
      { name: '已发送', type: 'sent' },
      { name: '草稿箱', type: 'drafts' },
      { name: '垃圾箱', type: 'trash' },
      { name: '工作', type: 'custom', color: '#1890ff' },
      { name: '个人', type: 'custom', color: '#52c41a' },
      { name: '重要', type: 'custom', color: '#fa541c' },
    ]

    const createdFolders = []

    for (const account of accounts) {
      for (const folder of folderTypes) {
        // 检查文件夹是否已存在
        const existingFolder = await this.db.query(
          'SELECT id FROM folders WHERE account_id = $1 AND name = $2',
          [account.id, folder.name]
        )

        if (existingFolder.rows.length > 0) {
          createdFolders.push(existingFolder.rows[0])
          continue
        }

        // 创建文件夹
        const result = await this.db.query(`
          INSERT INTO folders (account_id, name, type, color)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, type
        `, [account.id, folder.name, folder.type, folder.color || null])

        createdFolders.push(result.rows[0])
      }
    }

    console.log(`为 ${accounts.length} 个账户创建了文件夹`)
    return createdFolders
  }

  // 创建测试邮件
  private async createTestEmails(accounts: any[], folders: any[]): Promise<void> {
    const sampleEmails = [
      {
        subject: '欢迎使用邮箱管理系统',
        fromAddress: { name: '系统管理员', address: 'admin@system.com' },
        toAddresses: [{ name: '用户', address: 'user@example.com' }],
        bodyText: '欢迎使用我们的邮箱管理系统！这个系统提供了强大的邮件管理功能。',
        bodyHtml: '<h2>欢迎使用邮箱管理系统</h2><p>这个系统提供了强大的邮件管理功能。</p>',
        isRead: false,
        isStarred: true,
        hasAttachments: false,
      },
      {
        subject: '项目进度更新',
        fromAddress: { name: '张三', address: 'zhangsan@company.com' },
        toAddresses: [{ name: '用户', address: 'user@example.com' }],
        ccAddresses: [{ name: '李四', address: 'lisi@company.com' }],
        bodyText: '项目当前进度良好，预计下周完成第一阶段开发。',
        bodyHtml: '<p>项目当前进度良好，预计下周完成第一阶段开发。</p>',
        isRead: true,
        isStarred: false,
        hasAttachments: true,
      },
      {
        subject: '会议邀请：产品评审会',
        fromAddress: { name: '王五', address: 'wangwu@company.com' },
        toAddresses: [{ name: '用户', address: 'user@example.com' }],
        bodyText: '邀请您参加明天下午2点的产品评审会议。',
        bodyHtml: '<p>邀请您参加明天下午2点的产品评审会议。</p>',
        isRead: false,
        isStarred: false,
        hasAttachments: false,
      },
    ]

    // 获取收件箱文件夹
    const inboxFolders = folders.filter(f => f.type === 'inbox')

    for (const account of accounts) {
      const accountInbox = inboxFolders.find(f => f.account_id === account.id)
      if (!accountInbox) continue

      for (const email of sampleEmails) {
        const messageId = `${uuidv4()}@system.com`
        
        await this.db.query(`
          INSERT INTO emails (
            account_id, folder_id, message_id, subject,
            from_address, to_addresses, cc_addresses,
            body_text, body_html, date_received, date_sent,
            is_read, is_starred, has_attachments
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          account.id, accountInbox.id, messageId, email.subject,
          JSON.stringify(email.fromAddress),
          JSON.stringify(email.toAddresses),
          JSON.stringify(email.ccAddresses || null),
          email.bodyText, email.bodyHtml,
          new Date(), new Date(),
          email.isRead, email.isStarred, email.hasAttachments
        ])
      }
    }

    console.log(`为 ${accounts.length} 个账户创建了测试邮件`)
  }

  // 创建测试联系人
  private async createTestContacts(users: any[]): Promise<void> {
    const sampleContacts = [
      {
        name: '张三',
        email: 'zhangsan@company.com',
        phone: '13800138000',
        company: 'ABC公司',
        notes: '项目经理，负责产品开发',
      },
      {
        name: '李四',
        email: 'lisi@company.com',
        phone: '13900139000',
        company: 'ABC公司',
        notes: '技术总监',
      },
      {
        name: '王五',
        email: 'wangwu@company.com',
        phone: '13700137000',
        company: 'ABC公司',
        notes: '产品经理',
      },
      {
        name: '赵六',
        email: 'zhaoliu@partner.com',
        phone: '13600136000',
        company: '合作伙伴公司',
        notes: '商务合作联系人',
      },
    ]

    for (const user of users) {
      for (const contact of sampleContacts) {
        // 检查联系人是否已存在
        const existingContact = await this.db.query(
          'SELECT id FROM contacts WHERE user_id = $1 AND email = $2',
          [user.id, contact.email]
        )

        if (existingContact.rows.length > 0) {
          continue
        }

        // 创建联系人
        await this.db.query(`
          INSERT INTO contacts (user_id, name, email, phone, company, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [user.id, contact.name, contact.email, contact.phone, contact.company, contact.notes])
      }
    }

    console.log(`为 ${users.length} 个用户创建了测试联系人`)
  }

  // 清理种子数据
  public async clearSeedData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不能在生产环境中清理数据')
    }

    try {
      console.log('清理种子数据...')

      // 按依赖关系顺序删除数据
      await this.db.query('DELETE FROM attachments')
      await this.db.query('DELETE FROM email_search_index')
      await this.db.query('DELETE FROM emails')
      await this.db.query('DELETE FROM contact_group_members')
      await this.db.query('DELETE FROM contact_groups')
      await this.db.query('DELETE FROM contacts')
      await this.db.query('DELETE FROM folders')
      await this.db.query('DELETE FROM accounts')
      await this.db.query('DELETE FROM email_rules')
      await this.db.query('DELETE FROM user_settings')
      await this.db.query('DELETE FROM users')

      console.log('种子数据清理完成')
    } catch (error) {
      console.error('清理种子数据失败:', error)
      throw error
    }
  }
}

// 如果直接运行此文件，执行种子数据填充
if (require.main === module) {
  const seeder = new DatabaseSeeder()
  
  seeder.seed()
    .then(() => {
      console.log('种子数据填充完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('种子数据填充失败:', error)
      process.exit(1)
    })
}

export default DatabaseSeeder