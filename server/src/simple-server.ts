import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 5001

// 中间件
app.use(cors())
app.use(express.json())

// 数据库连接
let db: mysql.Connection

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
    const params: any[] = []

    if (folderId) {
      query += ' AND e.folder_id = ?'
      params.push(folderId)
    }

    query += ' ORDER BY e.date_received DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), offset)

    const [rows] = await db.execute(query, params)

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM emails WHERE is_deleted = 0'
    const countParams: any[] = []
    if (folderId) {
      countQuery += ' AND folder_id = ?'
      countParams.push(folderId)
    }

    const [countResult] = await db.execute(countQuery, countParams) as any
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

// 获取单个邮件详情
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.execute(`
      SELECT e.*, f.name as folder_name, a.name as account_name
      FROM emails e
      LEFT JOIN folders f ON e.folder_id = f.id
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE e.id = ?
    `, [id])

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: '邮件不存在' })
    }

    res.json((rows as any[])[0])
  } catch (error) {
    console.error('获取邮件详情失败:', error)
    res.status(500).json({ error: '获取邮件详情失败' })
  }
})

// 标记邮件为已读
app.patch('/api/emails/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    const { isRead } = req.body

    await db.execute('UPDATE emails SET is_read = ? WHERE id = ?', [isRead, id])
    res.json({ success: true })
  } catch (error) {
    console.error('更新邮件状态失败:', error)
    res.status(500).json({ error: '更新邮件状态失败' })
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

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    await db.execute('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' })
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
