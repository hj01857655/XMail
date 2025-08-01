import { BaseDAO, PaginationOptions, PaginatedResult } from './base-dao'

export interface EmailAddress {
  name?: string
  address: string
}

export interface EmailData {
  id?: string
  accountId: string
  folderId: string
  messageId: string
  subject?: string
  fromAddress: EmailAddress
  toAddresses: EmailAddress[]
  ccAddresses?: EmailAddress[]
  bccAddresses?: EmailAddress[]
  bodyText?: string
  bodyHtml?: string
  dateReceived: Date
  dateSent?: Date
  isRead: boolean
  isStarred: boolean
  isDeleted: boolean
  hasAttachments: boolean
  sizeBytes: number
  createdAt?: Date
  updatedAt?: Date
}

export interface EmailFilter {
  accountId?: string
  folderId?: string
  isRead?: boolean
  isStarred?: boolean
  isDeleted?: boolean
  hasAttachments?: boolean
  fromAddress?: string
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface EmailStats {
  total: number
  unread: number
  starred: number
  withAttachments: number
}

export class EmailDAO extends BaseDAO {
  private readonly tableName = 'emails'

  /**
   * 根据ID获取邮件
   */
  async getById(id: string): Promise<EmailData | null> {
    const result = await super.findById<any>(this.tableName, id)
    if (!result) return null

    return {
      id: result.id,
      accountId: result.account_id,
      folderId: result.folder_id,
      messageId: result.message_id,
      subject: result.subject,
      fromAddress: JSON.parse(result.from_address || '{}'),
      toAddresses: JSON.parse(result.to_addresses || '[]'),
      ccAddresses: JSON.parse(result.cc_addresses || '[]'),
      bccAddresses: JSON.parse(result.bcc_addresses || '[]'),
      bodyText: result.body_text,
      bodyHtml: result.body_html,
      dateReceived: result.date_received,
      dateSent: result.date_sent,
      isRead: result.is_read,
      isStarred: result.is_starred,
      isDeleted: result.is_deleted,
      hasAttachments: result.has_attachments,
      sizeBytes: result.size_bytes,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }
  }

  /**
   * 创建邮件
   */
  async create(emailData: EmailData): Promise<string> {
    const data = {
      account_id: emailData.accountId,
      folder_id: emailData.folderId,
      message_id: emailData.messageId,
      subject: emailData.subject,
      from_address: JSON.stringify(emailData.fromAddress),
      to_addresses: JSON.stringify(emailData.toAddresses),
      cc_addresses: emailData.ccAddresses ? JSON.stringify(emailData.ccAddresses) : null,
      bcc_addresses: emailData.bccAddresses ? JSON.stringify(emailData.bccAddresses) : null,
      body_text: emailData.bodyText,
      body_html: emailData.bodyHtml,
      date_received: emailData.dateReceived,
      date_sent: emailData.dateSent,
      is_read: emailData.isRead,
      is_starred: emailData.isStarred,
      is_deleted: emailData.isDeleted,
      has_attachments: emailData.hasAttachments,
      size_bytes: emailData.sizeBytes,
    }

    return await this.insertAndReturnId(this.tableName, data)
  }

  /**
   * 根据ID获取邮件
   */
  async getEmailById(id: string): Promise<EmailData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND is_deleted = false`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToEmail(result.rows[0])
  }

  /**
   * 根据消息ID获取邮件
   */
  async findByMessageId(accountId: string, messageId: string): Promise<EmailData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE account_id = $1 AND message_id = $2`,
      [accountId, messageId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToEmail(result.rows[0])
  }

