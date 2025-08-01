import DatabaseManager from '../config/database'
import AccountDAO from '../database/account-dao'
import EmailDAO from '../database/email-dao'
import FolderDAO from '../database/folder-dao'
import ContactDAO from '../database/contact-dao'

describe('Database Tests', () => {
  let dbManager: DatabaseManager
  let accountDAO: AccountDAO
  let emailDAO: EmailDAO
  let folderDAO: FolderDAO
  let contactDAO: ContactDAO

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance()
    await dbManager.connect()
    
    accountDAO = new AccountDAO()
    emailDAO = new EmailDAO()
    folderDAO = new FolderDAO()
    contactDAO = new ContactDAO()
  })

  afterAll(async () => {
    await dbManager.disconnect()
  })

  describe('Database Connection', () => {
    test('should connect to PostgreSQL and Redis', async () => {
      const health = await dbManager.healthCheck()
      expect(health.postgres).toBe(true)
      expect(health.redis).toBe(true)
    })
  })

  describe('Account DAO', () => {
    let testAccountId: string

    test('should create account', async () => {
      const accountData = {
        name: 'Test Account',
        email: 'test@example.com',
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: true,
        username: 'test@example.com',
        password: 'test-password',
      }

      testAccountId = await accountDAO.create(accountData)
      expect(testAccountId).toBeDefined()
    })

    test('should find account by id', async () => {
      const account = await accountDAO.findById(testAccountId)
      expect(account).toBeDefined()
      expect(account?.email).toBe('test@example.com')
    })

    test('should update account', async () => {
      const updated = await accountDAO.update(testAccountId, {
        name: 'Updated Test Account',
      })
      expect(updated).toBe(true)

      const account = await accountDAO.findById(testAccountId)
      expect(account?.name).toBe('Updated Test Account')
    })

    test('should delete account', async () => {
      const deleted = await accountDAO.delete(testAccountId)
      expect(deleted).toBe(true)

      const account = await accountDAO.findById(testAccountId)
      expect(account).toBeNull()
    })
  })

  describe('Contact DAO', () => {
    let testContactId: string

    test('should create contact', async () => {
      const contactData = {
        name: 'Test Contact',
        email: 'contact@example.com',
        phone: '13800138000',
        notes: 'Test notes',
        frequencyScore: 1,
      }

      testContactId = await contactDAO.create(contactData)
      expect(testContactId).toBeDefined()
    })

    test('should find contact by email', async () => {
      const contact = await contactDAO.findByEmail('contact@example.com')
      expect(contact).toBeDefined()
      expect(contact?.name).toBe('Test Contact')
    })

    test('should increment frequency', async () => {
      await contactDAO.incrementFrequency('contact@example.com')
      
      const contact = await contactDAO.findByEmail('contact@example.com')
      expect(contact?.frequencyScore).toBe(2)
    })

    test('should delete contact', async () => {
      const deleted = await contactDAO.delete(testContactId)
      expect(deleted).toBe(true)
    })
  })
})