import { Layout, Menu, Button, Typography } from 'antd'
import {
  InboxOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  SettingOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout
const { Title } = Typography

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <InboxOutlined />,
      label: '收件箱',
      onClick: () => navigate('/'),
    },
    {
      key: '/folder/sent',
      icon: <SendOutlined />,
      label: '已发送',
      onClick: () => navigate('/folder/sent'),
    },
    {
      key: '/folder/drafts',
      icon: <EditOutlined />,
      label: '草稿箱',
      onClick: () => navigate('/folder/drafts'),
    },
    {
      key: '/folder/trash',
      icon: <DeleteOutlined />,
      label: '垃圾箱',
      onClick: () => navigate('/folder/trash'),
    },
    {
      type: 'divider',
    },
    {
      key: 'folders',
      icon: <FolderOutlined />,
      label: '自定义文件夹',
      children: [
        {
          key: '/folder/work',
          label: '工作',
        },
        {
          key: '/folder/personal',
          label: '个人',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <Sider width={250} theme="light">
      <div style={{ padding: '16px' }}>
        <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
          邮箱管理
        </Title>
      </div>
      
      <div style={{ padding: '0 16px 16px' }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          block
          size="large"
          onClick={() => navigate('/compose')}
        >
          写邮件
        </Button>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ borderRight: 0 }}
      />

      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Button
          icon={<PlusOutlined />}
          block
          onClick={() => {
            // TODO: 打开添加账户对话框
          }}
        >
          添加账户
        </Button>
      </div>
    </Sider>
  )
}

export default Sidebar