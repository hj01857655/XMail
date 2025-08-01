import { Router } from 'express'
import type { Contact } from '../../../src/types'

const router = Router()

// 获取联系人列表
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, pageSize = 50 } = req.query

    // TODO: 从数据库获取联系人列表
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: '张三',
        email: 'zhangsan@company.com',
        phone: '13800138000',
        notes: '公司同事',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '李四',
        email: 'lisi@example.com',
        phone: '13900139000',
        notes: '朋友',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    res.json({
      success: true,
      data: mockContacts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取联系人列表失败',
      error: (error as Error).message,
    })
  }
})

// 添加联系人
router.post('/', async (req, res) => {
  try {
    const contactData = req.body

    // TODO: 验证联系人数据
    // TODO: 保存到数据库
    
    const newContact: Contact = {
      id: Date.now().toString(),
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    res.json({
      success: true,
      data: newContact,
      message: '联系人添加成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加联系人失败',
      error: (error as Error).message,
    })
  }
})

// 更新联系人
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // TODO: 更新数据库中的联系人信息
    
    res.json({
      success: true,
      message: '联系人更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新联系人失败',
      error: (error as Error).message,
    })
  }
})

// 删除联系人
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // TODO: 从数据库删除联系人
    
    res.json({
      success: true,
      message: '联系人删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除联系人失败',
      error: (error as Error).message,
    })
  }
})

module.exports = router