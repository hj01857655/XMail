import { Pool, PoolClient } from 'pg'
import { RedisClientType } from 'redis'
import DatabaseManager from '../config/database'

export class DatabaseUtils {
    private static pool: Pool
    private static redis: RedisClientType

    static initialize() {
        const dbManager = DatabaseManager.getInstance()
        this.pool = dbManager.getPostgresPool()
        this.redis = dbManager.getRedisClient()
    }

    /**
     * 执行单个查询
     */
    static async query<T = any>(text: string, params?: any[]): Promise<{
        rows: T[]
        rowCount: number
    }> {
        const client = await this.pool.connect()
        try {
            const result = await client.query(text, params)
            return {
                rows: result.rows,
                rowCount: result.rowCount || 0,
            }
        } finally {
            client.release()
        }
    }

    /**
     * 执行事务
     */
    static async transaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            const result = await callback(client)
            await client.query('COMMIT')
            return result
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    }

    /**
     * Redis 缓存操作
     */
    static async setCache(
        key: string,
        value: any,
        expireSeconds?: number
    ): Promise<void> {
        const serializedValue = JSON.stringify(value)
        if (expireSeconds) {
            await this.redis.setEx(key, expireSeconds, serializedValue)
        } else {
            await this.redis.set(key, serializedValue)
        }
    }

    static async getCache<T = any>(key: string): Promise<T | null> {
        const value = await this.redis.get(key)
        if (!value) return null

        try {
            return JSON.parse(value) as T
        } catch {
            return value as T
        }
    }

    static async deleteCache(key: string): Promise<void> {
        await this.redis.del(key)
    }

    static async deleteCachePattern(pattern: string): Promise<void> {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
            await this.redis.del(keys)
        }
    }

    /**
     * 批量操作工具
     */
    static async batchInsert(
        table: string,
        columns: string[],
        data: any[][],
        chunkSize: number = 1000
    ): Promise<void> {
        if (data.length === 0) return

        // 分批插入以避免参数过多
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize)

            const placeholders = chunk
                .map((_, rowIndex) =>
                    `(${columns.map((_, colIndex) =>
                        `$${rowIndex * columns.length + colIndex + 1}`
                    ).join(', ')})`
                )
                .join(', ')

            const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING
      `

            const flatValues = chunk.flat()
            await this.query(query, flatValues)
        }
    }

    /**
     * 分页查询辅助函数
     */
    static buildPaginationQuery(
        baseQuery: string,
        page: number,
        pageSize: number,
        orderBy?: string,
        orderDirection: 'ASC' | 'DESC' = 'DESC'
    ): {
        query: string
        offset: number
        limit: number
    } {
        const offset = (page - 1) * pageSize
        let query = baseQuery

        if (orderBy) {
            query += ` ORDER BY ${orderBy} ${orderDirection}`
        }

        query += ` LIMIT ${pageSize} OFFSET ${offset}`

        return { query, offset, limit: pageSize }
    }

    /**
     * 构建搜索查询
     */
    static buildSearchQuery(
        searchTerm: string,
        searchColumns: string[],
        paramStartIndex: number = 1
    ): {
        whereClause: string
        params: string[]
        nextParamIndex: number
    } {
        if (!searchTerm.trim()) {
            return {
                whereClause: '',
                params: [],
                nextParamIndex: paramStartIndex,
            }
        }

        const searchConditions = searchColumns.map(
            (column, index) => `${column} ILIKE $${paramStartIndex + index}`
        )

        const whereClause = `(${searchConditions.join(' OR ')})`
        const searchPattern = `%${searchTerm}%`
        const params = new Array(searchColumns.length).fill(searchPattern)

        return {
            whereClause,
            params,
            nextParamIndex: paramStartIndex + searchColumns.length,
        }
    }

    /**
     * 数据验证工具
     */
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    static validateUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(uuid)
    }

    /**
     * 数据清理工具
     */
    static sanitizeString(str: string): string {
        return str.trim().replace(/\s+/g, ' ')
    }

    static escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    /**
     * 性能监控
     */
    static async withTiming<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        const startTime = Date.now()
        try {
            const result = await operation()
            const duration = Date.now() - startTime
            console.log(`[DB] ${operationName} completed in ${duration}ms`)
            return result
        } catch (error) {
            const duration = Date.now() - startTime
            console.error(`[DB] ${operationName} failed after ${duration}ms:`, error)
            throw error
        }
    }

    /**
     * 连接池状态监控
     */
    static getPoolStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
        }
    }
}

export default DatabaseUtils