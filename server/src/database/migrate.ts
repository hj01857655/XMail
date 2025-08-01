import fs from 'fs'
import path from 'path'
import DatabaseManager from './connection'

export class DatabaseMigrator {
  private db: DatabaseManager

  constructor() {
    this.db = DatabaseManager.getInstance()
  }

  // 执行数据库迁移
  public async migrate(): Promise<void> {
    try {
      console.log('开始数据库迁移...')

      // 读取schema.sql文件
      const schemaPath = path.join(__dirname, 'schema.sql')
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')

      // 执行schema创建
      await this.db.query(schemaSql)
      console.log('数据库表结构创建完成')

      // 创建默认数据
      await this.createDefaultData()
      console.log('默认数据创建完成')

      console.log('数据库迁移完成')
    } catch (error) {
      console.error('数据库迁移失败:', error)
      throw error
    }
  }

  // 创建默认数据
  private async createDefaultData(): Promise<void> {
    // 检查是否已有用户数据
    const userCount = await this.db.query('SELECT COUNT(*) FROM users')
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('用户数据已存在，跳过默认数据创建')
      return
    }

    // 创建默认用户
    const defaultUser = await this.db.query(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['admin', 'admin@example.com', '$2b$10$dummy.hash.for.demo', '管理员'])

    const userId = defaultUser.rows[0].id

    console.log('默认用户创建完成:', userId)
  }

  // 检查数据库连接
  public async checkConnection(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1')
      return true
    } catch (error) {
      console.error('数据库连接检查失败:', error)
      return false
    }
  }

  // 获取数据库版本信息
  public async getDatabaseInfo(): Promise<any> {
    try {
      const versionResult = await this.db.query('SELECT version()')
      const tablesResult = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      return {
        version: versionResult.rows[0].version,
        tables: tablesResult.rows.map((row: any) => row.table_name),
      }
    } catch (error) {
      console.error('获取数据库信息失败:', error)
      throw error
    }
  }

  // 清理数据库（仅用于开发环境）
  public async dropAllTables(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不能在生产环境中删除表')
    }

    try {
      console.log('警告：正在删除所有表...')

      // 获取所有表名
      const tablesResult = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `)

      // 删除所有表
      for (const row of tablesResult.rows) {
        await this.db.query(`DROP TABLE IF EXISTS ${row.table_name} CASCADE`)
        console.log(`已删除表: ${row.table_name}`)
      }

      // 删除所有函数
      await this.db.query(`
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        DROP FUNCTION IF EXISTS update_email_search_vector() CASCADE;
      `)

      console.log('所有表和函数已删除')
    } catch (error) {
      console.error('删除表失败:', error)
      throw error
    }
  }
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  const migrator = new DatabaseMigrator()
  
  migrator.migrate()
    .then(() => {
      console.log('迁移完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('迁移失败:', error)
      process.exit(1)
    })
}

export default DatabaseMigrator