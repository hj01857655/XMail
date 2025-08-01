import { EMAIL_PROVIDERS, detectEmailProvider, getAllProviders, getProviderByName, type EmailProviderConfig } from '../../server/src/config/email-providers'

/**
 * 前端邮箱提供商配置工具
 */

// Re-export types and functions for frontend use
export type { EmailProviderConfig }
export { detectEmailProvider, getAllProviders, getProviderByName }

/**
 * 获取邮箱提供商的显示信息
 */
export function getProviderDisplayInfo(provider: EmailProviderConfig) {
  return {
    name: provider.displayName,
    domains: provider.domains.join(', '),
    requiresAppPassword: provider.features?.requiresAppPassword,
    supportsOAuth: provider.features?.supportsOAuth,
    notes: provider.notes
  }
}

/**
 * 为表单生成提供商选项
 */
export function getProviderOptions() {
  return getAllProviders().map(provider => ({
    label: provider.displayName,
    value: provider.name,
    domains: provider.domains,
    config: provider
  }))
}

/**
 * 根据邮箱地址自动填充配置
 */
export function autoFillConfigFromEmail(email: string) {
  const provider = detectEmailProvider(email)
  if (!provider) return null

  return {
    provider: provider.name,
    imapHost: provider.imap.host,
    imapPort: provider.imap.port,
    imapSecure: provider.imap.secure,
    smtpHost: provider.smtp.host,
    smtpPort: provider.smtp.port,
    smtpSecure: provider.smtp.secure,
    imapUsername: email,
    smtpUsername: email,
    requiresAppPassword: provider.features?.requiresAppPassword,
    supportsOAuth: provider.features?.supportsOAuth,
    notes: provider.notes
  }
}

/**
 * 获取常用邮箱提供商（按流行度排序）
 */
export function getPopularProviders() {
  const popularOrder = ['gmail', 'outlook', 'qq', 'netease163', 'yahoo', 'icloud']
  const providers = getAllProviders()
  
  return popularOrder
    .map(name => providers.find(p => p.name === name))
    .filter(Boolean) as EmailProviderConfig[]
}