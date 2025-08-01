import DatabaseManager from '../config/database'
import {
  AccountDAO,
  EmailDAO,
  FolderDAO,
  ContactDAO,
  AttachmentDAO,
} from '../database'
import type {
  AccountData,
  EmailData,
  FolderData,
  ContactData,
  AttachmentData,
} from '../database'

describe('DAO Tests', () => {
  let dbManager: DatabaseManager
  let accountDAO: AccountDAO
  let emailDAO: EmailDAO
  let folderDAO: FolderDAO
  let contactDAO: ContactDAO
  let attachmentDAO: AttachmentDAO

  // 测试数据
  let testAccountId: string
  let testFolderId: string
  let testEmailId: string
  let testContactId: string
  let testAttachmentId: string

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance()
    await dbManager.connect()
    
    accountDAO = new AccountDAO()
    emailDAO = new EmailDAO()
    folderDAO = new FolderDAO()
    contactDAO = new ContactDAO()
    attachmentDAO = new AttachmentDAO()
  })

  afterAll(async () => {
    // 清理测试数据
    if (testAttachmentId) await attachmentDAO.delete(testAttachmentId)
    if (testEmailId) await emailDAO.permanentDelete(testEmailId)
    if (testContactId) await contactDAO.delete(testContactId)
    if (testFolderId) await folderDAO.delete(testFolderId)
    if (testAccountId) await accountDAO.delete(testAccountId)
    
    await dbManager.disconnect()
  })

  describe('AccountDAO', () => {
    test('should create account with encrypted password', async () => {
      const accountData: AccountData = {
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
      expect(testAccountId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    test('should find account by id and decrypt password', async () => {
      const account = await accountDAO.findById(testAccountId)
      expect(account).toBeDefined()
      expect(account?.email).toBe('test@example.com')
      expect(account?.password).toBe('test-password') // 应该被解密
    })

    test('should find account by email', async () => {
      const account = await accountDAO.findByEmail('test@example.com')
      expect(account).toBeDefined()
      expect(account?.id).toBe(testAccountId)
    })

    test('should update account', async () => {
      const updated = await accountDAO.update(testAccountId, {
        name: 'Updated Test Account',
      })
      expect(updated).toBe(true)

      const account = await accountDAO.findById(testAccountId)
      expect(account?.name).toBe('Updated Test Account')
    })

    test('should check email existence', async () => {
      const exists = await accountDAO.emailExists('test@example.com')
      expect(exists).toBe(true)

      const notExists = await accountDAO.emailExists('nonexistent@example.com')
      expect(notExists).toBe(false)
    })

    test('should get account stats', async () => {
      const stats = await accountDAO.getStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.active).toBeGreaterThan(0)
    })
  })

  describe('FolderDAO', () => {
    test('should create default folders for account', async () => {
      await folderDAO.createDefaultFolders(testAccountId)
      
      const folders = await folderDAO.findByAccountId(testAccountId)
      expect(folders.length).toBeGreaterThanOrEqual(4) // inbox, sent, drafts, trash
      
      const systemFolders = await folderDAO.getSystemFolders(testAccountId)
      expect(systemFolders.length).toBe(4)
    })

    test('should create custom folder', async () => {
      const folderData: FolderData = {
        accountId: testAccountId,
        name: 'Test Folder',
        type: 'custom',
        color: '#ff0000',
        sortOrder: 10,
      }

      testFolderId = await folderDAO.create(folderData)
      expect(testFolderId).toBeDefined()
    })

    test('should get folder tree with stats', async () => {
      const tree = await folderDAO.getFolderTree(testAccountId)
      expect(tree.length).toBeGreaterThan(0)
      
      const customFolder = tree.find(f => f.name === 'Test Folder')
      expect(customFolder).toBeDefined()
      expect(customFolder?.unreadCount).toBe(0)
      expect(customFolder?.totalCount).toBe(0)
    })

    test('should check folder name existence', async () => {
      const exists = await folderDAO.nameExists(testAccountId, 'Test Folder')
      expect(exists).toBe(true)

      const notExists = await folderDAO.nameExists(testAccountId, 'Nonexistent Folder')
      expect(notExists).toBe(false)
    })
  })

  describe('ContactDAO', () => {
    test('should create contact', async () => {
      const contactData: ContactData = {
        name: 'Test Contact',
        email: 'contact@example.com',
        phone: '13800138000',
        notes: 'Test contact notes',
        frequencyScore: 1,
      }

      testContactId = await contactDAO.create(contactData)
      expect(testContactId).toBeDefined()
    })

    test('should find contact by email', async () => {
      const contact = await contactDAO.findByEmail('contact@example.com')
      expect(contact).toBeDefined()
      expect(contact?.name).toBe('Test Contact')
      expect(contact?.phone).toBe('13800138000')
    })

    test('should increment frequency score', async () => {
      await contactDAO.incrementFrequency('contact@example.com')
      
      const contact = await contactDAO.findByEmail('contact@example.com')
      expect(contact?.frequencyScore).toBe(2)
    })

    test('should search contacts for autocomplete', async () => {
      const results = await contactDAO.searchForAutocomplete('Test', 10)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].name).toContain('Test')
    })

    test('should get contact stats', async () => {
      const stats = await contactDAO.getStats()
      expect(stats.total).toBeGreaterThan(0)
    })
  })

  describe('EmailDAO', () => {
    test('should create email', async () => {
      // 先获取一个文件夹ID
      const folders = await folderDAO.findByAccountId(testAccountId)
      const inboxFolder = folders.find(f => f.type === 'inbox')
      expect(inboxFolder).toBeDefined()

      const emailData: EmailData = {
        accountId: testAccountId,
        folderId: inboxFolder!.id!,
        messageId: 'test-message-id-123',
        subject: 'Test Email Subject',
        fromAddress: { name: 'Test Sender', address: 'sender@example.com' },
        toAddresses: [{ name: 'Test Recipient', address: 'recipient@example.com' }],
        bodyText: 'This is a test email body',
        dateReceived: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
        hasAttachments: false,
        sizeBytes: 1024,
      }

      testEmailId = await emailDAO.create(emailData)
      expect(testEmailId).toBeDefined()
    })

    test('should find email by id', async () => {
      const email = await emailDAO.findById(testEmailId)
      expect(email).toBeDefined()
      expect(email?.subject).toBe('Test Email Subject')
      expect(email?.fromAddress.address).toBe('sender@example.com')
    })

    test('should find email by message id', async () => {
      const email = await emailDAO.findByMessageId(testAccountId, 'test-message-id-123')
      expect(email).toBeDefined()
      expect(email?.id).toBe(testEmailId)
    })

    test('should update email status', async () => {
      const updated = await emailDAO.update(testEmailId, {
        isRead: true,
        isStarred: true,
      })
      expect(updated).toBe(true)

      const email = await emailDAO.findById(testEmailId)
      expect(email?.isRead).toBe(true)
      expect(email?.isStarred).toBe(true)
    })

    test('should get folder stats', async () => {
      const folders = await folderDAO.findByAccountId(testAccountId)
      const inboxFolder = folders.find(f => f.type === 'inbox')
      
      const stats = await emailDAO.getFolderStats(inboxFolder!.id!)
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.starred).toBeGreaterThan(0)
    })

    test('should perform full text search', async () => {
      const results = await emailDAO.fullTextSearch('Test Email', testAccountId)
      expect(results.items.length).toBeGreaterThan(0)
      expect(results.items[0].subject).toContain('Test Email')
    })
  })

  describe('AttachmentDAO', () => {
    test('should create attachment', async () => {
      const attachmentData: AttachmentData = {
        emailId: testEmailId,
        filename: 'test-file.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2048,
        filePath: '/uploads/test-file.pdf',
        checksum: 'abc123def456',
      }

      testAttachmentId = await attachmentDAO.create(attachmentData)
      expect(testAttachmentId).toBeDefined()
    })

    test('should find attachments by email id', async () => {
      const attachments = await attachmentDAO.findByEmailId(testEmailId)
      expect(attachments.length).toBe(1)
      expect(attachments[0].filename).toBe('test-file.pdf')
    })

    test('should get attachment stats', async () => {
      const stats = await attachmentDAO.getStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    test('should get stats by content type', async () => {
      const stats = await attachmentDAO.getStatsByContentType()
      expect(stats.length).toBeGreaterThan(0)
      
      const pdfStats = stats.find(s => s.contentType === 'application/pdf')
      expect(pdfStats).toBeDefined()
      expect(pdfStats?.count).toBeGreaterThan(0)
    })
  })

  describe('Pagination and Filtering', () => {
    test('should paginate email results', async () => {
      const result = await emailDAO.findWithPagination(
        { accountId: testAccountId },
        { page: 1, pageSize: 10 }
      )

      expect(result.items).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBeGreaterThanOrEqual(1)
    })

    test('should filter emails by read status', async () => {
      const result = await emailDAO.findWithPagination(
        { accountId: testAccountId, isRead: true },
        { page: 1, pageSize: 10 }
      )

      expect(result.items.every(email => email.isRead)).toBe(true)
    })

    test('should paginate contact results with search', async () => {
      const result = await contactDAO.findWithPagination(
        { search: 'Test' },
        { page: 1, pageSize: 10 }
      )

      expect(result.items.length).toBeGreaterThan(0)
      expect(result.items[0].name).toContain('Test')
    })
  })

  describe('Batch Operations', () => {
    test('should batch update email status', async () => {
      const updatedCount = await emailDAO.batchUpdateStatus(
        [testEmailId],
        { isRead: false }
      )

      expect(updatedCount).toBe(1)

      const email = await emailDAO.findById(testEmailId)
      expect(email?.isRead).toBe(false)
    })

    test('should batch increment contact frequency', async () => {
      await contactDAO.batchIncrementFrequency(['contact@example.com'])
      
      const contact = await contactDAO.findByEmail('contact@example.com')
      expect(contact?.frequencyScore).toBe(3) // 之前是2，现在应该是3
    })
  })
})