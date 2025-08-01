import { BaseDAO } from './base-dao'

export interface FolderData {
  id?: string
  accountId: string
  name: string
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom'
  parentId?: string
  color?: string
  sortOrder: number
  createdAt?: Date
  updatedAt?: Date
}

export interface FolderWithStats extends FolderData {
  unreadCount: number
  totalCount: number
  children?: FolderWithStats[]
}

export class FolderDAO extends BaseDAO {
  private readonly tableName = 'folders'

  /**
   * 创建文件夹
   */
  async create(folderData: FolderData): Promise<string> {
    const data = {
      account_id: folderData.accountId,
      name: folderData.name,
      type: folderData.type,
      parent_id: folderData.parentId || null,
      color: folderData.color || null,
      sort_order: folderData.sortOrder,
    }

    return await this.insertAndReturnId(this.tableName, data)
  }

  /**
   * 根据ID获取文件夹 (别名)
   */
  async getById(id: string): Promise<FolderData | null> {
    return this.getFolderById(id)
  }

  /**
   * 根据ID获取文件夹
   */
  async getFolderById(id: string): Promise<FolderData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToFolder(result.rows[0])
  }

  /**
   * 获取账户的所有文件夹
   */
  async findByAccountId(accountId: string): Promise<FolderData[]> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE account_id = $1 ORDER BY sort_order, name`,
      [accountId]
    )

    return result.rows.map(row => this.mapRowToFolder(row))
  }

  /**
   * 获取账户的文件夹树形结构
   */
  async getFolderTree(accountId: string): Promise<FolderWithStats[]> {
    // 获取所有文件夹及其邮件统计
    const result = await this.query<any>(
      `SELECT 
        f.*,
        COALESCE(e.unread_count, 0) as unread_count,
        COALESCE(e.total_count, 0) as total_count
      FROM ${this.tableName} f
      LEFT JOIN (
        SELECT 
          folder_id,
          COUNT(*) FILTER (WHERE is_read = false AND is_deleted = false) as unread_count,
          COUNT(*) FILTER (WHERE is_deleted = false) as total_count
        FROM emails
        GROUP BY folder_id
      ) e ON f.id = e.folder_id
      WHERE f.account_id = $1
      ORDER BY f.sort_order, f.name`,
      [accountId]
    )

    const folders = result.rows.map(row => ({
      ...this.mapRowToFolder(row),
      unreadCount: parseInt(row.unread_count) || 0,
      totalCount: parseInt(row.total_count) || 0,
      children: [] as FolderWithStats[],
    }))

    // 构建树形结构
    const folderMap = new Map<string, FolderWithStats>()
    const rootFolders: FolderWithStats[] = []

    // 创建文件夹映射
    folders.forEach(folder => {
      folderMap.set(folder.id!, folder)
    })

    // 构建父子关系
    folders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children!.push(folder)
        } else {
          rootFolders.push(folder)
        }
      } else {
        rootFolders.push(folder)
      }
    })

    return rootFolders
  }

  /**
   * 获取系统文件夹
   */
  async getSystemFolders(accountId: string): Promise<FolderData[]> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} 
       WHERE account_id = $1 AND type IN ('inbox', 'sent', 'drafts', 'trash')
       ORDER BY 
         CASE type
           WHEN 'inbox' THEN 1
           WHEN 'sent' THEN 2
           WHEN 'drafts' THEN 3
           WHEN 'trash' THEN 4
         END`,
      [accountId]
    )

    return result.rows.map(row => this.mapRowToFolder(row))
  }

  /**
   * 获取自定义文件夹
   */
  async getCustomFolders(accountId: string): Promise<FolderData[]> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} 
       WHERE account_id = $1 AND type = 'custom'
       ORDER BY sort_order, name`,
      [accountId]
    )

    return result.rows.map(row => this.mapRowToFolder(row))
  }

  /**
   * 更新文件夹
   */
  async update(id: string, folderData: Partial<FolderData>): Promise<boolean> {
    const updateData: Record<string, any> = {}

    if (folderData.name) updateData.name = folderData.name
    if (folderData.color !== undefined) updateData.color = folderData.color
    if (folderData.parentId !== undefined) updateData.parent_id = folderData.parentId
    if (folderData.sortOrder !== undefined) updateData.sort_order = folderData.sortOrder

    if (Object.keys(updateData).length === 0) {
      return false
    }

    return await this.updateById(this.tableName, id, updateData)
  }

  /**
   * 删除文件夹
   */
  async delete(id: string): Promise<boolean> {
    // 检查是否为系统文件夹
    const folder = await this.getFolderById(id)
    if (!folder || folder.type !== 'custom') {
      throw new Error('不能删除系统文件夹')
    }

    // 检查是否有子文件夹
    const hasChildren = await this.hasChildren(id)
    if (hasChildren) {
      throw new Error('不能删除包含子文件夹的文件夹')
    }

    // 检查是否有邮件
    const hasEmails = await this.hasEmails(id)
    if (hasEmails) {
      throw new Error('不能删除包含邮件的文件夹')
    }

    return await this.deleteById(this.tableName, id)
  }

  /**
   * 移动文件夹
   */
  async move(id: string, newParentId?: string): Promise<boolean> {
    // 检查循环引用
    if (newParentId && await this.wouldCreateCycle(id, newParentId)) {
      throw new Error('移动操作会创建循环引用')
    }

    return await this.updateById(this.tableName, id, { parent_id: newParentId })
  }

  /**
   * 更新文件夹排序
   */
  async updateSortOrder(folderOrders: { id: string; sortOrder: number }[]): Promise<void> {
    if (folderOrders.length === 0) return

    await this.executeTransaction(async (client) => {
      for (const { id, sortOrder } of folderOrders) {
        await client.query(
          `UPDATE ${this.tableName} SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [sortOrder, id]
        )
      }
    })
  }

  /**
   * 根据名称和账户查找文件夹
   */
  async findByNameAndAccount(accountId: string, name: string): Promise<FolderData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE account_id = $1 AND name = $2`,
      [accountId, name]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToFolder(result.rows[0])
  }

  /**
   * 检查文件夹名称是否已存在
   */
  async nameExists(accountId: string, name: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT 1 FROM ${this.tableName} WHERE account_id = $1 AND name = $2`
    const params: any[] = [accountId, name]

    if (excludeId) {
      query += ` AND id != $3`
      params.push(excludeId)
    }

    const result = await this.query(query, params)
    return result.rowCount > 0
  }

  /**
   * 创建默认系统文件夹
   */
  async createDefaultFolders(accountId: string): Promise<void> {
    const defaultFolders = [
      { name: '收件箱', type: 'inbox' as const, sortOrder: 1 },
      { name: '已发送', type: 'sent' as const, sortOrder: 2 },
      { name: '草稿箱', type: 'drafts' as const, sortOrder: 3 },
      { name: '垃圾箱', type: 'trash' as const, sortOrder: 4 },
    ]

    await this.executeTransaction(async (client) => {
      for (const folder of defaultFolders) {
        // 检查文件夹是否已存在
        const exists = await this.nameExists(accountId, folder.name)
        if (!exists) {
          await client.query(
            `INSERT INTO ${this.tableName} (account_id, name, type, sort_order) VALUES ($1, $2, $3, $4)`,
            [accountId, folder.name, folder.type, folder.sortOrder]
          )
        }
      }
    })
  }

  /**
   * 获取文件夹的邮件数量统计
   */
  async getEmailCounts(folderId: string): Promise<{
    total: number
    unread: number
    starred: number
  }> {
    const result = await this.query<{
      total: string
      unread: string
      starred: string
    }>(
      `SELECT 
        COUNT(*) FILTER (WHERE is_deleted = false) as total,
        COUNT(*) FILTER (WHERE is_read = false AND is_deleted = false) as unread,
        COUNT(*) FILTER (WHERE is_starred = true AND is_deleted = false) as starred
      FROM emails
      WHERE folder_id = $1`,
      [folderId]
    )

    const counts = result.rows[0]
    return {
      total: parseInt(counts.total) || 0,
      unread: parseInt(counts.unread) || 0,
      starred: parseInt(counts.starred) || 0,
    }
  }

  /**
   * 检查文件夹是否有子文件夹
   */
  private async hasChildren(folderId: string): Promise<boolean> {
    return await this.exists(this.tableName, 'parent_id = $1', [folderId])
  }

  /**
   * 检查文件夹是否有邮件
   */
  private async hasEmails(folderId: string): Promise<boolean> {
    return await this.exists('emails', 'folder_id = $1 AND is_deleted = false', [folderId])
  }

  /**
   * 检查移动操作是否会创建循环引用
   */
  private async wouldCreateCycle(folderId: string, newParentId: string): Promise<boolean> {
    if (folderId === newParentId) {
      return true
    }

    // 递归检查父级链
    let currentParentId: string | null = newParentId
    while (currentParentId) {
      if (currentParentId === folderId) {
        return true
      }

      const result: { rows: { parent_id: string | null }[] } = await this.query<{ parent_id: string | null }>(
        `SELECT parent_id FROM ${this.tableName} WHERE id = $1`,
        [currentParentId]
      )

      currentParentId = result.rows[0]?.parent_id || null
    }

    return false
  }

  /**
   * 将数据库行映射为文件夹对象
   */
  private mapRowToFolder(row: any): FolderData {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      color: row.color,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

export default FolderDAO