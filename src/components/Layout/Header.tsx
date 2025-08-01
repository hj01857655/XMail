import { Layout, Input, Button, Avatar, Dropdown, Badge } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout

const Header = () => {
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        height: '64px',
        lineHeight: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1, maxWidth: 400 }}>
        <Input
          placeholder="搜索邮件..."
          prefix={<SearchOutlined />}
          size="large"
          onPressEnter={(e) => {
            // TODO: 实现搜索功能
            console.log('搜索:', e.currentTarget.value)
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            size="large"
            onClick={() => {
              // TODO: 显示通知列表
            }}
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            size="large"
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header