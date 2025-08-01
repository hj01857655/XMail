import { BaseDAO, PaginationOptions, PaginatedResult } from './base-dao'

export interface ContactData {
    id?: string
    name: string
    email: string
    phone?: string
    notes?: string
    avatarUrl?: string
    frequencyScore: number
    lastContacted?: Date
    createdAt?: Date
    updatedAt?: Date
}

export interface ContactFilter {
    search?: string
    email?: string
}

export class ContactDAO extends BaseDAO {
    private readonly tableName = 'contacts'

    /**
     * 创建联系人
     */
    async create(contactData: ContactData): Promise<string> {
        const data = {
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone || null,
            notes: contactData.notes || null,
            avatar_url: contactData.avatarUrl || null,
            frequency_score: contactData.frequencyScore || 0,
            last_contacted: contactData.lastContacted || null,
        }

        return await this.insertAndReturnId(this.tableName, data)
    }

    /**
     * 根据ID获取联系人
     */
    async getContactById(id: string): Promise<ContactData | null> {
        const result = await this.query<any>(
            `SELECT * FROM ${this.tableName} WHERE id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return null
        }

        return this.mapRowToContact(result.rows[0])
    }

    /**
     * 根据邮箱地址获取联系人
     */
    async findByEmail(email: string): Promise<ContactData | null> {
        const result = await this.query<any>(
            `SELECT * FROM ${this.tableName} WHERE email = $1`,
            [email]
        )

        if (result.rows.length === 0) {
            return null
        }

        return this.mapRowToContact(result.rows[0])
    }

    /**
     * 分页获取联系人列表
     */
    async findWithPagination(
        filter: ContactFilter,
        options: PaginationOptions
    ): Promise<PaginatedResult<ContactData>> {
        const conditions: Record<string, any> = {}

        if (filter.email) {
            conditions.email = filter.email
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
            { ...options, orderBy: options.orderBy || 'frequency_score', orderDirection: 'DESC' }
        )

        return {
            ...result,
            items: result.items.map(row => this.mapRowToContact(row)),
        }
    }

    /**
     * 获取常用联系人
     */
    async getFrequentContacts(limit: number = 10): Promise<ContactData[]> {
        const result = await this.query<any>(
            `SELECT * FROM ${this.tableName} 
       WHERE frequency_score > 0 
       ORDER BY frequency_score DESC, last_contacted DESC 
       LIMIT $1`,
            [limit]
        )

        return result.rows.map(row => this.mapRowToContact(row))
    }

    /**
     * 搜索联系人（用于自动补全）
     */
    async searchForAutocomplete(query: string, limit: number = 10): Promise<ContactData[]> {
        const result = await this.query<any>(
            `SELECT * FROM ${this.tableName}
       WHERE name ILIKE $1 OR email ILIKE $2
       ORDER BY frequency_score DESC, name
       LIMIT $3`,
            [`%${query}%`, `%${query}%`, limit]
        )

        return result.rows.map(row => this.mapRowToContact(row))
    }

    /**
     * 更新联系人
     */
    async update(id: string, contactData: Partial<ContactData>): Promise<boolean> {
        const updateData: Record<string, any> = {}

        if (contactData.name) updateData.name = contactData.name
        if (contactData.email) updateData.email = contactData.email
        if (contactData.phone !== undefined) updateData.phone = contactData.phone
        if (contactData.notes !== undefined) updateData.notes = contactData.notes
        if (contactData.avatarUrl !== undefined) updateData.avatar_url = contactData.avatarUrl
        if (contactData.frequencyScore !== undefined) updateData.frequency_score = contactData.frequencyScore
        if (contactData.lastContacted !== undefined) updateData.last_contacted = contactData.lastContacted

        if (Object.keys(updateData).length === 0) {
            return false
        }

        return await this.updateById(this.tableName, id, updateData)
    }

    /**
     * 删除联系人
     */
    async delete(id: string): Promise<boolean> {
        return await this.deleteById(this.tableName, id)
    }

    /**
     * 批量删除联系人
     */
    async batchDelete(ids: string[]): Promise<number> {
        if (ids.length === 0) return 0

        const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ')
        const query = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`

        const result = await this.query(query, ids)
        return result.rowCount
    }

    /**
     * 增加联系人使用频率
     */
    async incrementFrequency(email: string): Promise<void> {
        await this.query(
            `UPDATE ${this.tableName} 
       SET frequency_score = frequency_score + 1, 
           last_contacted = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE email = $1`,
            [email]
        )
    }

    /**
     * 批量增加联系人使用频率
     */
    async batchIncrementFrequency(emails: string[]): Promise<void> {
        if (emails.length === 0) return

        const placeholders = emails.map((_, index) => `$${index + 1}`).join(', ')
        await this.query(
            `UPDATE ${this.tableName} 
       SET frequency_score = frequency_score + 1, 
           last_contacted = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE email IN (${placeholders})`,
            emails
        )
    }

    /**
     * 从邮件地址自动创建联系人
     */
    async createFromEmailAddress(
        name: string | undefined,
        email: string
    ): Promise<string | null> {
        // 检查联系人是否已存在
        const existing = await this.findByEmail(email)
        if (existing) {
            // 如果存在，增加使用频率
            await this.incrementFrequency(email)
            return existing.id!
        }

        // 创建新联系人
        const contactData: ContactData = {
            name: name || email.split('@')[0], // 如果没有名称，使用邮箱用户名部分
            email,
            frequencyScore: 1,
            lastContacted: new Date(),
        }

        return await this.create(contactData)
    }

    /**
     * 批量从邮件地址创建联系人
     */
    async batchCreateFromEmailAddresses(
        addresses: Array<{ name?: string; address: string }>
    ): Promise<void> {
        if (addresses.length === 0) return

        await this.executeTransaction(async (client) => {
            for (const addr of addresses) {
                await this.createFromEmailAddress(addr.name, addr.address)
            }
        })
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
     * 获取联系人统计信息
     */
    async getStats(): Promise<{
        total: number
        withPhone: number
        recentlyContacted: number
    }> {
        const result = await this.query<{
            total: string
            with_phone: string
            recently_contacted: string
        }>(
            `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') as with_phone,
        COUNT(*) FILTER (WHERE last_contacted >= CURRENT_DATE - INTERVAL '30 days') as recently_contacted
      FROM ${this.tableName}`
        )

        const stats = result.rows[0]
        return {
            total: parseInt(stats.total),
            withPhone: parseInt(stats.with_phone),
            recentlyContacted: parseInt(stats.recently_contacted),
        }
    }

    /**
     * 导出联系人为CSV格式数据
     */
    async exportToCSV(): Promise<ContactData[]> {
        const result = await this.query<any>(
            `SELECT * FROM ${this.tableName} ORDER BY name`
        )

        return result.rows.map(row => this.mapRowToContact(row))
    }

    /**
     * 批量导入联系人
     */
    async batchImport(contacts: ContactData[]): Promise<{
        imported: number
        skipped: number
        errors: string[]
    }> {
        let imported = 0
        let skipped = 0
        const errors: string[] = []

        await this.executeTransaction(async (client) => {
            for (const contact of contacts) {
                try {
                    // 检查邮箱是否已存在
                    const exists = await this.emailExists(contact.email)
                    if (exists) {
                        skipped++
                        continue
                    }

                    await this.create(contact)
                    imported++
                } catch (error) {
                    errors.push(`导入联系人 ${contact.email} 失败: ${(error as Error).message}`)
                }
            }
        })

        return { imported, skipped, errors }
    }

    /**
     * 清理不活跃的联系人
     */
    async cleanupInactiveContacts(daysThreshold: number = 365): Promise<number> {
        const result = await this.query(
            `DELETE FROM ${this.tableName} 
       WHERE frequency_score = 0 
       AND (last_contacted IS NULL OR last_contacted < CURRENT_DATE - INTERVAL '${daysThreshold} days')
       AND created_at < CURRENT_DATE - INTERVAL '${daysThreshold} days'`
        )

        return result.rowCount
    }

    /**
     * 将数据库行映射为联系人对象
     */
    private mapRowToContact(row: any): ContactData {
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            avatarUrl: row.avatar_url,
            frequencyScore: row.frequency_score,
            lastContacted: row.last_contacted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }
    }
}

export default ContactDAO