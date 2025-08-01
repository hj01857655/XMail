import React from 'react'
import { Card, List, Avatar, Button, Tooltip, Typography, Empty, Tag } from 'antd'
import {
  MailOutlined,
  PaperClipOutlined,
  StarOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Email } from '../../types'

const { Text } = Typography

interface RecentEmailsPanelProps {
  emails: Email[]
  onRefresh: () => void
}

const RecentEmailsPanel: React.FC<RecentEmailsPanelProps> = ({
  emails,
  onRefresh
}) => {
  const navigate = useNavigate()

  const formatDate = (date: Date | string) => {
    const emailDate = new Date(date)
    const now = new Date()
    const diffTime = now.getTime() - emailDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return emailDate.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return emailDate.toLocaleDateString('zh-CN')
    }
  }

  const getFromName = (from: any) => {
    if (typeof from === 'string') {
      try {
        const parsed = JSON.parse(from)
        return parsed.name || parsed.address
      } catch {
        return from
      }
    }
    return from?.name || from?.address || '未知发件人'
  }

  const handleEmailClick = (emailId: string) => {
    navigate(`/email/${emailId}`)
  }

  return (
    <Card
      title="最近邮件"
      extra={
        <div>
          <Tooltip title="查看所有邮件">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate('/')}
              style={{ marginRight: 8 }}
            />
          </Tooltip>
          <Tooltip title="刷新邮件">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
            />
          </Tooltip>
        </div>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: '12px' } }}
    >
      {emails.length === 0 ? (
        <Empty
          description="暂无邮件"
          style={{ margin: '40px 0' }}
        />
      ) : (
        <List
          size="small"
          dataSource={emails}
          renderItem={(email) => (
            <List.Item
              style={{
                padding: '12px 0',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              className="email-item"
              onClick={() => handleEmailClick(email.id)}
              actions={[
                <Text key="date" type="secondary" style={{ fontSize: '12px' }}>
                  {formatDate(email.dateReceived)}
                </Text>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<MailOutlined />}
                    style={{
                      backgroundColor: email.isRead ? '#f0f0f0' : '#1890ff',
                      color: email.isRead ? '#999' : '#fff'
                    }}
                  />
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text
                      strong={!email.isRead}
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: email.isRead ? '#666' : '#000'
                      }}
                      ellipsis
                    >
                      {email.subject || '(无主题)'}
                    </Text>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {email.isStarred && (
                        <StarOutlined style={{ color: '#faad14' }} />
                      )}
                      {email.hasAttachments && (
                        <PaperClipOutlined style={{ color: '#666' }} />
                      )}
                      {!email.isRead && (
                        <Tag color="blue">新</Tag>
                      )}
                    </div>
                  </div>
                }
                description={
                  <Text
                    type="secondary"
                    style={{ fontSize: '12px' }}
                    ellipsis
                  >
                    来自: {getFromName(email.from)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}


    </Card>
  )
}

export default RecentEmailsPanel
