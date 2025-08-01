import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  List,
  Avatar,
  Typography,
  Tag,
  Button,
  Checkbox,
  Dropdown,
  Space,
  Empty,
} from 'antd'
import {
  StarOutlined,
  StarFilled,
  PaperClipOutlined,
  MoreOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { Email } from '@/types/index'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const EmailList = () => {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: 从API获取邮件列表
    setLoading(true)
    // 模拟数据
    setTimeout(() => {
      const mockEmails: Email[] = [
        {
          id: '1',
          accountId: 'acc1',
          folderId: folderId || 'inbox',
          messageId: 'msg1',
          subject: '欢迎使用邮箱管理系统',
          from: { name: '系统管理员', address: 'admin@example.com' },
          to: [{ name: '用户', address: 'user@example.com' }],
          bodyText: '这是一封欢迎邮件...',
          dateReceived: new Date(),
          isRead: false,
          isStarred: false,
          isDeleted: false,
          hasAttachments: true,
        },
        {
          id: '2',
          accountId: 'acc1',
          folderId: folderId || 'inbox',
          messageId: 'msg2',
          subject: '项目进度更新',
          from: { name: '张三', address: 'zhangsan@company.com' },
          to: [{ name: '用户', address: 'user@example.com' }],
          bodyText: '项目当前进度...',
          dateReceived: new Date(Date.now() - 3600000),
          isRead: true,
          isStarred: true,
          isDeleted: false,
          hasAttachments: false,
        },
      ]
      setEmails(mockEmails)
      setLoading(false)
    }, 1000)
  }, [folderId])

  const handleEmailClick = (email: Email) => {
    navigate(`/email/${email.id}`)
  }

  const handleStarToggle = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    )
  }

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, emailId])
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(emails.map(email => email.id))
    } else {
      setSelectedEmails([])
    }
  }

  const getFolderTitle = () => {
    switch (folderId) {
      case 'sent':
        return '已发送'
      case 'drafts':
        return '草稿箱'
      case 'trash':
        return '垃圾箱'
      default:
        return '收件箱'
    }
  }

  const actionMenuItems = [
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
    },
    {
      key: 'archive',
      icon: <InboxOutlined />,
      label: '归档',
    },
  ]

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={3}>{getFolderTitle()}</Title>
        {selectedEmails.length > 0 && (
          <Space>
            <Text>已选择 {selectedEmails.length} 封邮件</Text>
            <Dropdown menu={{ items: actionMenuItems }}>
              <Button icon={<MoreOutlined />}>批量操作</Button>
            </Dropdown>
          </Space>
        )}
      </div>

      {emails.length === 0 ? (
        <Empty description="暂无邮件" />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Checkbox
              checked={selectedEmails.length === emails.length}
              indeterminate={
                selectedEmails.length > 0 && selectedEmails.length < emails.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              全选
            </Checkbox>
          </div>

          <List
            itemLayout="horizontal"
            dataSource={emails}
            renderItem={(email) => (
              <List.Item
                className={`email-list-item ${!email.isRead ? 'unread' : ''}`}
                onClick={() => handleEmailClick(email)}
                actions={[
                  <Button
                    type="text"
                    icon={email.isStarred ? <StarFilled /> : <StarOutlined />}
                    onClick={(e) => handleStarToggle(email.id, e)}
                    style={{ color: email.isStarred ? '#faad14' : undefined }}
                  />,
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Checkbox
                    checked={selectedEmails.includes(email.id)}
                    onChange={(e) => handleSelectEmail(email.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: 12 }}
                  />

                  <Avatar size="small" style={{ marginRight: 12 }}>
                    {email.from.name?.[0] || email.from.address[0]}
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        strong={!email.isRead}
                        ellipsis
                        style={{ maxWidth: 200 }}
                      >
                        {email.from.name || email.from.address}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(email.dateReceived).format('MM-DD HH:mm')}
                      </Text>
                    </div>

                    <div style={{ marginBottom: 4 }}>
                      <Text strong={!email.isRead} ellipsis>
                        {email.subject}
                      </Text>
                      {email.hasAttachments && (
                        <PaperClipOutlined style={{ marginLeft: 8, color: '#999' }} />
                      )}
                    </div>

                    <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                      {email.bodyText}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
    </div>
  )
}

export default EmailList