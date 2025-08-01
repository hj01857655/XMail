import { useState } from 'react'
import { Layout, Input, Button, Avatar, Dropdown, Badge, Tooltip, Space, Modal, notification } from 'antd'
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SyncOutlined,
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  SunOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // 同步邮件
  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    notification.info({
      message: '正在同步邮件',
      description: '正在从服务器获取最新邮件...',
      key: 'sync',
      duration: 0
    })
    
    try {
      // TODO: 实现邮件同步逻辑
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟同步
      
      notification.success({
        message: '同步完成',
        description: '邮件已同步到最新状态',
        key: 'sync',
        duration: 3
      })
    } catch (error) {
      notification.error({
        message: '同步失败',
        description: '无法连接到邮件服务器，请稍后重试',
        key: 'sync',
        duration: 3
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // 撰写新邮件
  const handleCompose = () => {
    navigate('/compose')
  }

  // 刷新当前页面
  const handleRefresh = () => {
    window.location.reload()
  }

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 切换主题
  const handleToggleTheme = () => {
    toggleTheme()
    notification.success({
      message: `已切换到${!isDarkMode ? '深色' : '浅色'}主题`,
      duration: 2
    })
  }

  // 显示帮助
  const showHelp = () => {
    Modal.info({
      title: '使用帮助',
      width: 500,
      content: (
        <div>
          <h4>快捷键</h4>
          <ul>
            <li><strong>Ctrl + N</strong> - 撰写新邮件</li>
            <li><strong>Ctrl + R</strong> - 刷新页面</li>
            <li><strong>F11</strong> - 切换全屏</li>
            <li><strong>/</strong> - 快速搜索</li>
          </ul>
          <h4>功能说明</h4>
          <ul>
            <li><strong>同步</strong> - 获取最新邮件</li>
            <li><strong>过滤</strong> - 筛选邮件列表</li>
            <li><strong>主题</strong> - 切换深浅色主题</li>
          </ul>
        </div>
      )
    })
  }

  // 搜索邮件
  const handleSearch = (value: string) => {
    if (!value.trim()) return
    
    // TODO: 实现搜索功能
    navigate(`/emails?search=${encodeURIComponent(value)}`)
    notification.success({
      message: '搜索中',
      description: `正在搜索: ${value}`,
      duration: 2
    })
  }

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/settings')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确认退出',
          content: '您确定要退出登录吗？',
          onOk: () => {
            // TODO: 实现退出登录逻辑
            notification.success({
              message: '已退出登录',
              duration: 2
            })
          }
        })
      }
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
      {/* 左侧：搜索框 */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <Input
          placeholder="搜索邮件、联系人..."
          prefix={<SearchOutlined />}
          size="large"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onPressEnter={(e) => handleSearch(e.currentTarget.value)}
          allowClear
        />
      </div>

      {/* 右侧：工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 同步邮件 */}
        <Tooltip title="同步邮件">
          <Button
            type="text"
            icon={<SyncOutlined spin={isSyncing} />}
            size="large"
            onClick={handleSync}
            loading={isSyncing}
          />
        </Tooltip>

        {/* 撰写邮件 */}
        <Tooltip title="撰写新邮件 (Ctrl+N)">
          <Button
            type="text"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCompose}
          />
        </Tooltip>

        {/* 过滤器 */}
        <Tooltip title="过滤邮件">
          <Button
            type="text"
            icon={<FilterOutlined />}
            size="large"
            onClick={() => {
              // TODO: 实现过滤功能
              notification.info({ message: '过滤功能开发中', duration: 2 })
            }}
          />
        </Tooltip>

        {/* 刷新 */}
        <Tooltip title="刷新页面">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            size="large"
            onClick={handleRefresh}
          />
        </Tooltip>

        {/* 全屏切换 */}
        <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            size="large"
            onClick={toggleFullscreen}
          />
        </Tooltip>

        {/* 主题切换 */}
        <Tooltip title={isDarkMode ? '切换到浅色主题' : '切换到深色主题'}>
          <Button
            type="text"
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            size="large"
            onClick={handleToggleTheme}
          />
        </Tooltip>

        {/* 帮助 */}
        <Tooltip title="使用帮助">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            size="large"
            onClick={showHelp}
          />
        </Tooltip>

        {/* 通知 */}
        <Tooltip title="通知">
          <Badge count={5} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              size="large"
              onClick={() => {
                // TODO: 显示通知列表
                notification.info({ message: '通知功能开发中', duration: 2 })
              }}
            />
          </Badge>
        </Tooltip>

        {/* 用户菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            size="large"
            icon={<UserOutlined />}
            style={{ cursor: 'pointer', marginLeft: 8 }}
          />
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header