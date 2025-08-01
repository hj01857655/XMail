import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from '@components/Layout/Sidebar'
import Header from '@components/Layout/Header'
import EmailList from '@pages/EmailList'
import EmailDetail from '@pages/EmailDetail'
import Compose from '@pages/Compose'
import Settings from '@pages/Settings'
import './App.css'

const { Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Sidebar />
      <Layout style={{ display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Content
          style={{
            margin: '16px',
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Routes>
            <Route path="/" element={<EmailList />} />
            <Route path="/folder/:folderId" element={<EmailList />} />
            <Route path="/email/:emailId" element={<EmailDetail />} />
            <Route path="/compose" element={<Compose />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App