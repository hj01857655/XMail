import React from 'react'
import { Card, Button, Space, message } from 'antd'
import {
  EditOutlined,
  ReloadOutlined,
  SettingOutlined,
  UserAddOutlined,
  SyncOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface QuickActionsPanelProps {
  onRefresh: () => void
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onRefresh }) => {
  const navigate = useNavigate()

  const handleCompose = () => {
    navigate('/compose')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleAddAccount = () => {
    message.info('添加账户功能开发中...')
  }

  const handleSyncAll = async () => {
    try {
      message.loading('正在同步所有邮箱...', 0)

      // 模拟同步操作
      await new Promise(resolve => setTimeout(resolve, 2000))

      message.destroy()
      message.success('邮箱同步完成')
      onRefresh()
    } catch (error) {
      message.destroy()
      message.error('同步失败，请稍后重试')
    }
  }

  const handleCheckEmails = () => {
    navigate('/')
  }

  return (
    <Card
      title="快速操作"
      style={{ height: '100%' }}
      styles={{ body: { padding: '16px' } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleCompose}
          block
          size="large"
        >
          撰写邮件
        </Button>

        <Button
          icon={<InboxOutlined />}
          onClick={handleCheckEmails}
          block
        >
          查看邮件
        </Button>

        <Button
          icon={<SyncOutlined />}
          onClick={handleSyncAll}
          block
        >
          同步邮箱
        </Button>

        <Button
          icon={<UserAddOutlined />}
          onClick={handleAddAccount}
          block
        >
          添加账户
        </Button>

        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          block
        >
          刷新数据
        </Button>

        <Button
          icon={<SettingOutlined />}
          onClick={handleSettings}
          block
        >
          系统设置
        </Button>
      </Space>
    </Card>
  )
}

export default QuickActionsPanel
