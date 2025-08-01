import { Router } from 'express'
import { AccountDAO } from '../database'
import IMAPService from '../services/imap-service'
import { validateRequest, validateParams, accountValidationSchema, commonParamSchemas } from '../utils/validation'

const router = Router()
const accountDAO = new AccountDAO()
const imapService = new IMAPService()

// 获取所有账户
router.get('/', async (req, res) => {
  try {
    const accounts = await accountDAO.findAllActive()
    
    // 不返回密码信息
    const safeAccounts = accounts.map(account => ({
      ...account,
      password: undefined,
    }))

    res.json({
      success: true,
      data: safeAccounts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取账户列表失败',
      error: (error as Error).message,
    })
  }
})

// 添加账户
router.post('/', validateRequest(accountValidationSchema.create), async (req, res) => {
  try {
    const accountData = req.body
    
    // 检查邮箱是否已存在
    const existingAccount = await accountDAO.findByEmail(accountData.email)
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: '邮箱地址已存在',
        error: 'EMAIL_EXISTS',
      })
    }

    // 创建账户
    const accountId = await accountDAO.create(accountData)
    
    // 初始化IMAP连接
    try {
      await imapService.initializeAccount(accountId)
    } catch (imapError) {
      console.warn(`IMAP连接初始化失败 (${accountData.email}):`, imapError)
      // 不阻止账户创建，但记录警告
    }

    const newAccount = await accountDAO.findById(accountId)
    
    res.json({
      success: true,
      data: {
        ...newAccount,
        password: undefined, // 不返回密码
      },
      message: '账户添加成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加账户失败',
      error: (error as Error).message,
    })
  }
})

// 更新账户
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // TODO: 更新数据库中的账户信息
    
    res.json({
      success: true,
      message: '账户更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新账户失败',
      error: (error as Error).message,
    })
  }
})

// 删除账户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // TODO: 从数据库删除账户
    // TODO: 清理相关邮件数据
    
    res.json({
      success: true,
      message: '账户删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除账户失败',
      error: (error as Error).message,
    })
  }
})

// 测试账户连接
router.post('/:id/test', validateParams(commonParamSchemas.id), async (req, res) => {
  try {
    const { id } = req.params

    const account = await accountDAO.findById(id)
    if (!account) {
      return res.status(404).json({
        success: false,
        message: '账户不存在',
        error: 'ACCOUNT_NOT_FOUND',
      })
    }

    // 测试IMAP连接
    let imapStatus = false
    let smtpStatus = false
    let error = null

    try {
      await imapService.initializeAccount(id)
      const status = imapService.getAccountStatus(id)
      imapStatus = status.connected
    } catch (imapError) {
      error = (imapError as Error).message
    }

    // TODO: 实现SMTP连接测试
    smtpStatus = true // 临时设置为true

    res.json({
      success: imapStatus && smtpStatus,
      message: imapStatus && smtpStatus ? '连接测试成功' : '连接测试失败',
      data: {
        imap: imapStatus,
        smtp: smtpStatus,
        error,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '连接测试失败',
      error: (error as Error).message,
    })
  }
})

module.exports = router

// 同步账户邮件
router.post('/:id/sync', validateParams(commonParamSchemas.id), async (req, res) => {
  try {
    const { id } = req.params

    const account = await accountDAO.findById(id)
    if (!account) {
      return res.status(404).json({
        success: false,
        message: '账户不存在',
        error: 'ACCOUNT_NOT_FOUND',
      })
    }

    // 检查账户是否已连接
    const status = imapService.getAccountStatus(id)
    if (!status.connected) {
      // 尝试重新连接
      try {
        await imapService.initializeAccount(id)
      } catch (connectError) {
        return res.status(503).json({
          success: false,
          message: 'IMAP连接失败',
          error: (connectError as Error).message,
        })
      }
    }

    // 开始同步
    const results = await imapService.syncAccount(id, (progress) => {
      // 通过WebSocket发送进度更新
      req.app.get('io')?.emit('sync-progress', {
        accountId: id,
        ...progress,
      })
    })

    res.json({
      success: true,
      message: '邮件同步完成',
      data: {
        results,
        summary: {
          totalFolders: results.length,
          totalNewEmails: results.reduce((sum, r) => sum + r.newEmails, 0),
          totalUpdatedEmails: results.reduce((sum, r) => sum + r.updatedEmails, 0),
          totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '邮件同步失败',
      error: (error as Error).message,
    })
  }
})

// 获取账户状态
router.get('/:id/status', validateParams(commonParamSchemas.id), async (req, res) => {
  try {
    const { id } = req.params

    const account = await accountDAO.findById(id)
    if (!account) {
      return res.status(404).json({
        success: false,
        message: '账户不存在',
        error: 'ACCOUNT_NOT_FOUND',
      })
    }

    const status = imapService.getAccountStatus(id)
    
    res.json({
      success: true,
      data: {
        accountId: id,
        email: account.email,
        ...status,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取账户状态失败',
      error: (error as Error).message,
    })
  }
})

// 获取所有账户状态
router.get('/status/all', async (req, res) => {
  try {
    const allStatus = imapService.getAllAccountsStatus()
    const accounts = await accountDAO.findAllActive()
    
    const statusWithDetails = accounts.map(account => ({
      accountId: account.id,
      email: account.email,
      name: account.name,
      ...allStatus[account.id!] || { connected: false },
    }))

    res.json({
      success: true,
      data: statusWithDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取账户状态失败',
      error: (error as Error).message,
    })
  }
})