import { Pool, PoolClient } from 'pg'
import DatabaseManager from '../config/database'

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

export interface PaginationOptions {
  page: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export abstract class BaseDAO {
  protected pool: Pool

  constructor() {
    this.pool = DatabaseManager.getInstance().getPostgresPool()
  }

  /**
   * 执行查询
   */
  protected async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    try {
      const result = await this.pool.query(text, params)
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      }
    } catch (error) {
      console.error('数据库查询错误:', error)
      console.error('SQL:', text)
      console.error('参数:', params)
      throw error
    }
  }

  /**
   * 执行事务
   */
  protected async executeTransaction<T>(
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
   * 分页查询
   */
  protected async paginatedQuery<T>(
    baseQuery: string,
    countQuery: string,
    params: any[],
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page, pageSize, orderBy, orderDirection = 'DESC' } = options
    const offset = (page - 1) * pageSize

    // 构建完整查询
    let fullQuery = baseQuery
    if (orderBy) {
      fullQuery += ` ORDER BY ${orderBy} ${orderDirection}`
    }
    fullQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

    // 执行查询
    const [dataResult, countResult] = await Promise.all([
      this.query<T>(fullQuery, [...params, pageSize, offset]),
      this.query<{ count: string }>(countQuery, params),
    ])

    const total = parseInt(countResult.rows[0]?.count || '0')
    const totalPages = Math.ceil(total / pageSize)

    return {
      items: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  /**
   * 插入数据并返回ID
   */
  protected async insertAndReturnId(
    table: string,
    data: Record<string, any>
  ): Promise<string> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING id
    `

    const result = await this.query<{ id: string }>(query, values)
    return result.rows[0].id
  }

  /**
   * 更新数据
   */
  protected async updateById(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const columns = Object.keys(data)
    const values = Object.values(data)

    const setClause = columns
      .map((col, index) => `${col} = $${index + 1}`)
      .join(', ')

    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
    `

    const result = await this.query(query, [...values, id])
    return result.rowCount > 0
  }

  /**
   * 软删除（标记为删除）
   */
  protected async softDeleteById(table: string, id: string): Promise<boolean> {
    const query = `
      UPDATE ${table}
      SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    const result = await this.query(query, [id])
    return result.rowCount > 0
  }

  /**
   * 硬删除
   */
  protected async deleteById(table: string, id: string): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = $1`
    const result = await this.query(query, [id])
    return result.rowCount > 0
  }

  /**
   * 根据ID查找
   */
  public async findById<T>(
    table: string,
    id: string,
    columns: string = '*'
  ): Promise<T | null> {
    const query = `SELECT ${columns} FROM ${table} WHERE id = $1`
    const result = await this.query<T>(query, [id])
    return result.rows[0] || null
  }

  /**
   * 检查记录是否存在
   */
  protected async exists(
    table: string,
    condition: string,
    params: any[]
  ): Promise<boolean> {
    const query = `SELECT 1 FROM ${table} WHERE ${condition} LIMIT 1`
    const result = await this.query(query, params)
    return result.rowCount > 0
  }

  /**
   * 批量插入
   */
  protected async batchInsert(
    table: string,
    columns: string[],
    data: any[][]
  ): Promise<void> {
    if (data.length === 0) return

    const placeholders = data
      .map((_, rowIndex) =>
        `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
      )
      .join(', ')

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
    `

    const flatValues = data.flat()
    await this.query(query, flatValues)
  }

  /**
   * 构建WHERE条件
   */
  protected buildWhereClause(
    conditions: Record<string, any>,
    startParamIndex: number = 1
  ): { whereClause: string; params: any[]; nextParamIndex: number } {
    const keys = Object.keys(conditions).filter(key => conditions[key] !== undefined)

    if (keys.length === 0) {
      return { whereClause: '', params: [], nextParamIndex: startParamIndex }
    }

    const clauses: string[] = []
    const params: any[] = []
    let paramIndex = startParamIndex

    keys.forEach(key => {
      const value = conditions[key]
      if (Array.isArray(value)) {
        // IN 查询
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
        clauses.push(`${key} IN (${placeholders})`)
        params.push(...value)
      } else if (typeof value === 'object' && value.operator) {
        // 自定义操作符
        clauses.push(`${key} ${value.operator} $${paramIndex++}`)
        params.push(value.value)
      } else {
        // 等值查询
        clauses.push(`${key} = $${paramIndex++}`)
        params.push(value)
      }
    })

    return {
      whereClause: `WHERE ${clauses.join(' AND ')}`,
      params,
      nextParamIndex: paramIndex,
    }
  }
}

export default BaseDAO