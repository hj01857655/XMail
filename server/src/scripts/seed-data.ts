#!/usr/bin/env ts-node

import DatabaseManager from '../config/database'
import AccountDAO from '../database/account-dao'
import FolderDAO from '../database/folder-dao'
import ContactDAO from '../database/contact-dao'

async function seedData() {
  console.log('开始填充测试数据...')

  try {
    // 连接数据库
    const dbManager = DatabaseManager.getInstance()
    await dbManager.connect()

    const accountDAO = new AccountDAO()
    const folderDAO = new FolderDAO()
    const contactDAO = new ContactDAO()

    // 创建测试账户
    console.log('创建测试账户...')
    const accountId = await accountDAO.create({
      name: '测试邮箱',
      email: 'test@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'test@example.com',
      password: 'test-password',
    })
    console.log(`账户创建成功，ID: ${accountId}`)

    // 创建默认文件夹
    console.log('创建默认文件夹...')
    await folderDAO.createDefaultFolders(accountId)

    // 创建自定义文件夹
    const workFolderId = await folderDAO.create({
      accountId,
      name: '工作',
      type: 'custom',
      color: '#1890ff',
      sortOrder: 10,
    })

    const personalFolderId = await folderDAO.create({
      accountId,
      name: '个人',
      type: 'custom',
      color: '#52c41a',
      sortOrder: 11,
    })

    console.log(`自定义文件夹创建成功: 工作(${workFolderId}), 个人(${personalFolderId})`)

    // 创建测试联系人
    console.log('创建测试联系人...')
    const contacts = [
      {
        name: '张三',
        email: 'zhangsan@company.com',
        phone: '13800138000',
        notes: '公司同事',
        frequencyScore: 10,
      },
      {
        name: '李四',
        email: 'lisi@example.com',
        phone: '13900139000',
        notes: '朋友',
        frequencyScore: 5,
      },
      {
        name: '王五',
        email: 'wangwu@test.com',
        notes: '客户',
        frequencyScore: 8,
      },
    ]

    for (const contact of contacts) {
      const contactId = await contactDAO.create(contact)
      console.log(`联系人创建成功: ${contact.name} (${contactId})`)
    }

    console.log('✅ 测试数据填充完成！')

  } catch (error) {
    console.error('❌ 测试数据填充失败:', error)
    process.exit(1)
  } finally {
    // 关闭连接
    await DatabaseManager.getInstance().disconnect()
    process.exit(0)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedData()
}

export default seedData