import { BaseDAO, PaginationOptions, PaginatedResult } from './base-dao'
import { EncryptionUtil } from '../utils/encryption'

export interface AccountData {
  id?: string
  name: string
  email: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AccountFilter {
  email?: string
  isActive?: boolean
  search?: string
}

export class AccountDAO extends BaseDAO {
  private readonly tableName = 'accounts'

  /**
   * 根据ID查找账户
   */
  async getById(id: string): Promise<AccountData | null> {
    const result = await super.findById<any>(this.tableName, id)
    if (!result) return null

    return {
      id: result.id,
      name: result.name,
      email: result.email,
      imapHost: result.imap_host,
      imapPort: result.imap_port,
      imapSecure: result.imap_secure,
      smtpHost: result.smtp_host,
      smtpPort: result.smtp_port,
      smtpSecure: result.smtp_secure,
      username: result.username,
      password: EncryptionUtil.decrypt(result.password_encrypted),
      isActive: result.is_active,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }
  }

  /**
   * 创建账户
   */
  async create(accountData: AccountData): Promise<string> {
    // 加密密码
    const encryptedPassword = EncryptionUtil.encrypt(accountData.password)

    const data = {
      name: accountData.name,
      email: accountData.email,
      imap_host: accountData.imapHost,
      imap_port: accountData.imapPort,
      imap_secure: accountData.imapSecure,
      smtp_host: accountData.smtpHost,
      smtp_port: accountData.smtpPort,
      smtp_secure: accountData.smtpSecure,
      username: accountData.username,
      password: encryptedPassword,
      is_active: accountData.isActive ?? true,
    }

    return await this.insertAndReturnId(this.tableName, data)
  }

  /**
   * 根据ID获取账户
   */
  async getAccountById(id: string): Promise<AccountData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToAccount(result.rows[0])
  }

  /**
   * 根据邮箱地址获取账户
   */
  async findByEmail(email: string): Promise<AccountData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToAccount(result.rows[0])
  }

  /**
   * 获取所有活跃账户
   */
  async findAllActive(): Promise<AccountData[]> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY created_at DESC`
    )

    return result.rows.map(row => this.mapRowToAccount(row))
  }

  /**
   * 分页获取账户列表
   */
  async findWithPagination(
    filter: AccountFilter,
    options: PaginationOptions
  ): Promise<PaginatedResult<AccountData>> {
    const conditions: Record<string, any> = {}

    if (filter.email) {
      conditions.email = filter.email
    }

    if (filter.isActive !== undefined) {
      conditions.is_active = filter.isActive
    }

    let whereClause = ''
    let params: any[] = []

    if (Object.keys(conditions).length > 0) {
      const result = this.buildWhereClause(conditions)
      whereClause = result.whereClause
      params = result.params
    }

    // 添加搜索条件
    if (filter.search) {
      const searchCondition = whereClause ? ' AND ' : 'WHERE '
      whereClause += `${searchCondition}(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2})`
      params.push(`%${filter.search}%`, `%${filter.search}%`)
    }

    const baseQuery = `SELECT * FROM ${this.tableName} ${whereClause}`
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`

    const result = await this.paginatedQuery<any>(
      baseQuery,
      countQuery,
      params,
      { ...options, orderBy: options.orderBy || 'created_at' }
    )

    return {
      ...result,
      items: result.items.map(row => this.mapRowToAccount(row)),
    }
  }

  /**
   * 更新账户
   */
  async update(id: string, accountData: Partial<AccountData>): Promise<boolean> {
    const updateData: Record<string, any> = {}

    if (accountData.name) updateData.name = accountData.name
    if (accountData.email) updateData.email = accountData.email
    if (accountData.imapHost) updateData.imap_host = accountData.imapHost
    if (accountData.imapPort) updateData.imap_port = accountData.imapPort
    if (accountData.imapSecure !== undefined) updateData.imap_secure = accountData.imapSecure
    if (accountData.smtpHost) updateData.smtp_host = accountData.smtpHost
    if (accountData.smtpPort) updateData.smtp_port = accountData.smtpPort
    if (accountData.smtpSecure !== undefined) updateData.smtp_secure = accountData.smtpSecure
    if (accountData.username) updateData.username = accountData.username
    if (accountData.password) {
      updateData.password = EncryptionUtil.encrypt(accountData.password)
    }
    if (accountData.isActive !== undefined) updateData.is_active = accountData.isActive

    if (Object.keys(updateData).length === 0) {
      return false
    }

    return await this.updateById(this.tableName, id, updateData)
  }

  /**
   * 删除账户
   */
  async delete(id: string): Promise<boolean> {
    return await this.deleteById(this.tableName, id)
  }

  /**
   * 激活/停用账户
   */
  async setActive(id: string, isActive: boolean): Promise<boolean> {
    return await this.updateById(this.tableName, id, { is_active: isActive })
  }

  /**
   * 检查邮箱是否已存在
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT 1 FROM ${this.tableName} WHERE email = $1`
    const params: any[] = [email]

    if (excludeId) {
      query += ` AND id != $2`
      params.push(excludeId)
    }

    const result = await this.query(query, params)
    return result.rowCount > 0
  }

  /**
   * 获取账户统计信息
   */
  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
  }> {
    const result = await this.query<{
      total: string
      active: string
      inactive: string
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive
      FROM ${this.tableName}`
    )

    const stats = result.rows[0]
    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      inactive: parseInt(stats.inactive),
    }
  }

  /**
   * 批量更新账户状态
   */
  async batchUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    if (ids.length === 0) return 0

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ')
    const query = `
      UPDATE ${this.tableName}
      SET is_active = $${ids.length + 1}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `

    const result = await this.query(query, [...ids, isActive])
    return result.rowCount
  }

  /**
   * 将数据库行映射为账户对象
   */
  private mapRowToAccount(row: any): AccountData {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      imapHost: row.imap_host,
      imapPort: row.imap_port,
      imapSecure: row.imap_secure,
      smtpHost: row.smtp_host,
      smtpPort: row.smtp_port,
      smtpSecure: row.smtp_secure,
      username: row.username,
      password: EncryptionUtil.decrypt(row.password), // 解密密码
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /**
   * 获取账户的解密密码（用于IMAP/SMTP连接）
   */
  async getDecryptedPassword(id: string): Promise<string | null> {
    const result = await this.query<{ password: string }>(
      `SELECT password FROM ${this.tableName} WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return EncryptionUtil.decrypt(result.rows[0].password)
  }
}

export default AccountDAO