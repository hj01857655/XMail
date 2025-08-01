/**
 * 邮箱服务提供商配置
 * 支持全球主要邮箱服务商的IMAP/SMTP配置
 */

export interface EmailProviderConfig {
  name: string
  displayName: string
  domains: string[]
  imap: {
    host: string
    port: number
    secure: boolean
  }
  smtp: {
    host: string
    port: number
    secure: boolean
  }
  oauth?: {
    authUrl: string
    tokenUrl: string
    scopes: string[]
    clientIdRequired: boolean
  }
  features?: {
    supportsOAuth: boolean
    requiresAppPassword: boolean
    supportsPOP3: boolean
    maxAttachmentSize?: number
  }
  notes?: string
}

export const EMAIL_PROVIDERS: Record<string, EmailProviderConfig> = {
  // Google Gmail
  gmail: {
    name: 'gmail',
    displayName: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: true
    },
    oauth: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
      clientIdRequired: true
    },
    features: {
      supportsOAuth: true,
      requiresAppPassword: true,
      supportsPOP3: true,
      maxAttachmentSize: 25 * 1024 * 1024
    },
    notes: '需要开启2FA并使用应用专用密码，或使用OAuth2'
  },

  // Microsoft Outlook/Hotmail/Live
  outlook: {
    name: 'outlook',
    displayName: 'Outlook/Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.office365.com',
      port: 587,
      secure: true
    },
    oauth: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'],
      clientIdRequired: true
    },
    features: {
      supportsOAuth: true,
      requiresAppPassword: false,
      supportsPOP3: true,
      maxAttachmentSize: 34 * 1024 * 1024
    }
  },

  // Tencent QQ Mail
  qq: {
    name: 'qq',
    displayName: 'QQ邮箱',
    domains: ['qq.com', 'vip.qq.com', 'foxmail.com'],
    imap: {
      host: 'imap.qq.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.qq.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true,
      maxAttachmentSize: 50 * 1024 * 1024
    },
    notes: '需要开启IMAP/SMTP服务并使用授权码'
  },

  // NetEase 163 Mail
  netease163: {
    name: 'netease163',
    displayName: '网易163邮箱',
    domains: ['163.com', '126.com', 'yeah.net'],
    imap: {
      host: 'imap.163.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.163.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true,
      maxAttachmentSize: 50 * 1024 * 1024
    },
    notes: '需要开启IMAP/SMTP服务并使用授权码'
  },

  // Sina Mail
  sina: {
    name: 'sina',
    displayName: '新浪邮箱',
    domains: ['sina.com', 'sina.cn', 'vip.sina.com'],
    imap: {
      host: 'imap.sina.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.sina.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: false,
      supportsPOP3: true
    }
  },

  // Yahoo Mail
  yahoo: {
    name: 'yahoo',
    displayName: 'Yahoo Mail',
    domains: ['yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.com.au'],
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true,
      maxAttachmentSize: 25 * 1024 * 1024
    },
    notes: '需要生成应用专用密码'
  },

  // Apple iCloud
  icloud: {
    name: 'icloud',
    displayName: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    imap: {
      host: 'imap.mail.me.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.mail.me.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: false,
      maxAttachmentSize: 20 * 1024 * 1024
    },
    notes: '需要开启2FA并使用应用专用密码'
  },

  // Yandex Mail
  yandex: {
    name: 'yandex',
    displayName: 'Yandex Mail',
    domains: ['yandex.com', 'yandex.ru', 'ya.ru'],
    imap: {
      host: 'imap.yandex.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.yandex.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true
    }
  },

  // ProtonMail (Bridge required)
  protonmail: {
    name: 'protonmail',
    displayName: 'ProtonMail',
    domains: ['protonmail.com', 'protonmail.ch', 'pm.me'],
    imap: {
      host: '127.0.0.1',
      port: 1143,
      secure: false
    },
    smtp: {
      host: '127.0.0.1',
      port: 1025,
      secure: false
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: false,
      supportsPOP3: false
    },
    notes: '需要安装ProtonMail Bridge客户端'
  },

  // Zoho Mail
  zoho: {
    name: 'zoho',
    displayName: 'Zoho Mail',
    domains: ['zoho.com', 'zohomail.com'],
    imap: {
      host: 'imap.zoho.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.zoho.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true
    }
  },

  // FastMail
  fastmail: {
    name: 'fastmail',
    displayName: 'FastMail',
    domains: ['fastmail.com', 'fastmail.fm'],
    imap: {
      host: 'imap.fastmail.com',
      port: 993,
      secure: true
    },
    smtp: {
      host: 'smtp.fastmail.com',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: true,
      supportsPOP3: true
    }
  },

  // Generic/Custom provider
  custom: {
    name: 'custom',
    displayName: '自定义邮箱',
    domains: [],
    imap: {
      host: '',
      port: 993,
      secure: true
    },
    smtp: {
      host: '',
      port: 587,
      secure: true
    },
    features: {
      supportsOAuth: false,
      requiresAppPassword: false,
      supportsPOP3: true
    },
    notes: '手动配置IMAP/SMTP服务器'
  }
}

/**
 * 根据邮箱地址自动检测服务提供商
 */
export function detectEmailProvider(email: string): EmailProviderConfig | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  for (const provider of Object.values(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return provider
    }
  }

  return null
}

/**
 * 获取所有支持的邮箱提供商列表
 */
export function getAllProviders(): EmailProviderConfig[] {
  return Object.values(EMAIL_PROVIDERS).filter(p => p.name !== 'custom')
}

/**
 * 根据名称获取提供商配置
 */
export function getProviderByName(name: string): EmailProviderConfig | null {
  return EMAIL_PROVIDERS[name] || null
}

/**
 * 验证邮箱配置是否完整
 */
export function validateEmailConfig(config: Partial<EmailProviderConfig>): string[] {
  const errors: string[] = []

  if (!config.imap?.host) {
    errors.push('IMAP服务器地址不能为空')
  }

  if (!config.imap?.port || config.imap.port < 1 || config.imap.port > 65535) {
    errors.push('IMAP端口必须是1-65535之间的数字')
  }

  if (!config.smtp?.host) {
    errors.push('SMTP服务器地址不能为空')
  }

  if (!config.smtp?.port || config.smtp.port < 1 || config.smtp.port > 65535) {
    errors.push('SMTP端口必须是1-65535之间的数字')
  }

  return errors
}