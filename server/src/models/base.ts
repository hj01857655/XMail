import { PoolClient } from 'pg'
import DatabaseManager from '../database/connection'
import { log } from '../utils/logger'

// 基础实体接口
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// 分页参数接口
export interface PaginationParams {
  page?: number
  limit?: number
}

// 分页响应接口
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}