  /**
   * 分页获取邮件列表
   */
  async findWithPagination(
    filter: EmailFilter,
    options: PaginationOptions
  ): Promise<PaginatedResult<EmailData>> {
    const conditions: Record<string, any> = {
      is_deleted: false, // 默认不显示已删除的邮件
    }

    if (filter.accountId) conditions.account_id = filter.accountId
    if (filter.folderId) conditions.folder_id = filter.folderId
    if (filter.isRead !== undefined) conditions.is_read = filter.isRead
    if (filter.isStarred !== undefined) conditions.is_starred = filter.isStarred
    if (filter.isDeleted !== undefined) conditions.is_deleted = filter.isDeleted
    if (filter.hasAttachments !== undefined) conditions.has_attachments = filter.hasAttachments

    const { whereClause, params, nextParamIndex } = this.buildWhereClause(conditions)
    let finalWhereClause = whereClause
    let finalParams = [...params]

    // 添加发件人过滤
    if (filter.fromAddress) {
      const fromCondition = finalWhereClause ? ' AND ' : 'WHERE '
      finalWhereClause += `${fromCondition}from_address->>'address' ILIKE $${nextParamIndex}`
      finalParams.push(`%${filter.fromAddress}%`)
    }

    // 添加日期范围过滤
    let paramIndex = finalParams.length + 1
    if (filter.dateFrom) {
      const dateCondition = finalWhereClause ? ' AND ' : 'WHERE '
      finalWhereClause += `${dateCondition}date_received >= $${paramIndex++}`
      finalParams.push(filter.dateFrom)
    }
    if (filter.dateTo) {
      const dateCondition = finalWhereClause ? ' AND ' : 'WHERE '
      finalWhereClause += `${dateCondition}date_received <= $${paramIndex++}`
      finalParams.push(filter.dateTo)
    }

    // 添加全文搜索
    if (filter.search) {
      const searchCondition = finalWhereClause ? ' AND ' : 'WHERE '
      finalWhereClause += `${searchCondition}(
        subject ILIKE $${paramIndex} OR 
        body_text ILIKE $${paramIndex + 1} OR
        from_address->>'name' ILIKE $${paramIndex + 2} OR
        from_address->>'address' ILIKE $${paramIndex + 3}
      )`
      const searchTerm = `%${filter.search}%`
      finalParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    const baseQuery = `SELECT * FROM ${this.tableName} ${finalWhereClause}`
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${finalWhereClause}`

    const result = await this.paginatedQuery<any>(
      baseQuery,
      countQuery,
      finalParams,
      { ...options, orderBy: options.orderBy || 'date_received' }
    )

    return {
      ...result,
      items: result.items.map(row => this.mapRowToEmail(row)),
    }
  }

  /**
   * 更新邮件
   */
  async update(id: string, emailData: Partial<EmailData>): Promise<boolean> {
    const updateData: Record<string, any> = {}

    if (emailData.folderId) updateData.folder_id = emailData.folderId
    if (emailData.subject !== undefined) updateData.subject = emailData.subject
    if (emailData.bodyText !== undefined) updateData.body_text = emailData.bodyText
    if (emailData.bodyHtml !== undefined) updateData.body_html = emailData.bodyHtml
    if (emailData.isRead !== undefined) updateData.is_read = emailData.isRead
    if (emailData.isStarred !== undefined) updateData.is_starred = emailData.isStarred
    if (emailData.isDeleted !== undefined) updateData.is_deleted = emailData.isDeleted
    if (emailData.hasAttachments !== undefined) updateData.has_attachments = emailData.hasAttachments

    if (Object.keys(updateData).length === 0) {
      return false
    }

    return await this.updateById(this.tableName, id, updateData)
  }

  /**
   * 批量更新邮件状态
   */
  async batchUpdateStatus(
    ids: string[],
    updates: { isRead?: boolean; isStarred?: boolean; folderId?: string; isDeleted?: boolean }
  ): Promise<number> {
    if (ids.length === 0) return 0

    const updateData: Record<string, any> = {}
    if (updates.isRead !== undefined) updateData.is_read = updates.isRead
    if (updates.isStarred !== undefined) updateData.is_starred = updates.isStarred
    if (updates.folderId) updateData.folder_id = updates.folderId

    if (Object.keys(updateData).length === 0) return 0

    const setClauses = Object.keys(updateData).map(
      (key, index) => `${key} = $${index + 1}`
    )
    const placeholders = ids.map((_, index) => `$${Object.keys(updateData).length + index + 1}`)

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders.join(', ')})
    `

    const result = await this.query(query, [...Object.values(updateData), ...ids])
    return result.rowCount
  }

  /**
   * 软删除邮件
   */
  async softDelete(id: string): Promise<boolean> {
    return await this.update(id, { isDeleted: true })
  }

  /**
   * 批量软删除
   */
  async batchSoftDelete(ids: string[]): Promise<number> {
    return await this.batchUpdateStatus(ids, { isDeleted: true })
  }

  /**
   * 永久删除邮件
   */
  async permanentDelete(id: string): Promise<boolean> {
    return await this.deleteById(this.tableName, id)
  }

  /**
   * 获取文件夹邮件统计
   */
  async getFolderStats(folderId: string): Promise<EmailStats> {
    const result = await this.query<{
      total: string
      unread: string
      starred: string
      with_attachments: string
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_starred = true) as starred,
        COUNT(*) FILTER (WHERE has_attachments = true) as with_attachments
      FROM ${this.tableName}
      WHERE folder_id = $1 AND is_deleted = false`,
      [folderId]
    )

    const stats = result.rows[0]
    return {
      total: parseInt(stats.total),
      unread: parseInt(stats.unread),
      starred: parseInt(stats.starred),
      withAttachments: parseInt(stats.with_attachments),
    }
  }

  /**
   * 获取账户邮件统计
   */
  async getAccountStats(accountId: string): Promise<EmailStats> {
    const result = await this.query<{
      total: string
      unread: string
      starred: string
      with_attachments: string
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_starred = true) as starred,
        COUNT(*) FILTER (WHERE has_attachments = true) as with_attachments
      FROM ${this.tableName}
      WHERE account_id = $1 AND is_deleted = false`,
      [accountId]
    )

    const stats = result.rows[0]
    return {
      total: parseInt(stats.total),
      unread: parseInt(stats.unread),
      starred: parseInt(stats.starred),
      withAttachments: parseInt(stats.with_attachments),
    }
  }

