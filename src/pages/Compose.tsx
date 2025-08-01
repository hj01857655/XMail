import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Space,
  Select,
  message,
  Typography,
  Divider,
} from 'antd'
import {
  SendOutlined,
  PaperClipOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import type { Email } from '@/types/index'

const { TextArea } = Input
const { Option } = Select
const { Title } = Typography

interface ComposeState {
  mode?: 'new' | 'reply' | 'forward'
  originalEmail?: Email
}

const Compose = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const state = location.state as ComposeState
  const mode = state?.mode || 'new'
  const originalEmail = state?.originalEmail

  useEffect(() => {
    if (mode === 'reply' && originalEmail) {
      form.setFieldsValue({
        to: originalEmail.from.address,
        subject: originalEmail.subject.startsWith('Re: ')
          ? originalEmail.subject
          : `Re: ${originalEmail.subject}`,
        body: `\n\n--- 原始邮件 ---\n发件人: ${originalEmail.from.name || originalEmail.from.address}\n时间: ${originalEmail.dateReceived}\n主题: ${originalEmail.subject}\n\n${originalEmail.bodyText}`,
      })
    } else if (mode === 'forward' && originalEmail) {
      form.setFieldsValue({
        subject: originalEmail.subject.startsWith('Fwd: ')
          ? originalEmail.subject
          : `Fwd: ${originalEmail.subject}`,
        body: `\n\n--- 转发邮件 ---\n发件人: ${originalEmail.from.name || originalEmail.from.address}\n时间: ${originalEmail.dateReceived}\n主题: ${originalEmail.subject}\n\n${originalEmail.bodyText}`,
      })
    }
  }, [mode, originalEmail, form])

  const handleSend = async (values: any) => {
    setLoading(true)
    try {
      // TODO: 调用发送邮件API
      console.log('发送邮件:', values, fileList)
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('邮件发送成功')
      navigate('/')
    } catch (error) {
      message.error('邮件发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      // TODO: 保存草稿API
      console.log('保存草稿:', values, fileList)
      message.success('草稿已保存')
    } catch (error) {
      message.error('保存草稿失败')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const getTitle = () => {
    switch (mode) {
      case 'reply':
        return '回复邮件'
      case 'forward':
        return '转发邮件'
      default:
        return '写邮件'
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={3} style={{ display: 'inline', margin: 0 }}>
          {getTitle()}
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
          initialValues={{
            from: 'user@example.com', // TODO: 从当前用户获取
          }}
        >
          <Form.Item
            label="发件人"
            name="from"
            rules={[{ required: true, message: '请选择发件人' }]}
          >
            <Select placeholder="选择发件人账户">
              <Option value="user@example.com">user@example.com</Option>
              <Option value="work@company.com">work@company.com</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="收件人"
            name="to"
            rules={[
              { required: true, message: '请输入收件人' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="输入收件人邮箱地址" />
          </Form.Item>

          <Form.Item label="抄送" name="cc">
            <Input placeholder="输入抄送邮箱地址（可选）" />
          </Form.Item>

          <Form.Item label="密送" name="bcc">
            <Input placeholder="输入密送邮箱地址（可选）" />
          </Form.Item>

          <Form.Item
            label="主题"
            name="subject"
            rules={[{ required: true, message: '请输入邮件主题' }]}
          >
            <Input placeholder="输入邮件主题" />
          </Form.Item>

          <Form.Item label="附件">
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false} // 阻止自动上传
              multiple
            >
              <Button icon={<PaperClipOutlined />}>添加附件</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="邮件内容"
            name="body"
            rules={[{ required: true, message: '请输入邮件内容' }]}
          >
            <TextArea
              rows={15}
              placeholder="输入邮件内容..."
              className="compose-editor"
            />
          </Form.Item>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                htmlType="submit"
                loading={loading}
                size="large"
              >
                发送
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
                size="large"
              >
                保存草稿
              </Button>
            </Space>

            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => {
                form.resetFields()
                setFileList([])
                message.success('已清空内容')
              }}
            >
              清空
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Compose