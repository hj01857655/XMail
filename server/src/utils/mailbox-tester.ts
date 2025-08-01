/**
 * 邮箱提供商测试工具
 * 用于测试不同邮箱服务商的连接和配置
 */

import { IMAPClient } from '../services/imap-client'
import { EmailProviderConfig, detectEmailProvider, getProviderByName } from '../config/email-providers'
import { OAuth2Service, OAuth2ConfigManager } from '../services/oauth2-service'
import { AccountData } from '../database/account-dao'

export interface ConnectionTestResult {
  success: boolean
  provider: string
  connectionType: 'imap' | 'smtp' | 'oauth2'
  message: string
  details?: any
  duration: number
}

export class MailboxTester {
  /**
   * 测试IMAP连接
   */
  static async testIMAPConnection(
    email: string,
    password: string,
    config?: Partial<EmailProviderConfig>
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now()
    
    try {
      // 自动检测或使用提供的配置
      const provider = config ? { ...detectEmailProvider(email)!, ...config } : detectEmailProvider(email)
      
      if (!provider) {
        return {
          success: false,
          provider: 'unknown',
          connectionType: 'imap',
          message: '无法识别邮箱服务商，请手动配置',
          duration: Date.now() - startTime
        }
      }

      // 创建测试账户数据
      const testAccount: AccountData = {
        id: 'test-' + Date.now(),
        userId: 'test-user',
        name: 'Test Account',
        email: email,
        imapHost: provider.imap.host,
        imapPort: provider.imap.port,
        imapSecure: provider.imap.secure,
        smtpHost: provider.smtp.host,
        smtpPort: provider.smtp.port,
        smtpSecure: provider.smtp.secure,
        username: email,
        password: password,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 创建IMAP客户端并测试连接
      const imapClient = new IMAPClient(testAccount)
      await imapClient.connect()
      
      // 测试获取文件夹列表
      const folders = await imapClient.getFolders()
      
      // 关闭连接
      await imapClient.disconnect()

      return {
        success: true,
        provider: provider.name,
        connectionType: 'imap',
        message: `IMAP连接成功，发现${folders.length}个文件夹`,
        details: {
          host: provider.imap.host,
          port: provider.imap.port,
          secure: provider.imap.secure,
          folders: folders.slice(0, 5).map(f => f.name) // 只显示前5个文件夹
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        provider: config?.name || 'auto-detected',
        connectionType: 'imap',
        message: `IMAP连接失败: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 测试SMTP连接
   */
  static async testSMTPConnection(
    email: string,
    password: string,
    config?: Partial<EmailProviderConfig>
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now()
    
    try {
      const provider = config ? { ...detectEmailProvider(email)!, ...config } : detectEmailProvider(email)
      
      if (!provider) {
        return {
          success: false,
          provider: 'unknown',
          connectionType: 'smtp',
          message: '无法识别邮箱服务商',
          duration: Date.now() - startTime
        }
      }

      // 使用nodemailer测试SMTP连接
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        host: provider.smtp.host,
        port: provider.smtp.port,
        secure: provider.smtp.secure,
        auth: {
          user: email,
          pass: password
        }
      })

      // 验证连接
      await transporter.verify()

      return {
        success: true,
        provider: provider.name,
        connectionType: 'smtp',
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
        provider: config?.name || 'auto-detected',
        connectionType: 'smtp',
        message: `SMTP连接失败: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 测试OAuth2认证
   */
  static async testOAuth2Flow(
    providerName: string,
    authCode: string
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now()
    
    try {
      const provider = getProviderByName(providerName)
      const oauthConfig = OAuth2ConfigManager.getConfig(providerName)
      
      if (!provider || !provider.oauth) {
        return {
          success: false,
          provider: providerName,
          connectionType: 'oauth2',
          message: '该提供商不支持OAuth2认证',
          duration: Date.now() - startTime
        }
      }

      if (!oauthConfig) {
        return {
          success: false,
          provider: providerName,
          connectionType: 'oauth2',
          message: 'OAuth2配置未找到，请检查环境变量',
          duration: Date.now() - startTime
        }
      }

      // 交换授权码获取令牌
      const token = await OAuth2Service.exchangeCodeForToken(provider, oauthConfig, authCode)
      
      // 验证令牌
      const isValid = await OAuth2Service.validateToken(provider, token)
      
      if (!isValid) {
        return {
          success: false,
          provider: providerName,
          connectionType: 'oauth2',
          message: '获取的访问令牌无效',
          duration: Date.now() - startTime
        }
      }

      return {
        success: true,
        provider: providerName,
        connectionType: 'oauth2',
        message: 'OAuth2认证成功',
        details: {
          tokenType: token.tokenType,
          expiresAt: token.expiresAt,
          hasRefreshToken: !!token.refreshToken
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        provider: providerName,
        connectionType: 'oauth2',
        message: `OAuth2认证失败: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 综合测试邮箱配置
   */
  static async testMailboxComprehensive(
    email: string,
    password: string,
    testOAuth: boolean = false
  ): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = []
    
    // 自动检测提供商
    const provider = detectEmailProvider(email)
    
    if (!provider) {
      results.push({
        success: false,
        provider: 'unknown',
        connectionType: 'imap',
        message: '无法自动检测邮箱服务商，请手动配置',
        duration: 0
      })
      return results
    }

    // 测试IMAP连接
    const imapResult = await this.testIMAPConnection(email, password)
    results.push(imapResult)

    // 测试SMTP连接
    const smtpResult = await this.testSMTPConnection(email, password)
    results.push(smtpResult)

    // 如果支持OAuth2且要求测试，添加OAuth2测试说明
    if (testOAuth && provider.oauth && OAuth2ConfigManager.isConfigured(provider.name)) {
      results.push({
        success: false,
        provider: provider.name,
        connectionType: 'oauth2',
        message: 'OAuth2测试需要授权码，请通过认证流程获取',
        details: {
          authUrl: OAuth2Service.generateAuthUrl(
            provider,
            OAuth2ConfigManager.getConfig(provider.name)!,
            'test-state'
          )
        },
        duration: 0
      })
    }

    return results
  }

  /**
   * 批量测试多个邮箱配置
   */
  static async batchTest(
    configurations: Array<{
      email: string
      password: string
      provider?: string
    }>
  ): Promise<Map<string, ConnectionTestResult[]>> {
    const results = new Map<string, ConnectionTestResult[]>()
    
    for (const config of configurations) {
      console.log(`测试邮箱: ${config.email}`)
      
      const testResults = await this.testMailboxComprehensive(
        config.email,
        config.password
      )
      
      results.set(config.email, testResults)
      
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }

  /**
   * 生成测试报告
   */
  static generateTestReport(results: Map<string, ConnectionTestResult[]>): string {
    let report = '# 邮箱连接测试报告\\n\\n'
    report += `测试时间: ${new Date().toLocaleString()}\\n\\n`
    
    results.forEach((testResults, email) => {
      report += `## ${email}\\n\\n`
      
      testResults.forEach(result => {
        const status = result.success ? '✅' : '❌'
        report += `### ${status} ${result.connectionType.toUpperCase()} 测试\\n`
        report += `- **提供商**: ${result.provider}\\n`
        report += `- **结果**: ${result.message}\\n`
        report += `- **耗时**: ${result.duration}ms\\n`
        
        if (result.details) {
          report += `- **详情**: ${JSON.stringify(result.details, null, 2)}\\n`
        }
        
        report += '\\n'
      })
    })
    
    return report
  }
}