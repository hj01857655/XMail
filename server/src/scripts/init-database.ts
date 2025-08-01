#!/usr/bin/env ts-node

import DatabaseManager from '../config/database'
import MigrationManager from '../database/migrations'

async function initDatabase() {
  console.log('开始初始化数据库...')

  try {
    // 连接数据库
    const dbManager = DatabaseManager.getInstance()
    await dbManager.connect()
    console.log('数据库连接成功')

    // 执行迁移
    const migrationManager = new MigrationManager()
    await migrationManager.migrate()
    console.log('数据库迁移完成')

    // 检查数据库健康状态
    const health = await dbManager.healthCheck()
    console.log('数据库健康检查:', health)

    if (health.postgres && health.redis) {
      console.log('✅ 数据库初始化成功！')
    } else {
      console.log('⚠️ 数据库初始化完成，但部分服务不可用')
    }

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  } finally {
    // 关闭连接
    await DatabaseManager.getInstance().disconnect()
    process.exit(0)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
}

export default initDatabase