/**
 * 简化版邮箱连接测试工具
 * 适配当前简化的JavaScript服务器架构
 */

const mysql = require('mysql2/promise')
const nodemailer = require('nodemailer')

// 邮箱提供商配置
const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: true }
  },
  outlook: {
    name: 'Outlook/Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: true }
  },
  qq: {
    name: 'QQ邮箱',
    domains: ['qq.com'],
    imap: { host: 'imap.qq.com', port: 993, secure: true },
    smtp: { host: 'smtp.qq.com', port: 587, secure: true }
  },
  '163': {
    name: '163邮箱',
    domains: ['163.com'],
    imap: { host: 'imap.163.com', port: 993, secure: true },
    smtp: { host: 'smtp.163.com', port: 587, secure: true }
  },
  '126': {
    name: '126邮箱',
    domains: ['126.com'],
    imap: { host: 'imap.126.com', port: 993, secure: true },
    smtp: { host: 'smtp.126.com', port: 587, secure: true }
  }
}

/**
 * 根据邮箱地址检测提供商
 */
function detectEmailProvider(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return { key, ...provider }
    }
  }
  return null
}

/**
 * 测试SMTP连接
 */
async function testSMTPConnection(email, password, customConfig = null) {
  const startTime = Date.now()
  
  try {
    const provider = customConfig || detectEmailProvider(email)
    
    if (!provider) {
      return {
        success: false,
        provider: 'unknown',
        type: 'smtp',
        message: '无法识别邮箱服务商，请手动配置',
        duration: Date.now() - startTime
      }
    }

    const transporter = nodemailer.createTransporter({
      host: provider.smtp.host,
      port: provider.smtp.port,
      secure: provider.smtp.secure,
      auth: {
        user: email,
        pass: password
      },
      timeout: 10000 // 10秒超时
    })

    // 验证连接
    await transporter.verify()

    return {
      success: true,
      provider: provider.name,
      type: 'smtp',
      message: 'SMTP连接成功',
      details: {
        host: provider.smtp.host,
        port: provider.smtp.port,
        secure: provider.smtp.secure
      },
      duration: Date.now() - startTime
    }
  } catch (error) {
    return {
      success: false,
      provider: customConfig?.name || 'auto-detected',
      type: 'smtp',
      message: `SMTP连接失败: ${error.message}`,
      details: { error: error.message },
      duration: Date.now() - startTime
    }
  }
}

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  const startTime = Date.now()
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'email_manager'
    })

    await connection.execute('SELECT 1')
    await connection.end()

    return {
      success: true,
      provider: 'MySQL',
      type: 'database',
      message: '数据库连接成功',
      details: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'email_manager'
      },
      duration: Date.now() - startTime
    }
  } catch (error) {
    return {
      success: false,
      provider: 'MySQL',
      type: 'database',
      message: `数据库连接失败: ${error.message}`,
      details: { error: error.message },
      duration: Date.now() - startTime
    }
  }
}

/**
 * 综合测试邮箱配置
 */
async function testMailboxComprehensive(email, password) {
  const results = []
  
  // 测试数据库连接
  const dbResult = await testDatabaseConnection()
  results.push(dbResult)
  
  // 测试SMTP连接
  const smtpResult = await testSMTPConnection(email, password)
  results.push(smtpResult)
  
  return results
}

/**
 * 测试自定义邮箱配置
 */
async function testCustomMailbox(email, password, config) {
  const customProvider = {
    name: '自定义邮箱',
    smtp: {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure
    }
  }
  
  return await testSMTPConnection(email, password, customProvider)
}

/**
 * 生成测试报告
 */
function generateTestReport(results) {
  let report = '# 邮箱连接测试报告\n\n'
  report += `测试时间: ${new Date().toLocaleString()}\n\n`
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    report += `## ${status} ${result.type.toUpperCase()} 测试\n`
    report += `- **提供商**: ${result.provider}\n`
    report += `- **结果**: ${result.message}\n`
    report += `- **耗时**: ${result.duration}ms\n`
    
    if (result.details) {
      report += `- **详情**: ${JSON.stringify(result.details, null, 2)}\n`
    }
    
    report += '\n'
  })
  
  return report
}

module.exports = {
  detectEmailProvider,
  testSMTPConnection,
  testDatabaseConnection,
  testMailboxComprehensive,
  testCustomMailbox,
  generateTestReport,
  EMAIL_PROVIDERS
}
