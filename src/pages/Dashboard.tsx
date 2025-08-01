import React, { useState, useEffect } from 'react'
import { Row, Col, Typography, Spin, message } from 'antd'
import {
  StatsPanel,
  AccountStatusPanel,
  RecentEmailsPanel,
  QuickActionsPanel,
  SystemStatusPanel
} from '@components/Dashboard'
import { DashboardStats, AccountStatus, Email, SystemStatus } from '../types'

const { Title } = Typography

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [accountStatuses, setAccountStatuses] = useState<AccountStatus[]>([])
  const [recentEmails, setRecentEmails] = useState<Email[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // 并行获取所有数据
      const [statsRes, accountsRes, emailsRes, systemRes] = await Promise.allSettled([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/accounts-status'),
        fetch('/api/emails?limit=5'),
        fetch('/api/health')
      ])

      // 处理统计数据
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json()
        setStats(statsData)
      }

      // 处理账户状态
      if (accountsRes.status === 'fulfilled' && accountsRes.value.ok) {
        const accountsData = await accountsRes.value.json()
        setAccountStatuses(accountsData)
      }

      // 处理最近邮件
      if (emailsRes.status === 'fulfilled' && emailsRes.value.ok) {
        const emailsData = await emailsRes.value.json()
        setRecentEmails(emailsData.emails || emailsData)
      }

      // 处理系统状态
      if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
        const systemData = await systemRes.value.json()
        setSystemStatus({
          database: systemData.database === 'connected' ? 'connected' : 'error',
          server: 'running',
          uptime: Date.now() - (new Date().getTime() - 3600000), // 模拟1小时运行时间
          version: '1.0.0'
        })
      }

    } catch (error) {
      console.error('获取仪表板数据失败:', error)
      message.error('获取仪表板数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    console.log('Dashboard: 刷新数据被触发')
    fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()

    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchDashboardData, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          仪表板
        </Title>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          欢迎使用XMail邮箱管理系统
        </p>
      </div>

      <Row gutter={[16, 16]}>
        {/* 第一行：统计面板和快速操作 */}
        <Col xs={24} lg={18}>
          <StatsPanel stats={stats} onRefresh={handleRefresh} />
        </Col>
        <Col xs={24} lg={6}>
          <QuickActionsPanel onRefresh={handleRefresh} />
        </Col>

        {/* 第二行：账户状态和系统状态 */}
        <Col xs={24} lg={12}>
          <AccountStatusPanel
            accounts={accountStatuses}
            onRefresh={handleRefresh}
          />
        </Col>
        <Col xs={24} lg={12}>
          <SystemStatusPanel
            status={systemStatus}
            onRefresh={handleRefresh}
          />
        </Col>

        {/* 第三行：最近邮件 */}
        <Col xs={24}>
          <RecentEmailsPanel
            emails={recentEmails}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
