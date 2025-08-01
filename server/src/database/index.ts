// 数据访问层统一导出
export { default as BaseDAO } from './base-dao'
export { default as AccountDAO } from './account-dao'
export { default as EmailDAO } from './email-dao'
export { default as FolderDAO } from './folder-dao'
export { default as ContactDAO } from './contact-dao'
export { default as AttachmentDAO } from './attachment-dao'
export { default as MigrationManager } from './migrations'

// 导出类型定义
export type { AccountData } from './account-dao'
export type { EmailData, EmailAddress } from './email-dao'
export type { FolderData, FolderWithStats } from './folder-dao'
export type { ContactData } from './contact-dao'
export type { AttachmentData } from './attachment-dao'
export type { PaginationOptions, PaginatedResult } from './base-dao'