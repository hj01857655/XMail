import dotenv from 'dotenv'

// 加载测试环境变量
dotenv.config({ path: '.env.test' })

// 设置测试超时
jest.setTimeout(30000)

// 全局测试设置
beforeAll(() => {
  // 设置测试环境
  process.env.NODE_ENV = 'test'
})

afterAll(() => {
  // 清理测试环境
})