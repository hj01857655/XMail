import React from 'react'
import { Card, Row, Col, Statistic, Button, Tooltip } from 'antd'
import {
  MailOutlined,
  InboxOutlined,
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { DashboardStats } from '../../types'

interface StatsPanelProps {
  stats: DashboardStats | null
  onRefresh: () => void
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, onRefresh }) => {
  const defaultStats: DashboardStats = {
    totalEmails: 0,
    unreadEmails: 0,
    todayEmails: 0,
    totalAccounts: 0,
    activeAccounts: 0
  }

  const currentStats = stats || defaultStats

  return (
    <Card
      title="邮件统计"
      extra={
        <Tooltip title="刷新数据">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
          />
        </Tooltip>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="总邮件数"
            value={currentStats.totalEmails}
            prefix={<MailOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="未读邮件"
            value={currentStats.unreadEmails}
            prefix={<InboxOutlined style={{ color: '#f5222d' }} />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="今日邮件"
            value={currentStats.todayEmails}
            prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="活跃账户"
            value={currentStats.activeAccounts}
            suffix={`/ ${currentStats.totalAccounts}`}
            prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>
    </Card>
  )
}

export default StatsPanel