  /**
   * 全文搜索邮件
   */
  async fullTextSearch(
    query: string,
    accountId?: string,
    options: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<EmailData>> {
    let whereClause = `WHERE to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')) @@ plainto_tsquery('english', $1) AND is_deleted = false`
    const params: any[] = [query]

    if (accountId) {
      whereClause += ` AND account_id = $2`
      params.push(accountId)
    }

    const baseQuery = `
      SELECT *, 
        ts_rank(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')), plainto_tsquery('english', $1)) as rank
      FROM ${this.tableName} 
      ${whereClause}
    `
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`

    const result = await this.paginatedQuery<any>(
      baseQuery,
      countQuery,
      params,
      { ...options, orderBy: 'rank', orderDirection: 'DESC' }
    )

    return {
      ...result,
      items: result.items.map(row => this.mapRowToEmail(row)),
    }
  }

  /**
   * 检查邮件是否存在
   */
  async existsByMessageId(accountId: string, messageId: string): Promise<boolean> {
    return await this.exists(
      this.tableName,
      'account_id = $1 AND message_id = $2',
      [accountId, messageId]
    )
  }

  /**
   * 获取最新邮件的接收时间
   */
  async getLatestEmailDate(accountId: string, folderId?: string): Promise<Date | null> {
    let query = `SELECT MAX(date_received) as latest_date FROM ${this.tableName} WHERE account_id = $1`
    const params: any[] = [accountId]

    if (folderId) {
      query += ` AND folder_id = $2`
      params.push(folderId)
    }

    const result = await this.query<{ latest_date: Date | null }>(query, params)
    return result.rows[0]?.latest_date || null
  }

  /**
   * 批量插入邮件
   */
  async batchCreate(emails: EmailData[]): Promise<void> {
    if (emails.length === 0) return

    const columns = [
      'account_id', 'folder_id', 'message_id', 'subject', 'from_address',
      'to_addresses', 'cc_addresses', 'bcc_addresses', 'body_text', 'body_html',
      'date_received', 'date_sent', 'is_read', 'is_starred', 'is_deleted',
      'has_attachments', 'size_bytes'
    ]

    const data = emails.map(email => [
      email.accountId,
      email.folderId,
      email.messageId,
      email.subject,
      JSON.stringify(email.fromAddress),
      JSON.stringify(email.toAddresses),
      email.ccAddresses ? JSON.stringify(email.ccAddresses) : null,
      email.bccAddresses ? JSON.stringify(email.bccAddresses) : null,
      email.bodyText,
      email.bodyHtml,
      email.dateReceived,
      email.dateSent,
      email.isRead,
      email.isStarred,
      email.isDeleted,
      email.hasAttachments,
      email.sizeBytes,
    ])

    await this.batchInsert(this.tableName, columns, data)
  }

  /**
   * 将数据库行映射为邮件对象
   */
  private mapRowToEmail(row: any): EmailData {
    return {
      id: row.id,
      accountId: row.account_id,
      folderId: row.folder_id,
      messageId: row.message_id,
      subject: row.subject,
      fromAddress: JSON.parse(row.from_address),
      toAddresses: JSON.parse(row.to_addresses),
      ccAddresses: row.cc_addresses ? JSON.parse(row.cc_addresses) : undefined,
      bccAddresses: row.bcc_addresses ? JSON.parse(row.bcc_addresses) : undefined,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      dateReceived: row.date_received,
      dateSent: row.date_sent,
      isRead: row.is_read,
      isStarred: row.is_starred,
      isDeleted: row.is_deleted,
      hasAttachments: row.has_attachments,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export default EmailDAO