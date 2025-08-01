import Joi from 'joi'

// 基础验证规则
const emailSchema = Joi.string().email().required()
const uuidSchema = Joi.string().uuid().required()
const optionalUuidSchema = Joi.string().uuid().optional()

// 账户验证模式
export const accountValidationSchema = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    email: emailSchema,
    imapHost: Joi.string().min(1).max(255).required(),
    imapPort: Joi.number().integer().min(1).max(65535).required(),
    imapSecure: Joi.boolean().required(),
    smtpHost: Joi.string().min(1).max(255).required(),
    smtpPort: Joi.number().integer().min(1).max(65535).required(),
    smtpSecure: Joi.boolean().required(),
    username: Joi.string().min(1).max(255).required(),
    password: Joi.string().min(1).required(),
    isActive: Joi.boolean().optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    email: Joi.string().email().optional(),
    imapHost: Joi.string().min(1).max(255).optional(),
    imapPort: Joi.number().integer().min(1).max(65535).optional(),
    imapSecure: Joi.boolean().optional(),
    smtpHost: Joi.string().min(1).max(255).optional(),
    smtpPort: Joi.number().integer().min(1).max(65535).optional(),
    smtpSecure: Joi.boolean().optional(),
    username: Joi.string().min(1).max(255).optional(),
    password: Joi.string().min(1).optional(),
    isActive: Joi.boolean().optional(),
  }).min(1),
}

// 邮件验证模式
export const emailValidationSchema = {
  create: Joi.object({
    accountId: uuidSchema,
    folderId: uuidSchema,
    messageId: Joi.string().min(1).max(255).required(),
    subject: Joi.string().max(1000).optional(),
    fromAddress: Joi.object({
      name: Joi.string().max(255).optional(),
      address: emailSchema,
    }).required(),
    toAddresses: Joi.array().items(
      Joi.object({
        name: Joi.string().max(255).optional(),
        address: emailSchema,
      })
    ).min(1).required(),
    ccAddresses: Joi.array().items(
      Joi.object({
        name: Joi.string().max(255).optional(),
        address: emailSchema,
      })
    ).optional(),
    bccAddresses: Joi.array().items(
      Joi.object({
        name: Joi.string().max(255).optional(),
        address: emailSchema,
      })
    ).optional(),
    bodyText: Joi.string().optional(),
    bodyHtml: Joi.string().optional(),
    dateReceived: Joi.date().required(),
    dateSent: Joi.date().optional(),
    isRead: Joi.boolean().default(false),
    isStarred: Joi.boolean().default(false),
    isDeleted: Joi.boolean().default(false),
    hasAttachments: Joi.boolean().default(false),
    sizeBytes: Joi.number().integer().min(0).default(0),
  }),

  update: Joi.object({
    folderId: optionalUuidSchema,
    subject: Joi.string().max(1000).optional(),
    bodyText: Joi.string().optional(),
    bodyHtml: Joi.string().optional(),
    isRead: Joi.boolean().optional(),
    isStarred: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    hasAttachments: Joi.boolean().optional(),
  }).min(1),

  batchUpdate: Joi.object({
    ids: Joi.array().items(uuidSchema).min(1).required(),
    updates: Joi.object({
      isRead: Joi.boolean().optional(),
      isStarred: Joi.boolean().optional(),
      folderId: optionalUuidSchema,
    }).min(1).required(),
  }),
}

// 文件夹验证模式
export const folderValidationSchema = {
  create: Joi.object({
    accountId: uuidSchema,
    name: Joi.string().min(1).max(255).required(),
    type: Joi.string().valid('inbox', 'sent', 'drafts', 'trash', 'custom').required(),
    parentId: optionalUuidSchema,
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    sortOrder: Joi.number().integer().min(0).default(0),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    parentId: optionalUuidSchema,
    sortOrder: Joi.number().integer().min(0).optional(),
  }).min(1),

  move: Joi.object({
    newParentId: optionalUuidSchema,
  }),

  updateSortOrder: Joi.array().items(
    Joi.object({
      id: uuidSchema,
      sortOrder: Joi.number().integer().min(0).required(),
    })
  ).min(1).required(),
}

// 联系人验证模式
export const contactValidationSchema = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    email: emailSchema,
    phone: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    avatarUrl: Joi.string().uri().optional(),
    frequencyScore: Joi.number().integer().min(0).default(0),
    lastContacted: Joi.date().optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    avatarUrl: Joi.string().uri().optional(),
    frequencyScore: Joi.number().integer().min(0).optional(),
    lastContacted: Joi.date().optional(),
  }).min(1),

  batchImport: Joi.array().items(
    Joi.object({
      name: Joi.string().min(1).max(255).required(),
      email: emailSchema,
      phone: Joi.string().max(50).optional(),
      notes: Joi.string().max(1000).optional(),
    })
  ).min(1).max(1000).required(),
}

// 附件验证模式
export const attachmentValidationSchema = {
  create: Joi.object({
    emailId: uuidSchema,
    filename: Joi.string().min(1).max(255).required(),
    contentType: Joi.string().min(1).max(255).required(),
    sizeBytes: Joi.number().integer().min(0).required(),
    filePath: Joi.string().min(1).required(),
    checksum: Joi.string().optional(),
  }),
}

// 分页验证模式
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  orderBy: Joi.string().optional(),
  orderDirection: Joi.string().valid('ASC', 'DESC').default('DESC'),
})

// 搜索验证模式
export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(1000).optional(),
  from: Joi.string().email().optional(),
  to: Joi.string().email().optional(),
  subject: Joi.string().max(1000).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  hasAttachments: Joi.boolean().optional(),
  isRead: Joi.boolean().optional(),
  folderId: optionalUuidSchema,
  accountId: optionalUuidSchema,
}).min(1)

// 验证中间件工厂函数
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors,
      })
    }

    // 将验证后的数据替换原始数据
    req.body = value
    next()
  }
}

// 验证查询参数的中间件
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: '查询参数验证失败',
        errors,
      })
    }

    req.query = value
    next()
  }
}

// 验证路径参数的中间件
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: '路径参数验证失败',
        errors,
      })
    }

    req.params = value
    next()
  }
}

// 常用的参数验证模式
export const commonParamSchemas = {
  id: Joi.object({
    id: uuidSchema,
  }),
  
  accountId: Joi.object({
    accountId: uuidSchema,
  }),
  
  emailId: Joi.object({
    emailId: uuidSchema,
  }),
  
  folderId: Joi.object({
    folderId: uuidSchema,
  }),
  
  contactId: Joi.object({
    contactId: uuidSchema,
  }),
}

export default {
  accountValidationSchema,
  emailValidationSchema,
  folderValidationSchema,
  contactValidationSchema,
  attachmentValidationSchema,
  paginationSchema,
  searchSchema,
  validateRequest,
  validateQuery,
  validateParams,
  commonParamSchemas,
}