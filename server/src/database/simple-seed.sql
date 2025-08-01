USE email_manager;

-- 插入用户
INSERT INTO users (id, username, email, password_hash, display_name) VALUES 
('user-001', 'admin', 'admin@xmail.com', '123456', 'Admin');

-- 插入账户
INSERT INTO accounts (id, user_id, name, email, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, username, password_encrypted) VALUES 
('account-001', 'user-001', 'Main', 'admin@xmail.com', 'imap.gmail.com', 993, TRUE, 'smtp.gmail.com', 587, TRUE, 'admin@xmail.com', 'pass123');

-- 插入文件夹
INSERT INTO folders (id, account_id, name, type, sort_order) VALUES 
('folder-001', 'account-001', 'Inbox', 'inbox', 1),
('folder-002', 'account-001', 'Sent', 'sent', 2),
('folder-003', 'account-001', 'Drafts', 'drafts', 3),
('folder-004', 'account-001', 'Trash', 'trash', 4);

-- 插入联系人
INSERT INTO contacts (id, user_id, name, email, phone, notes) VALUES 
('contact-001', 'user-001', 'Zhang San', 'zhang@test.com', '13800138000', 'Test contact'),
('contact-002', 'user-001', 'Li Si', 'li@test.com', '13900139000', 'Another contact');

-- 插入测试邮件
INSERT INTO emails (id, account_id, folder_id, message_id, subject, from_address, to_addresses, body_text, date_received) VALUES 
('email-001', 'account-001', 'folder-001', 'msg-001', 'Welcome to XMail', 
 '{"name": "XMail Team", "address": "team@xmail.com"}', 
 '[{"name": "Admin", "address": "admin@xmail.com"}]', 
 'Welcome to XMail email management system!', 
 NOW()),
('email-002', 'account-001', 'folder-001', 'msg-002', 'Test Email', 
 '{"name": "Zhang San", "address": "zhang@test.com"}', 
 '[{"name": "Admin", "address": "admin@xmail.com"}]', 
 'This is a test email message.', 
 DATE_SUB(NOW(), INTERVAL 1 HOUR));
