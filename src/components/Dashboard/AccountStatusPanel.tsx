import React from 'react'
import { Card, List, Badge, Button, Tooltip, Typography, Empty } from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  DisconnectOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { AccountStatus } from '../../types'

const { Text } = Typography

interface AccountStatusPanelProps {
  accounts: AccountStatus[]
  onRefresh: () => void
}

const AccountStatusPanel: React.FC<AccountStatusPanelProps> = ({
  accounts,
  onRefresh
}) => {
  // 处理刷新点击事件
  const handleRefreshClick = () => {
    console.log('AccountStatusPanel: 刷新按钮被点击')
    if (onRefresh) {
      onRefresh()
    }
  }
  const getStatusIcon = (status: AccountStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'syncing':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
      case 'disconnected':
      default:
        return <DisconnectOutlined style={{ color: '#d9d9d9' }} />
    }
  }

  const getStatusText = (status: AccountStatus['status']) => {
    switch (status) {
      case 'connected':
        return '已连接'
      case 'syncing':
        return '同步中'
      case 'error':
        return '连接错误'
      case 'disconnected':
      default:
        return '未连接'
    }
  }

  const getStatusColor = (status: AccountStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'success'
      case 'syncing':
        return 'processing'
      case 'error':
        return 'error'
      case 'disconnected':
      default:
        return 'default'
    }
  }

  return (
    <Card
      title="账户状态"
      extra={
        <Tooltip title="刷新状态">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefreshClick}
            size="small"
          />
        </Tooltip>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: '12px' } }}
    >
      {accounts.length === 0 ? (
        <Empty
          description="暂无邮箱账户"
          style={{ margin: '20px 0' }}
        />
      ) : (
        <List
          size="small"
          dataSource={accounts}
          renderItem={(account) => (
            <List.Item
              style={{ padding: '8px 0' }}
              actions={[
                <Badge
                  key="status"
                  status={getStatusColor(account.status) as any}
                  text={getStatusText(account.status)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(account.status)}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{account.name}</Text>
                    {account.unreadCount > 0 && (
                      <Badge
                        count={account.unreadCount}
                        size="small"
                        style={{ backgroundColor: '#f5222d' }}
                      />
                    )}
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {account.email}
                    </Text>
                    {account.lastSync && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        最后同步: {new Date(account.lastSync).toLocaleString()}
                      </div>
                    )}
                    {account.errorMessage && (
                      <div style={{ fontSize: '11px', color: '#f5222d' }}>
                        {account.errorMessage}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export default AccountStatusPanel
