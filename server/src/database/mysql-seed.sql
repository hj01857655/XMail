-- MySQL 种子数据

USE email_manager;

-- 插入默认用户
INSERT INTO users (id, username, email, password_hash, display_name) VALUES
('user-001', 'admin', 'admin@xmail.com', '123456', 'Admin'),
('user-002', 'demo', 'demo@xmail.com', '123456', 'Demo');

-- 插入测试邮箱账户
INSERT INTO accounts (id, user_id, name, email, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, username, password_encrypted) VALUES
('account-001', 'user-001', 'Main', 'admin@xmail.com', 'imap.gmail.com', 993, TRUE, 'smtp.gmail.com', 587, TRUE, 'admin@xmail.com', 'pass123'),
('account-002', 'user-001', 'Work', 'work@company.com', 'imap.company.com', 993, TRUE, 'smtp.company.com', 587, TRUE, 'work@company.com', 'pass123'),
('account-003', 'user-002', 'Demo', 'demo@xmail.com', 'imap.example.com', 993, TRUE, 'smtp.example.com', 587, TRUE, 'demo@xmail.com', 'pass123');

-- 插入默认文件夹
INSERT INTO folders (id, account_id, name, type, sort_order, color) VALUES 
-- 主邮箱文件夹
('folder-001', 'account-001', '收件箱', 'inbox', 1, NULL),
('folder-002', 'account-001', '已发送', 'sent', 2, NULL),
('folder-003', 'account-001', '草稿箱', 'drafts', 3, NULL),
('folder-004', 'account-001', '垃圾箱', 'trash', 4, NULL),
('folder-005', 'account-001', '工作', 'custom', 5, '#1890ff'),
('folder-006', 'account-001', '个人', 'custom', 6, '#52c41a'),
('folder-007', 'account-001', '重要', 'custom', 7, '#f5222d'),

-- 工作邮箱文件夹
('folder-008', 'account-002', '收件箱', 'inbox', 1, NULL),
('folder-009', 'account-002', '已发送', 'sent', 2, NULL),
('folder-010', 'account-002', '草稿箱', 'drafts', 3, NULL),
('folder-011', 'account-002', '垃圾箱', 'trash', 4, NULL),
('folder-012', 'account-002', '项目A', 'custom', 5, '#722ed1'),
('folder-013', 'account-002', '项目B', 'custom', 6, '#13c2c2'),

-- 演示邮箱文件夹
('folder-014', 'account-003', '收件箱', 'inbox', 1, NULL),
('folder-015', 'account-003', '已发送', 'sent', 2, NULL),
('folder-016', 'account-003', '草稿箱', 'drafts', 3, NULL),
('folder-017', 'account-003', '垃圾箱', 'trash', 4, NULL);

-- 插入测试联系人
INSERT INTO contacts (id, user_id, name, email, phone, company, notes, frequency_score) VALUES 
('contact-001', 'user-001', '张三', 'zhangsan@company.com', '13800138000', '科技公司', '项目经理，负责产品开发', 10),
('contact-002', 'user-001', '李四', 'lisi@example.com', '13900139000', '设计工作室', 'UI/UX设计师，合作伙伴', 8),
('contact-003', 'user-001', '王五', 'wangwu@client.com', '13700137000', '客户公司', '重要客户，需要优先处理', 15),
('contact-004', 'user-001', '赵六', 'zhaoliu@team.com', '13600136000', '科技公司', '开发团队成员', 12),
('contact-005', 'user-001', '钱七', 'qianqi@vendor.com', '13500135000', '供应商', '技术支持联系人', 6),
('contact-006', 'user-002', '孙八', 'sunba@demo.com', '13400134000', '演示公司', '演示联系人', 5);

-- 插入联系人群组
INSERT INTO contact_groups (id, user_id, name, description, color) VALUES 
('group-001', 'user-001', '工作团队', '日常工作相关的联系人', '#1890ff'),
('group-002', 'user-001', '重要客户', '需要优先关注的客户', '#f5222d'),
('group-003', 'user-001', '合作伙伴', '外部合作伙伴和供应商', '#52c41a');

