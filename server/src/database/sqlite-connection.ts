import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import fs from 'fs'

export class SQLiteManager {
  private static instance: SQLiteManager
  private db: Database | null = null
  private dbPath: string

  private constructor() {
    // 确保数据库目录存在
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    this.dbPath = path.join(dbDir, 'email_manager.db')
  }

  public static getInstance(): SQLiteManager {
    if (!SQLiteManager.instance) {
      SQLiteManager.instance = new SQLiteManager()
    }
    return SQLiteManager.instance
  }

  public async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })
      
      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON')
      
      console.log(`✅ SQLite 数据库连接成功: ${this.dbPath}`)
    } catch (error) {
      console.error('❌ SQLite 数据库连接失败:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      console.log('SQLite 数据库连接已关闭')
    }
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('数据库未连接，请先调用 connect() 方法')
    }
    return this.db
  }

  public async initializeSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未连接')
    }

    try {
      const schemaPath = path.join(__dirname, 'sqlite-schema.sql')
      const schema = fs.readFileSync(schemaPath, 'utf8')
      
      // 分割 SQL 语句并执行
      const statements = schema.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.exec(statement)
        }
      }
      
      console.log('✅ 数据库表结构初始化完成')
    } catch (error) {
      console.error('❌ 数据库表结构初始化失败:', error)
      throw error
    }
  }

  public async seedData(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未连接')
    }

    try {
      // 检查是否已有数据
      const userCount = await this.db.get('SELECT COUNT(*) as count FROM users')
      if (userCount.count > 0) {
        console.log('数据库已有数据，跳过种子数据插入')
        return
      }

      // 插入默认用户
      const userId = await this.db.run(`
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@xmail.com', 'hashed_password', '管理员'])

      console.log(`默认用户创建成功，ID: ${userId.lastID}`)

      // 插入测试邮箱账户
      const accountResult = await this.db.run(`
        INSERT INTO accounts (user_id, name, email, imap_host, imap_port, imap_secure, 
                             smtp_host, smtp_port, smtp_secure, username, password_encrypted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId.lastID,
        '测试邮箱',
        'test@example.com',
        'imap.example.com',
        993,
        1,
        'smtp.example.com',
        587,
        1,
        'test@example.com',
        'encrypted_password'
      ])

      const accountId = accountResult.lastID
      console.log(`测试账户创建成功，ID: ${accountId}`)

      // 创建默认文件夹
      const folders = [
        { name: '收件箱', type: 'inbox', sort_order: 1 },
        { name: '已发送', type: 'sent', sort_order: 2 },
        { name: '草稿箱', type: 'drafts', sort_order: 3 },
        { name: '垃圾箱', type: 'trash', sort_order: 4 },
        { name: '工作', type: 'custom', sort_order: 5, color: '#1890ff' },
        { name: '个人', type: 'custom', sort_order: 6, color: '#52c41a' }
      ]

      for (const folder of folders) {
        await this.db.run(`
          INSERT INTO folders (account_id, name, type, sort_order, color)
          VALUES (?, ?, ?, ?, ?)
        `, [accountId, folder.name, folder.type, folder.sort_order, folder.color || null])
      }

      console.log('默认文件夹创建完成')

      // 插入测试联系人
      const contacts = [
        { name: '张三', email: 'zhangsan@company.com', phone: '13800138000', notes: '公司同事' },
        { name: '李四', email: 'lisi@example.com', phone: '13900139000', notes: '朋友' },
        { name: '王五', email: 'wangwu@test.com', notes: '客户' }
      ]

      for (const contact of contacts) {
        await this.db.run(`
          INSERT INTO contacts (user_id, name, email, phone, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [userId.lastID, contact.name, contact.email, contact.phone || null, contact.notes])
      }

      console.log('测试联系人创建完成')

      // 插入一些测试邮件
      const inboxFolder = await this.db.get(`
        SELECT id FROM folders WHERE account_id = ? AND type = 'inbox'
      `, [accountId])

      if (inboxFolder) {
        const testEmails = [
          {
            subject: '欢迎使用 XMail 邮箱管理系统',
            from: JSON.stringify({ name: 'XMail 团队', address: 'team@xmail.com' }),
            to: JSON.stringify([{ name: '用户', address: 'test@example.com' }]),
            body_text: '欢迎使用 XMail 邮箱管理系统！这是一个功能强大的邮件管理工具。',
            date_received: new Date().toISOString()
          },
          {
            subject: '项目进度更新',
            from: JSON.stringify({ name: '张三', address: 'zhangsan@company.com' }),
            to: JSON.stringify([{ name: '用户', address: 'test@example.com' }]),
            body_text: '项目当前进度良好，预计下周完成第一阶段开发。',
            date_received: new Date(Date.now() - 3600000).toISOString(),
            is_read: 1,
            is_starred: 1
          }
        ]

        for (const email of testEmails) {
          await this.db.run(`
            INSERT INTO emails (account_id, folder_id, message_id, subject, from_address, 
                               to_addresses, body_text, date_received, is_read, is_starred)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            accountId,
            inboxFolder.id,
            `msg-${Date.now()}-${Math.random()}`,
            email.subject,
            email.from,
            email.to,
            email.body_text,
            email.date_received,
            email.is_read || 0,
            email.is_starred || 0
          ])
        }

        console.log('测试邮件创建完成')
      }

      console.log('✅ 种子数据插入完成')
    } catch (error) {
      console.error('❌ 种子数据插入失败:', error)
      throw error
    }
  }

  public async healthCheck(): Promise<{ sqlite: boolean }> {
    try {
      if (!this.db) {
        return { sqlite: false }
      }
      
      await this.db.get('SELECT 1')
      return { sqlite: true }
    } catch (error) {
      return { sqlite: false }
    }
  }
}
