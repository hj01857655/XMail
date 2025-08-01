import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import DatabaseManager from './config/database'
import MigrationManager from './database/migrations'
import IMAPService from './services/imap-service'

// 加载环境变量
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 5000
const imapService = new IMAPService()

// 将io实例添加到app中，供路由使用
app.set('io', io)

// 中间件
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 基础路由
app.get('/api/health', async (req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance()
    const health = await dbManager.healthCheck()
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: health
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    })
  }
})

// API 路由
app.use('/api/accounts', require('./routes/accounts'))
app.use('/api/emails', require('./routes/emails'))
app.use('/api/folders', require('./routes/folders'))
app.use('/api/contacts', require('./routes/contacts'))
app.use('/api/search', require('./routes/search'))

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id)

  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id)
  })

  // 邮件同步事件
  socket.on('sync-emails', async (accountId: string) => {
    try {
      console.log(`开始同步账户邮件: ${accountId}`)
      
      const results = await imapService.syncAccount(accountId, (progress) => {
        socket.emit('sync-progress', {
          accountId,
          ...progress,
        })
      })

      socket.emit('sync-completed', {
        accountId,
        results,
        summary: {
          totalFolders: results.length,
          totalNewEmails: results.reduce((sum, r) => sum + r.newEmails, 0),
          totalUpdatedEmails: results.reduce((sum, r) => sum + r.updatedEmails, 0),
          totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        },
      })
    } catch (error) {
      console.error(`同步账户邮件失败 (${accountId}):`, error)
      socket.emit('sync-error', {
        accountId,
        error: (error as Error).message,
      })
    }
  })

  // 获取账户状态
  socket.on('get-account-status', (accountId: string) => {
    const status = imapService.getAccountStatus(accountId)
    socket.emit('account-status', {
      accountId,
      ...status,
    })
  })

  // 获取所有账户状态
  socket.on('get-all-accounts-status', () => {
    const allStatus = imapService.getAllAccountsStatus()
    socket.emit('all-accounts-status', allStatus)
  })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  })
})

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    const dbManager = DatabaseManager.getInstance()
    await dbManager.connect()
    console.log('数据库连接初始化成功')

    // 执行数据库迁移
    const migrationManager = new MigrationManager()
    await migrationManager.migrate()
    console.log('数据库迁移完成')

    // 初始化IMAP服务
    try {
      await imapService.initializeAllAccounts()
      console.log('IMAP服务初始化完成')
    } catch (error) {
      console.warn('IMAP服务初始化失败:', error)
      // 不阻止服务器启动
    }

    // 设置IMAP服务事件监听
    imapService.on('accountConnected', (accountId) => {
      console.log(`IMAP账户连接成功: ${accountId}`)
      io.emit('account-connected', { accountId })
    })

    imapService.on('accountDisconnected', (accountId) => {
      console.log(`IMAP账户连接断开: ${accountId}`)
      io.emit('account-disconnected', { accountId })
    })

    imapService.on('accountError', (accountId, error) => {
      console.error(`IMAP账户错误 ${accountId}:`, error)
      io.emit('account-error', { accountId, error: error.message })
    })

    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`)
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭处理
const gracefulShutdown = async () => {
  console.log('收到关闭信号，开始优雅关闭...')
  
  try {
    // 关闭IMAP连接
    await imapService.disconnectAll()
    console.log('IMAP连接已关闭')

    // 关闭数据库连接
    const dbManager = DatabaseManager.getInstance()
    await dbManager.disconnect()
    console.log('数据库连接已关闭')
    
    // 关闭HTTP服务器
    server.close(() => {
      console.log('HTTP服务器已关闭')
      process.exit(0)
    })
  } catch (error) {
    console.error('优雅关闭失败:', error)
    process.exit(1)
  }
}

// 监听关闭信号
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// 启动服务器
startServer()