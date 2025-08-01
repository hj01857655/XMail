// 邮箱账户类型
export interface Account {
  id: string;
  name: string;
  email: string;
  imapConfig: IMAPConfig;
  smtpConfig: SMTPConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

// 邮件类型
export interface Email {
  id: string;
  accountId: string;
  folderId: string;
  messageId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  bodyText?: string;
  bodyHtml?: string;
  dateReceived: Date;
  dateSent?: Date;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  filePath: string;
}

// 文件夹类型
export interface Folder {
  id: string;
  accountId: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom';
  parentId?: string;
  color?: string;
  children?: Folder[];
  unreadCount?: number;
}

// 联系人类型
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 搜索类型
export interface SearchParams {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  isRead?: boolean;
  folderId?: string;
}

// 用户设置类型
export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  emailCheckInterval: number; // 分钟
  showNotifications: boolean;
  autoMarkAsRead: boolean;
  defaultSignature?: string;
}

// WebSocket事件类型
export interface SocketEvents {
  'email-received': (email: Email) => void;
  'sync-progress': (progress: SyncProgress) => void;
  'notification': (notification: Notification) => void;
}

export interface SyncProgress {
  accountId: string;
  current: number;
  total: number;
  status: 'syncing' | 'completed' | 'error';
  message?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}