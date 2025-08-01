import { BaseDAO } from './base-dao'

export interface AttachmentData {
  id?: string
  emailId: string
  filename: string
  contentType: string
  sizeBytes: number
  filePath: string
  checksum?: string
  createdAt?: Date
}

export class AttachmentDAO extends BaseDAO {
  private readonly tableName = 'attachments'

  /**
   * 创建附件记录
   */
  async create(attachmentData: AttachmentData): Promise<string> {
    const data = {
      email_id: attachmentData.emailId,
      filename: attachmentData.filename,
      content_type: attachmentData.contentType,
      size_bytes: attachmentData.sizeBytes,
      file_path: attachmentData.filePath,
      checksum: attachmentData.checksum || null,
    }

    return await this.insertAndReturnId(this.tableName, data)
  }

  /**
   * 根据ID获取附件
   */
  async getAttachmentById(id: string): Promise<AttachmentData | null> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToAttachment(result.rows[0])
  }

  /**
   * 获取邮件的所有附件
   */
  async findByEmailId(emailId: string): Promise<AttachmentData[]> {
    const result = await this.query<any>(
      `SELECT * FROM ${this.tableName} WHERE email_id = $1 ORDER BY filename`,
      [emailId]
    )

    return result.rows.map(row => this.mapRowToAttachment(row))
  }

  /**
   * 批量创建附件
   */
  async batchCreate(attachments: AttachmentData[]): Promise<void> {
    if (attachments.length === 0) return

    const columns = [
      'email_id', 'filename', 'content_type', 'size_bytes', 'file_path', 'checksum'
    ]

    const data = attachments.map(attachment => [
      attachment.emailId,
      attachment.filename,
      attachment.contentType,
      attachment.sizeBytes,
      attachment.filePath,
      attachment.checksum || null,
    ])

    await this.batchInsert(this.tableName, columns, data)
  }

  /**
   * 删除附件
   */
  async delete(id: string): Promise<boolean> {
    return await this.deleteById(this.tableName, id)
  }

  /**
   * 删除邮件的所有附件
   */
  async deleteByEmailId(emailId: string): Promise<number> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE email_id = $1`,
      [emailId]
    )
    return result.rowCount
  }

  /**
   * 获取附件统计信息
   */
  async getStats(): Promise<{
    total: number
    totalSize: number
    avgSize: number
  }> {
    const result = await this.query<{
      total: string
      total_size: string
      avg_size: string
    }>(
      `SELECT 
        COUNT(*) as total,
        COALESCE(SUM(size_bytes), 0) as total_size,
        COALESCE(AVG(size_bytes), 0) as avg_size
      FROM ${this.tableName}`
    )

    const stats = result.rows[0]
    return {
      total: parseInt(stats.total),
      totalSize: parseInt(stats.total_size),
      avgSize: Math.round(parseFloat(stats.avg_size)),
    }
  }

  /**
   * 根据文件类型获取附件统计
   */
  async getStatsByContentType(): Promise<Array<{
    contentType: string
    count: number
    totalSize: number
  }>> {
    const result = await this.query<{
      content_type: string
      count: string
      total_size: string
    }>(
      `SELECT 
        content_type,
        COUNT(*) as count,
        SUM(size_bytes) as total_size
      FROM ${this.tableName}
      GROUP BY content_type
      ORDER BY count DESC`
    )

    return result.rows.map(row => ({
      contentType: row.content_type,
      count: parseInt(row.count),
      totalSize: parseInt(row.total_size),
    }))
  }

  /**
   * 查找重复的附件（基于校验和）
   */
  async findDuplicates(): Promise<Array<{
    checksum: string
    count: number
    attachments: AttachmentData[]
  }>> {
    const result = await this.query<{
      checksum: string
      count: string
    }>(
      `SELECT checksum, COUNT(*) as count
      FROM ${this.tableName}
      WHERE checksum IS NOT NULL
      GROUP BY checksum
      HAVING COUNT(*) > 1
      ORDER BY count DESC`
    )

    const duplicates = []
    for (const row of result.rows) {
      const attachments = await this.query<any>(
        `SELECT * FROM ${this.tableName} WHERE checksum = $1`,
        [row.checksum]
      )

      duplicates.push({
        checksum: row.checksum,
        count: parseInt(row.count),
        attachments: attachments.rows.map(r => this.mapRowToAttachment(r)),
      })
    }

    return duplicates
  }

  /**
   * 将数据库行映射为附件对象
   */
  private mapRowToAttachment(row: any): AttachmentData {
    return {
      id: row.id,
      emailId: row.email_id,
      filename: row.filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      filePath: row.file_path,
      checksum: row.checksum,
      createdAt: row.created_at,
    }
  }
}

export default AttachmentDAO