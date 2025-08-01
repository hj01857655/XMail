import { Pool } from 'pg'
import DatabaseManager from '../config/database'

interface Migration {
  version: number
  name: string
  up: string
  down: string
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_accounts_table',
    up: `
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        imap_host VARCHAR(255) NOT NULL,
        imap_port INTEGER NOT NULL,
        imap_secure BOOLEAN NOT NULL DEFAULT true,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_secure BOOLEAN NOT NULL DEFAULT true,
        username VARCHAR(255) NOT NULL,
        password TEXT NOT NULL, -- 加密存储
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
      CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);
    `,
    down: `
      DROP TABLE IF EXISTS accounts CASCADE;
    `,
  },
  {
    version: 2,
    name: 'create_folders_table',
    up: `
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('inbox', 'sent', 'drafts', 'trash', 'custom')),
        parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
        color VARCHAR(7), -- HEX color code
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, name)
      );
      
      CREATE INDEX IF NOT EXISTS idx_folders_account_id ON folders(account_id);
      CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);
      CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
    `,
    down: `
      DROP TABLE IF EXISTS folders CASCADE;
    `,
  },
  {
    version: 3,
    name: 'create_emails_table',
    up: `
      CREATE TABLE IF NOT EXISTS emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        message_id VARCHAR(255) NOT NULL,
        subject TEXT,
        from_address JSONB NOT NULL, -- {name?: string, address: string}
        to_addresses JSONB NOT NULL, -- Array of {name?: string, address: string}
        cc_addresses JSONB, -- Array of {name?: string, address: string}
        bcc_addresses JSONB, -- Array of {name?: string, address: string}
        body_text TEXT,
        body_html TEXT,
        date_received TIMESTAMP WITH TIME ZONE NOT NULL,
        date_sent TIMESTAMP WITH TIME ZONE,
        is_read BOOLEAN DEFAULT false,
        is_starred BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false,
        has_attachments BOOLEAN DEFAULT false,
        size_bytes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, message_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
      CREATE INDEX IF NOT EXISTS idx_emails_folder_id ON emails(folder_id);
      CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
      CREATE INDEX IF NOT EXISTS idx_emails_date_received ON emails(date_received DESC);
      CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
      CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred);
      CREATE INDEX IF NOT EXISTS idx_emails_is_deleted ON emails(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_emails_has_attachments ON emails(has_attachments);
      
      -- 全文搜索索引
      CREATE INDEX IF NOT EXISTS idx_emails_search ON emails USING gin(
        to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, ''))
      );
    `,
    down: `
      DROP TABLE IF EXISTS emails CASCADE;
    `,
  },
  {
    version: 4,
    name: 'create_attachments_table',
    up: `
      CREATE TABLE IF NOT EXISTS attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        content_type VARCHAR(255) NOT NULL,
        size_bytes INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        checksum VARCHAR(64), -- SHA-256 checksum
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_filename ON attachments(filename);
      CREATE INDEX IF NOT EXISTS idx_attachments_content_type ON attachments(content_type);
    `,
    down: `
      DROP TABLE IF EXISTS attachments CASCADE;
    `,
  },
  {
    version: 5,
    name: 'create_contacts_table',
    up: `
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        notes TEXT,
        avatar_url TEXT,
        frequency_score INTEGER DEFAULT 0, -- 使用频率评分
        last_contacted TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
      CREATE INDEX IF NOT EXISTS idx_contacts_frequency ON contacts(frequency_score DESC);
    `,
    down: `
      DROP TABLE IF EXISTS contacts CASCADE;
    `,
  },
  {
    version: 6,
    name: 'create_email_rules_table',
    up: `
      CREATE TABLE IF NOT EXISTS email_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        conditions JSONB NOT NULL, -- 规则条件
        actions JSONB NOT NULL, -- 执行动作
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_rules_account_id ON email_rules(account_id);
      CREATE INDEX IF NOT EXISTS idx_email_rules_active ON email_rules(is_active);
      CREATE INDEX IF NOT EXISTS idx_email_rules_priority ON email_rules(priority DESC);
    `,
    down: `
      DROP TABLE IF EXISTS email_rules CASCADE;
    `,
  },
  {
    version: 7,
    name: 'create_user_settings_table',
    up: `
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE, -- 用户标识
        theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
        language VARCHAR(10) DEFAULT 'zh-CN',
        email_check_interval INTEGER DEFAULT 5, -- 分钟
        show_notifications BOOLEAN DEFAULT true,
        auto_mark_as_read BOOLEAN DEFAULT false,
        default_signature TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `
      DROP TABLE IF EXISTS user_settings CASCADE;
    `,
  },
  {
    version: 8,
    name: 'create_sync_logs_table',
    up: `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental'
        status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
        emails_synced INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sync_logs_account_id ON sync_logs(account_id);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
    `,
    down: `
      DROP TABLE IF EXISTS sync_logs CASCADE;
    `,
  },
]

class MigrationManager {
  private pool: Pool

  constructor() {
    this.pool = DatabaseManager.getInstance().getPostgresPool()
  }

  // 创建迁移表
  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
    await this.pool.query(query)
  }

  // 获取已执行的迁移版本
  private async getExecutedMigrations(): Promise<number[]> {
    const result = await this.pool.query(
      'SELECT version FROM migrations ORDER BY version'
    )
    return result.rows.map(row => row.version)
  }

  // 执行单个迁移
  private async executeMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      
      // 执行迁移SQL
      await client.query(migration.up)
      
      // 记录迁移
      await client.query(
        'INSERT INTO migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      )
      
      await client.query('COMMIT')
      console.log(`迁移 ${migration.version} (${migration.name}) 执行成功`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`迁移 ${migration.version} (${migration.name}) 执行失败:`, error)
      throw error
    } finally {
      client.release()
    }
  }

  // 执行所有待执行的迁移
  public async migrate(): Promise<void> {
    try {
      await this.createMigrationsTable()
      const executedVersions = await this.getExecutedMigrations()
      
      const pendingMigrations = migrations.filter(
        migration => !executedVersions.includes(migration.version)
      )

      if (pendingMigrations.length === 0) {
        console.log('没有待执行的迁移')
        return
      }

      console.log(`发现 ${pendingMigrations.length} 个待执行的迁移`)
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }
      
      console.log('所有迁移执行完成')
    } catch (error) {
      console.error('迁移执行失败:', error)
      throw error
    }
  }

  // 回滚到指定版本
  public async rollback(targetVersion: number): Promise<void> {
    try {
      const executedVersions = await this.getExecutedMigrations()
      const migrationsToRollback = migrations
        .filter(migration => 
          executedVersions.includes(migration.version) && 
          migration.version > targetVersion
        )
        .sort((a, b) => b.version - a.version) // 降序执行回滚

      if (migrationsToRollback.length === 0) {
        console.log('没有需要回滚的迁移')
        return
      }

      console.log(`回滚 ${migrationsToRollback.length} 个迁移`)
      
      for (const migration of migrationsToRollback) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')
          
          // 执行回滚SQL
          await client.query(migration.down)
          
          // 删除迁移记录
          await client.query(
            'DELETE FROM migrations WHERE version = $1',
            [migration.version]
          )
          
          await client.query('COMMIT')
          console.log(`迁移 ${migration.version} (${migration.name}) 回滚成功`)
        } catch (error) {
          await client.query('ROLLBACK')
          console.error(`迁移 ${migration.version} (${migration.name}) 回滚失败:`, error)
          throw error
        } finally {
          client.release()
        }
      }
      
      console.log('回滚完成')
    } catch (error) {
      console.error('回滚失败:', error)
      throw error
    }
  }

  // 获取迁移状态
  public async getStatus(): Promise<{
    executed: number[]
    pending: number[]
    total: number
  }> {
    const executedVersions = await this.getExecutedMigrations()
    const allVersions = migrations.map(m => m.version)
    const pendingVersions = allVersions.filter(v => !executedVersions.includes(v))

    return {
      executed: executedVersions,
      pending: pendingVersions,
      total: migrations.length,
    }
  }
}

export default MigrationManager