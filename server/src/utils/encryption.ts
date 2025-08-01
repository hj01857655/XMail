import CryptoJS from 'crypto-js'
import bcrypt from 'bcryptjs'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for security')
}
const SALT_ROUNDS = 12

export class EncryptionUtil {
  /**
   * 加密敏感数据（如邮箱密码）
   */
  static encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
      return encrypted
    } catch (error) {
      console.error('加密失败:', error)
      throw new Error('数据加密失败')
    }
  }

  /**
   * 解密敏感数据
   */
  static decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      
      if (!decrypted) {
        throw new Error('解密结果为空')
      }
      
      return decrypted
    } catch (error) {
      console.error('解密失败:', error)
      throw new Error('数据解密失败')
    }
  }

  /**
   * 哈希密码（用于用户认证）
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS)
      const hashedPassword = await bcrypt.hash(password, salt)
      return hashedPassword
    } catch (error) {
      console.error('密码哈希失败:', error)
      throw new Error('密码处理失败')
    }
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  /**
   * 生成随机密钥
   */
  static generateRandomKey(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString()
  }

  /**
   * 生成文件校验和
   */
  static generateChecksum(data: Buffer): string {
    return CryptoJS.SHA256(data.toString('hex')).toString()
  }

  /**
   * 验证数据完整性
   */
  static verifyChecksum(data: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data)
    return actualChecksum === expectedChecksum
  }
}

export default EncryptionUtil