import { Request, Response, NextFunction } from 'express'
import DatabaseManager from '../config/database'
import DatabaseUtils from '../utils/database-utils'

/**
 * 数据库连接检查中间件
 */
export const checkDatabaseConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dbManager = DatabaseManager.getInstance()
    const health = await dbManager.healthCheck()
    
    if (!health.postgres) {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL 数据库连接不可用',
        error: 'DATABASE_UNAVAILABLE',
      })
    }

    // Redis 连接是可选的，不会阻止请求
    if (!health.redis) {
      console.warn('Redis 连接不可用，缓存功能将被禁用')
    }

    next()
  } catch (error) {
    console.error('数据库连接检查失败:', error)
    res.status(503).json({
      success: false,
      message: '数据库服务不可用',
      error: 'DATABASE_ERROR',
    })
  }
}

/**
 * 数据库性能监控中间件
 */
export const databasePerformanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()
  
  // 记录请求开始时的连接池状态
  const initialPoolStats = DatabaseUtils.getPoolStats()
  
  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const finalPoolStats = DatabaseUtils.getPoolStats()
    
    // 记录性能指标
    console.log(`[DB Monitor] ${req.method} ${req.path}`, {
      duration: `${duration}ms`,
      poolStats: {
        initial: initialPoolStats,
        final: finalPoolStats,
        connectionsDelta: finalPoolStats.totalCount - initialPoolStats.totalCount,
      },
    })
    
    // 如果请求时间过长，记录警告
    if (duration > 5000) {
      console.warn(`[DB Monitor] Slow request detected: ${req.method} ${req.path} took ${duration}ms`)
    }
  })
  
  next()
}

/**
 * 事务管理中间件
 */
export const transactionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 为请求添加事务管理方法
  req.transaction = async <T>(callback: () => Promise<T>): Promise<T> => {
    return await DatabaseUtils.transaction(async (client) => {
      // 将事务客户端添加到请求对象中
      req.dbClient = client
      return await callback()
    })
  }
  
  next()
}

/**
 * 缓存中间件
 */
export const cacheMiddleware = (options: {
  keyGenerator?: (req: Request) => string
  ttl?: number
  skipCache?: (req: Request) => boolean
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 只对 GET 请求启用缓存
    if (req.method !== 'GET') {
      return next()
    }

    // 检查是否跳过缓存
    if (options.skipCache && options.skipCache(req)) {
      return next()
    }

    // 生成缓存键
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl}`

    try {
      // 尝试从缓存获取数据
      const cachedData = await DatabaseUtils.getCache(cacheKey)
      
      if (cachedData) {
        console.log(`[Cache] Hit: ${cacheKey}`)
        return res.json(cachedData)
      }

      // 缓存未命中，继续处理请求
      console.log(`[Cache] Miss: ${cacheKey}`)
      
      // 拦截响应以缓存结果
      const originalJson = res.json
      res.json = function(data: any) {
        // 只缓存成功的响应
        if (res.statusCode === 200 && data.success !== false) {
          DatabaseUtils.setCache(cacheKey, data, options.ttl)
            .catch(error => console.error('缓存设置失败:', error))
        }
        
        return originalJson.call(this, data)
      }
      
      next()
    } catch (error) {
      console.error('缓存中间件错误:', error)
      // 缓存错误不应该影响正常请求
      next()
    }
  }
}

/**
 * 数据库错误处理中间件
 */
export const databaseErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // PostgreSQL 错误处理
  if (error.code) {
    switch (error.code) {
      case '23505': // 唯一约束违反
        return res.status(409).json({
          success: false,
          message: '数据已存在',
          error: 'DUPLICATE_ENTRY',
          details: error.detail,
        })
      
      case '23503': // 外键约束违反
        return res.status(400).json({
          success: false,
          message: '关联数据不存在',
          error: 'FOREIGN_KEY_VIOLATION',
          details: error.detail,
        })
      
      case '23502': // 非空约束违反
        return res.status(400).json({
          success: false,
          message: '必填字段不能为空',
          error: 'NOT_NULL_VIOLATION',
          details: error.detail,
        })
      
      case '42P01': // 表不存在
        return res.status(500).json({
          success: false,
          message: '数据库结构错误',
          error: 'TABLE_NOT_FOUND',
        })
      
      default:
        console.error('未处理的数据库错误:', error)
        return res.status(500).json({
          success: false,
          message: '数据库操作失败',
          error: 'DATABASE_ERROR',
        })
    }
  }
  
  // 其他错误传递给下一个错误处理器
  next(error)
}

// 扩展 Request 接口以支持事务
declare global {
  namespace Express {
    interface Request {
      transaction?: <T>(callback: () => Promise<T>) => Promise<T>
      dbClient?: any
    }
  }
}

export default {
  checkDatabaseConnection,
  databasePerformanceMonitor,
  transactionMiddleware,
  cacheMiddleware,
  databaseErrorHandler,
}