import React from 'react'
import { Card, List, Badge, Button, Tooltip, Typography, Progress } from 'antd'
import {
  DatabaseOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  TagOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { SystemStatus } from '../../types'

const { Text } = Typography

interface SystemStatusPanelProps {
  status: SystemStatus | null
  onRefresh: () => void
}

const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({
  status,
  onRefresh
}) => {
  // 处理刷新点击事件
  const handleRefreshClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('SystemStatusPanel: 刷新按钮被点击', { onRefresh: !!onRefresh })
    if (onRefresh) {
      try {
        onRefresh()
        console.log('SystemStatusPanel: onRefresh 函数执行成功')
      } catch (error) {
        console.error('SystemStatusPanel: onRefresh 函数执行失败', error)
      }
    } else {
      console.warn('SystemStatusPanel: onRefresh 函数未定义')
    }
  }
  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'running':
        return 'success'
      case 'error':
      case 'stopped':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return '已连接'
      case 'running':
        return '运行中'
      case 'error':
        return '错误'
      case 'stopped':
        return '已停止'
      case 'disconnected':
        return '未连接'
      default:
        return '未知'
    }
  }

  const systemItems = [
    {
      key: 'database',
      title: '数据库状态',
      icon: <DatabaseOutlined />,
      status: status?.database || 'disconnected',
      description: 'MySQL 数据库连接'
    },
    {
      key: 'server',
      title: '服务器状态',
      icon: <CloudServerOutlined />,
      status: status?.server || 'stopped',
      description: 'Node.js 后端服务'
    },
    {
      key: 'uptime',
      title: '运行时间',
      icon: <ClockCircleOutlined />,
      status: 'info',
      description: status ? formatUptime(status.uptime) : '未知'
    },
    {
      key: 'version',
      title: '系统版本',
      icon: <TagOutlined />,
      status: 'info',
      description: status?.version || '未知'
    }
  ]

  return (
    <Card
      title="系统状态"
      extra={
        <Tooltip title="刷新状态">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefreshClick}
            size="small"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          />
        </Tooltip>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: '12px' } }}
    >
      <List
        size="small"
        dataSource={systemItems}
        renderItem={(item) => (
          <List.Item style={{ padding: '8px 0' }}>
            <List.Item.Meta
              avatar={
                <div style={{
                  color: item.status === 'info' ? '#1890ff' :
                    getStatusColor(item.status) === 'success' ? '#52c41a' : '#f5222d'
                }}>
                  {item.icon}
                </div>
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '13px' }}>{item.title}</Text>
                  {item.status !== 'info' && (
                    <Badge
                      status={getStatusColor(item.status) as any}
                      text={getStatusText(item.status)}
                    />
                  )}
                </div>
              }
              description={
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {item.description}
                </Text>
              }
            />
          </List.Item>
        )}
      />

      {/* 系统健康度指示器 */}
      <div style={{ marginTop: '16px', padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>系统健康度</Text>
        </div>
        <Progress
          percent={
            status?.database === 'connected' && status?.server === 'running' ? 100 :
              status?.database === 'connected' || status?.server === 'running' ? 50 : 0
          }
          size="small"
          status={
            status?.database === 'connected' && status?.server === 'running' ? 'success' :
              status?.database === 'connected' || status?.server === 'running' ? 'active' : 'exception'
          }
          showInfo={false}
        />
      </div>
    </Card>
  )
}

export default SystemStatusPanel