-- 插入群组成员关系
INSERT INTO contact_group_members (group_id, contact_id) VALUES 
('group-001', 'contact-001'),
('group-001', 'contact-004'),
('group-002', 'contact-003'),
('group-003', 'contact-002'),
('group-003', 'contact-005');

-- 插入测试邮件
INSERT INTO emails (id, account_id, folder_id, message_id, subject, from_address, to_addresses, body_text, date_received, is_read, is_starred, has_attachments) VALUES 
('email-001', 'account-001', 'folder-001', 'msg-001-2024', '欢迎使用 XMail 邮箱管理系统', 
 '{"name": "XMail 团队", "address": "team@xmail.com"}', 
 '[{"name": "管理员", "address": "admin@xmail.com"}]', 
 '欢迎使用 XMail 邮箱管理系统！\n\n这是一个功能强大的现代化邮件管理工具，支持多账户管理、智能分类、全文搜索等功能。\n\n主要特性：\n- 多邮箱账户统一管理\n- 智能邮件分类和文件夹\n- 强大的搜索功能\n- 联系人管理\n- 实时邮件同步\n- 现代化的用户界面\n\n如有任何问题，请随时联系我们。\n\n祝您使用愉快！\nXMail 团队', 
 NOW(), FALSE, TRUE, FALSE),

('email-002', 'account-001', 'folder-001', 'msg-002-2024', '项目进度更新 - 第一阶段完成', 
 '{"name": "张三", "address": "zhangsan@company.com"}', 
 '[{"name": "管理员", "address": "admin@xmail.com"}]', 
 '您好！\n\n很高兴向您汇报项目进展情况：\n\n第一阶段开发工作已经完成，主要包括：\n1. 用户界面设计和实现\n2. 基础功能模块开发\n3. 数据库设计和优化\n4. 初步测试和调试\n\n下一阶段计划：\n- 邮件同步功能优化\n- 搜索功能增强\n- 性能优化\n- 安全性加固\n\n预计完成时间：下周五\n\n如有任何问题或建议，请随时联系。\n\n最好的问候，\n张三', 
 DATE_SUB(NOW(), INTERVAL 2 HOUR), TRUE, FALSE, FALSE),

('email-003', 'account-001', 'folder-005', 'msg-003-2024', '会议邀请：产品评审会议', 
 '{"name": "李四", "address": "lisi@example.com"}', 
 '[{"name": "管理员", "address": "admin@xmail.com"}, {"name": "张三", "address": "zhangsan@company.com"}]', 
 '各位同事好！\n\n邀请您参加产品评审会议：\n\n时间：明天下午 2:00 - 4:00\n地点：会议室A\n议题：\n1. 产品功能演示\n2. 用户反馈讨论\n3. 下一版本规划\n\n请提前准备相关材料，谢谢！\n\n李四', 
 DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE, FALSE, TRUE),

('email-004', 'account-002', 'folder-008', 'msg-004-2024', '客户需求确认', 
 '{"name": "王五", "address": "wangwu@client.com"}', 
 '[{"name": "管理员", "address": "work@company.com"}]', 
 '您好！\n\n关于我们讨论的项目需求，现确认如下：\n\n1. 邮件管理系统需要支持多账户\n2. 需要提供移动端适配\n3. 要求支持邮件规则和自动分类\n4. 需要详细的使用统计报告\n\n请确认以上需求是否准确，如有遗漏请及时补充。\n\n期待您的回复。\n\n王五\n客户公司', 
 DATE_SUB(NOW(), INTERVAL 3 HOUR), TRUE, TRUE, FALSE);

-- 插入用户设置
INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES 
('user-001', 'theme', '"light"'),
('user-001', 'language', '"zh-CN"'),
('user-001', 'emailCheckInterval', '5'),
('user-001', 'showNotifications', 'true'),
('user-001', 'autoMarkAsRead', 'false'),
('user-002', 'theme', '"dark"'),
('user-002', 'language', '"zh-CN"'),
('user-002', 'emailCheckInterval', '10'),
('user-002', 'showNotifications', 'true'),
('user-002', 'autoMarkAsRead', 'true');
