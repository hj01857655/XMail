import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Typography,
  Avatar,
  Space,
  Tag,
  Divider,
  List,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  RollbackOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
} from '@ant-design/icons'
import type { Email, Attachment } from '@/types/index'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const EmailDetail = () => {
  const { emailId } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!emailId) return

    // TODO: 从API获取邮件详情
    setLoading(true)
    setTimeout(() => {
      const mockEmail: Email = {
        id: emailId,
        accountId: 'acc1',
        folderId: 'inbox',
        messageId: 'msg1',
        subject: '欢迎使用邮箱管理系统',
        from: { name: '系统管理员', address: 'admin@example.com' },
        to: [{ name: '用户', address: 'user@example.com' }],
        cc: [{ name: '抄送用户', address: 'cc@example.com' }],
        bodyText: '这是一封欢迎邮件的纯文本内容...',
        bodyHtml: `
          <div>
            <h2>欢迎使用邮箱管理系统！</h2>
            <p>感谢您选择我们的邮箱管理系统。这个系统提供了以下功能：</p>
            <ul>
              <li>多账户管理</li>
              <li>邮件收发</li>
              <li>智能分类</li>
              <li>全文搜索</li>
              <li>联系人管理</li>
            </ul>
            <p>如果您有任何问题，请随时联系我们的技术支持团队。</p>
            <p>祝您使用愉快！</p>
          </div>
        `,
        dateReceived: new Date(),
        dateSent: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
        hasAttachments: true,
        attachments: [
          {
            id: 'att1',
            filename: '用户手册.pdf',
            contentType: 'application/pdf',
            size: 1024000,
            filePath: '/attachments/manual.pdf',
          },
          {
            id: 'att2',
            filename: '系统截图.png',
            contentType: 'image/png',
            size: 512000,
            filePath: '/attachments/screenshot.png',
          },
        ],
      }
      setEmail(mockEmail)
      setLoading(false)
    }, 500)
  }, [emailId])

  const handleBack = () => {
    navigate(-1)
  }

  const handleReply = () => {
    navigate('/compose', {
      state: {
        mode: 'reply',
        originalEmail: email,
      },
    })
  }

  const handleForward = () => {
    navigate('/compose', {
      state: {
        mode: 'forward',
        originalEmail: email,
      },
    })
  }

  const handleStarToggle = () => {
    if (!email) return
    setEmail({ ...email, isStarred: !email.isStarred })
    message.success(email.isStarred ? '已取消星标' : '已添加星标')
  }

  const handleDelete = () => {
    message.success('邮件已删除')
    navigate(-1)
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    // TODO: 实现附件下载
    message.success(`正在下载 ${attachment.filename}`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!email) {
    return <div>邮件不存在</div>
  }

  return (
    <div style={{
      padding: 24,
      height: '100%',
      overflow: 'auto',
      position: 'relative'
    }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: 16 }}
          >
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            邮件详情
          </Title>
        </div>

        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleReply}>
            回复
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={handleForward}>
            转发
          </Button>
          <Button
            icon={email.isStarred ? <StarFilled /> : <StarOutlined />}
            onClick={handleStarToggle}
            style={{ color: email.isStarred ? '#faad14' : undefined }}
          >
            {email.isStarred ? '取消星标' : '添加星标'}
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 16 }}>
            {email.subject}
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Avatar size="large" style={{ marginRight: 12 }}>
              {email.from.name?.[0] || email.from.address[0]}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div>
                <Text strong>{email.from.name || email.from.address}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  &lt;{email.from.address}&gt;
                </Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(email.dateReceived).format('YYYY年MM月DD日 HH:mm')}
                </Text>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">收件人：</Text>
            {email.to.map((recipient, index) => (
              <Tag key={index} style={{ margin: '0 4px 4px 0' }}>
                {recipient.name || recipient.address}
              </Tag>
            ))}
          </div>

          {email.cc && email.cc.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">抄送：</Text>
              {email.cc.map((recipient, index) => (
                <Tag key={index} style={{ margin: '0 4px 4px 0' }}>
                  {recipient.name || recipient.address}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <div className="email-content">
          {email.bodyHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              style={{ lineHeight: 1.6 }}
            />
          ) : (
            <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {email.bodyText}
            </Paragraph>
          )}
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                附件 ({email.attachments.length})
              </Title>
              <List
                dataSource={email.attachments}
                renderItem={(attachment) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        下载
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={attachment.filename}
                      description={`${attachment.contentType} • ${formatFileSize(
                        attachment.size
                      )}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default EmailDetail