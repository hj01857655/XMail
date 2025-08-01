const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 5001

// 中间件
app.use(cors())
app.use(express.json())

// 数据库连接
let db

async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'email_manager'
    })
    console.log('✅ MySQL 数据库连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

// API 路由

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    await db.execute('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

// 获取所有账户
app.get('/api/accounts', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM accounts WHERE is_active = 1')
    res.json(rows)
  } catch (error) {
    console.error('获取账户失败:', error)
    res.status(500).json({ error: '获取账户失败' })
  }
})

// 获取文件夹
app.get('/api/folders', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT f.*, a.name as account_name 
      FROM folders f 
      LEFT JOIN accounts a ON f.account_id = a.id 
      WHERE f.is_active = 1 
      ORDER BY f.sort_order
    `)
    res.json(rows)
  } catch (error) {
    console.error('获取文件夹失败:', error)
    res.status(500).json({ error: '获取文件夹失败' })
  }
})

// 获取邮件列表
app.get('/api/emails', async (req, res) => {
  try {
    const { folderId, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let query = `
      SELECT e.*, f.name as folder_name, a.name as account_name
      FROM emails e
      LEFT JOIN folders f ON e.folder_id = f.id
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE e.is_deleted = 0
    `
    const params = []

    if (folderId) {
      query += ' AND e.folder_id = ?'
      params.push(folderId)
    }

    query += ' ORDER BY e.date_received DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), offset)

    const [rows] = await db.execute(query, params)

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM emails WHERE is_deleted = 0'
    const countParams = []
    if (folderId) {
      countQuery += ' AND folder_id = ?'
      countParams.push(folderId)
    }

    const [countResult] = await db.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      emails: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('获取邮件失败:', error)
    res.status(500).json({ error: '获取邮件失败' })
  }
})

// 获取联系人
app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM contacts ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.error('获取联系人失败:', error)
    res.status(500).json({ error: '获取联系人失败' })
  }
})

// 邮箱连接测试
const mailboxTester = require('./simple-mailbox-tester')

// 测试邮箱连接
app.post('/api/test-mailbox', async (req, res) => {
  try {
    const { email, password, customConfig } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' })
    }

    let results
    if (customConfig) {
      results = [await mailboxTester.testCustomMailbox(email, password, customConfig)]
    } else {
      results = await mailboxTester.testMailboxComprehensive(email, password)
    }

    res.json({
      success: true,
      results,
      report: mailboxTester.generateTestReport(results)
    })
  } catch (error) {
    console.error('邮箱测试失败:', error)
    res.status(500).json({ error: '邮箱测试失败', details: error.message })
  }
})

// 获取支持的邮箱提供商
app.get('/api/email-providers', (req, res) => {
  try {
    const providers = Object.entries(mailboxTester.EMAIL_PROVIDERS).map(([key, provider]) => ({
      key,
      name: provider.name,
      domains: provider.domains
    }))
    res.json(providers)
  } catch (error) {
    console.error('获取邮箱提供商失败:', error)
    res.status(500).json({ error: '获取邮箱提供商失败' })
  }
})

// 仪表板统计数据
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // 获取邮件统计
    const [emailStats] = await db.execute(`
      SELECT
        COUNT(*) as totalEmails,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unreadEmails,
        SUM(CASE WHEN DATE(date_received) = CURDATE() THEN 1 ELSE 0 END) as todayEmails
      FROM emails
      WHERE is_deleted = 0
    `)

    // 获取账户统计
    const [accountStats] = await db.execute(`
      SELECT
        COUNT(*) as totalAccounts,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeAccounts
      FROM accounts
    `)

    const stats = {
      totalEmails: emailStats[0]?.totalEmails || 0,
      unreadEmails: emailStats[0]?.unreadEmails || 0,
      todayEmails: emailStats[0]?.todayEmails || 0,
      totalAccounts: accountStats[0]?.totalAccounts || 0,
      activeAccounts: accountStats[0]?.activeAccounts || 0
    }

    res.json(stats)
  } catch (error) {
    console.error('获取仪表板统计失败:', error)
    res.status(500).json({ error: '获取仪表板统计失败' })
  }
})

// 账户状态
app.get('/api/dashboard/accounts-status', async (req, res) => {
  try {
    const [accounts] = await db.execute(`
      SELECT
        a.id,
        a.name,
        a.email,
        a.is_active,
        a.last_sync_at,
        COUNT(e.id) as unreadCount
      FROM accounts a
      LEFT JOIN emails e ON a.id = e.account_id AND e.is_read = 0 AND e.is_deleted = 0
      GROUP BY a.id, a.name, a.email, a.is_active, a.last_sync_at
      ORDER BY a.name
    `)

    const accountStatuses = accounts.map(account => ({
      id: account.id,
      name: account.name,
      email: account.email,
      status: account.is_active ? 'connected' : 'disconnected',
      lastSync: account.last_sync_at,
      unreadCount: parseInt(account.unreadCount) || 0
    }))

    res.json(accountStatuses)
  } catch (error) {
    console.error('获取账户状态失败:', error)
    res.status(500).json({ error: '获取账户状态失败' })
  }
})

// 启动服务器
async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功，端口: ${PORT}`)
    console.log(`📧 XMail 后端服务运行中...`)
    console.log(`🔗 API 地址: http://localhost:${PORT}/api`)
  })
}

startServer().catch(console.error)
