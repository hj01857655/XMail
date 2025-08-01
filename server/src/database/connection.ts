import { Pool, PoolClient } from 'pg'
import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

// PostgreSQL 连接池
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'email_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Redis 客户端
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
})

// 数据库连接管理类
export class DatabaseManager {
  private static instance: DatabaseManager
  private pgPool: Pool
  private redisClient: any

  private constructor() {
    this.pgPool = pgPool
    this.redisClient = redisClient
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  // 获取PostgreSQL连接
  public async getConnection(): Promise<PoolClient> {
    try {
      const client = await this.pgPool.connect()
      return client
    } catch (error) {
      console.error('获取数据库连接失败:', error)
      throw error
    }
  }

  // 执行查询
  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getConnection()
    try {
      const result = await client.query(text, params)
      return result
    } catch (error) {
      console.error('数据库查询失败:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // 执行事务
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getConnection()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('事务执行失败:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // 获取Redis客户端
  public getRedisClient() {
    return this.redisClient
  }

  // 初始化连接
  public async initialize(): Promise<void> {
    try {
      // 测试PostgreSQL连接
      const client = await this.getConnection()
      await client.query('SELECT NOW()')
      client.release()
      console.log('PostgreSQL 连接成功')

      // 连接Redis
      await this.redisClient.connect()
      console.log('Redis 连接成功')
    } catch (error) {
      console.error('数据库初始化失败:', error)
      throw error
    }
  }

  // 关闭连接
  public async close(): Promise<void> {
    try {
      await this.pgPool.end()
      await this.redisClient.quit()
      console.log('数据库连接已关闭')
    } catch (error) {
      console.error('关闭数据库连接失败:', error)
    }
  }
}

export default DatabaseManager.getInstance()