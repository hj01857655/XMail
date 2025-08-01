import { useState } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  List,
  Avatar,
  Typography,
  Space,
  Modal,
  message,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  BellOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { Account } from '@/types/index'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const Settings = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: '个人邮箱',
      email: 'user@example.com',
      imapConfig: {
        host: 'imap.example.com',
        port: 993,
        secure: true,
        username: 'user@example.com',
        password: '******',
      },
      smtpConfig: {
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        username: 'user@example.com',
        password: '******',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm] = Form.useForm()

  const handleAddAccount = () => {
    setEditingAccount(null)
    accountForm.resetFields()
    setIsAccountModalVisible(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    accountForm.setFieldsValue({
      name: account.name,
      email: account.email,
      imapHost: account.imapConfig.host,
      imapPort: account.imapConfig.port,
      imapSecure: account.imapConfig.secure,
      imapUsername: account.imapConfig.username,
      smtpHost: account.smtpConfig.host,
      smtpPort: account.smtpConfig.port,
      smtpSecure: account.smtpConfig.secure,
      smtpUsername: account.smtpConfig.username,
    })
    setIsAccountModalVisible(true)
  }

  const handleDeleteAccount = (accountId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个邮箱账户吗？删除后相关邮件数据也会被清除。',
      onOk: () => {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId))
        message.success('账户已删除')
      },
    })
  }

  const handleAccountSubmit = async (values: any) => {
    try {
      // TODO: 调用API保存账户
      console.log('保存账户:', values)

      const accountData: Account = {
        id: editingAccount?.id || Date.now().toString(),
        name: values.name,
        email: values.email,
        imapConfig: {
          host: values.imapHost,
          port: values.imapPort,
          secure: values.imapSecure,
          username: values.imapUsername,
          password: values.imapPassword,
        },
        smtpConfig: {
          host: values.smtpHost,
          port: values.smtpPort,
          secure: values.smtpSecure,
          username: values.smtpUsername,
          password: values.smtpPassword,
        },
        createdAt: editingAccount?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      if (editingAccount) {
        setAccounts(prev =>
          prev.map(acc => (acc.id === editingAccount.id ? accountData : acc))
        )
        message.success('账户已更新')
      } else {
        setAccounts(prev => [...prev, accountData])
        message.success('账户已添加')
      }

      setIsAccountModalVisible(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const tabItems = [
    {
      key: 'accounts',
      label: '邮箱账户',
      icon: <MailOutlined />,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={4}>邮箱账户管理</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAccount}>
              添加账户
            </Button>
          </div>

          <List
            dataSource={accounts}
            renderItem={(account) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditAccount(account)}
                  >
                    编辑
                  </Button>,
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<MailOutlined />} />}
                  title={account.name}
                  description={
                    <div>
                      <div>{account.email}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        IMAP: {account.imapConfig.host}:{account.imapConfig.port} |
                        SMTP: {account.smtpConfig.host}:{account.smtpConfig.port}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'general',
      label: '常规设置',
      icon: <SettingOutlined />,
      children: (
        <Form layout="vertical" initialValues={{
          theme: 'light',
          language: 'zh-CN',
          emailCheckInterval: 5,
          showNotifications: true,
          autoMarkAsRead: false,
        }}>
          <Form.Item label="界面主题" name="theme">
            <Select>
              <Option value="light">浅色主题</Option>
              <Option value="dark">深色主题</Option>
              <Option value="auto">跟随系统</Option>
            </Select>
          </Form.Item>

          <Form.Item label="语言设置" name="language">
            <Select>
              <Option value="zh-CN">简体中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>

          <Form.Item label="邮件检查频率（分钟）" name="emailCheckInterval">
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Form.Item label="显示桌面通知" name="showNotifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="自动标记为已读" name="autoMarkAsRead" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="默认签名" name="defaultSignature">
            <TextArea rows={4} placeholder="输入默认邮件签名..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary">保存设置</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'notifications',
      label: '通知设置',
      icon: <BellOutlined />,
      children: (
        <Form layout="vertical" initialValues={{
          emailNotifications: true,
          soundNotifications: true,
          desktopNotifications: true,
          notificationDuration: 5,
        }}>
          <Form.Item label="邮件通知" name="emailNotifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="声音提醒" name="soundNotifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="桌面通知" name="desktopNotifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="通知显示时长（秒）" name="notificationDuration">
            <InputNumber min={1} max={30} />
          </Form.Item>

          <Form.Item>
            <Button type="primary">保存设置</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      children: (
        <Form layout="vertical" initialValues={{
          displayName: '用户',
          email: 'user@example.com',
        }}>
          <Form.Item label="显示名称" name="displayName">
            <Input />
          </Form.Item>

          <Form.Item label="邮箱地址" name="email">
            <Input disabled />
          </Form.Item>

          <Form.Item label="头像">
            <Space direction="vertical">
              <Avatar size={64} icon={<UserOutlined />} />
              <Button>更换头像</Button>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button type="primary">保存资料</Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        设置
      </Title>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title={editingAccount ? '编辑账户' : '添加账户'}
        open={isAccountModalVisible}
        onCancel={() => setIsAccountModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={accountForm}
          layout="vertical"
          onFinish={handleAccountSubmit}
        >
          <Form.Item
            label="账户名称"
            name="name"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="例如：个人邮箱" />
          </Form.Item>

          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Title level={5}>IMAP 设置（接收邮件）</Title>
          <Form.Item
            label="IMAP 服务器"
            name="imapHost"
            rules={[{ required: true, message: '请输入IMAP服务器地址' }]}
          >
            <Input placeholder="imap.example.com" />
          </Form.Item>

          <Form.Item
            label="IMAP 端口"
            name="imapPort"
            rules={[{ required: true, message: '请输入IMAP端口' }]}
          >
            <InputNumber placeholder={993} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="使用SSL/TLS" name="imapSecure" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="IMAP 用户名"
            name="imapUsername"
            rules={[{ required: true, message: '请输入IMAP用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="IMAP 密码"
            name="imapPassword"
            rules={[{ required: true, message: '请输入IMAP密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Title level={5}>SMTP 设置（发送邮件）</Title>
          <Form.Item
            label="SMTP 服务器"
            name="smtpHost"
            rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
          >
            <Input placeholder="smtp.example.com" />
          </Form.Item>

          <Form.Item
            label="SMTP 端口"
            name="smtpPort"
            rules={[{ required: true, message: '请输入SMTP端口' }]}
          >
            <InputNumber placeholder={587} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="使用SSL/TLS" name="smtpSecure" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="SMTP 用户名"
            name="smtpUsername"
            rules={[{ required: true, message: '请输入SMTP用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="SMTP 密码"
            name="smtpPassword"
            rules={[{ required: true, message: '请输入SMTP密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAccount ? '更新账户' : '添加账户'}
              </Button>
              <Button onClick={() => setIsAccountModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settings