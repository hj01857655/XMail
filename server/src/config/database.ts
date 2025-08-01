import { Pool, PoolConfig } from 'pg'
import { createClient, RedisClientType } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

// PostgreSQL 配置
const pgConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'email_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Redis 配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
}

class DatabaseManager {
  private static instance: DatabaseManager
  private pgPool: Pool
  private redisClient: RedisClientType

  private constructor() {
    // 初始化 PostgreSQL 连接池
    this.pgPool = new Pool(pgConfig)
    
    // 初始化 Redis 客户端
    this.redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password,
    })

    this.setupEventHandlers()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private setupEventHandlers() {
    // PostgreSQL 事件处理
    this.pgPool.on('connect', (client) => {
      console.log('PostgreSQL 客户端已连接')
    })

    this.pgPool.on('error', (err) => {
      console.error('PostgreSQL 连接池错误:', err)
    })

    // Redis 事件处理
    this.redisClient.on('connect', () => {
      console.log('Redis 客户端已连接')
    })

    this.redisClient.on('error', (err) => {
      console.error('Redis 连接错误:', err)
    })
  }

  public async connect(): Promise<void> {
    try {
      // 测试 PostgreSQL 连接
      const client = await this.pgPool.connect()
      await client.query('SELECT NOW()')
      client.release()
      console.log('PostgreSQL 连接成功')

      // 连接 Redis
      await this.redisClient.connect()
      console.log('Redis 连接成功')
    } catch (error) {
      console.error('数据库连接失败:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pgPool.end()
      await this.redisClient.quit()
      console.log('数据库连接已关闭')
    } catch (error) {
      console.error('关闭数据库连接时出错:', error)
    }
  }

  public getPostgresPool(): Pool {
    return this.pgPool
  }

  public getRedisClient(): RedisClientType {
    return this.redisClient
  }

  // 执行事务
  public async executeTransaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.pgPool.connect()
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

  // 健康检查
  public async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const health = { postgres: false, redis: false }

    try {
      const client = await this.pgPool.connect()
      await client.query('SELECT 1')
      client.release()
      health.postgres = true
    } catch (error) {
      console.error('PostgreSQL 健康检查失败:', error)
    }

    try {
      await this.redisClient.ping()
      health.redis = true
    } catch (error) {
      console.error('Redis 健康检查失败:', error)
    }

    return health
  }
}

export default DatabaseManager