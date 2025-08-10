# 邮件智能分类功能规范

## 概述
为 XMail 添加智能邮件分类功能，支持自动分类、手动分类、自定义分类规则等功能。

## 需求分析

### 功能需求

#### 1. 基础分类管理
- **系统预设分类**
  - 收件箱、发件箱、草稿箱、垃圾箱
  - 工作、个人、重要等常用分类
  
- **自定义分类**
  - 用户可创建自定义分类
  - 支持分类颜色标记
  - 分类描述和图标

#### 2. 智能分类规则
- **基于发件人的分类**
  - 域名规则（如 @company.com → 工作）
  - 特定邮箱地址规则
  
- **基于关键词的分类**
  - 主题关键词匹配
  - 内容关键词匹配
  - 支持正则表达式

- **基于时间的分类**
  - 工作时间邮件 → 工作分类
  - 周末邮件 → 个人分类

#### 3. 手动分类功能
- 拖拽分类
- 右键菜单分类
- 批量分类操作

### 技术需求

#### 数据模型扩展
```rust
// 邮件分类
pub struct EmailCategory {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_at: String,
}

// 分类规则
pub struct CategoryRule {
    pub id: i32,
    pub category_id: i32,
    pub rule_type: String, // sender, keyword, time
    pub pattern: String,
    pub is_active: bool,
    pub priority: i32,
    pub created_at: String,
}
```

#### API 接口设计
```rust
// 分类管理
#[tauri::command]
pub async fn get_email_categories() -> Result<Vec<EmailCategory>, String>

#[tauri::command]
pub async fn create_category(
    name: String,
    color: String,
    description: Option<String>
) -> Result<i64, String>

#[tauri::command]
pub async fn update_category(
    id: i32,
    name: String,
    color: String,
    description: Option<String>
) -> Result<(), String>

#[tauri::command]
pub async fn delete_category(id: i32) -> Result<(), String>

// 分类规则管理
#[tauri::command]
pub async fn get_category_rules(category_id: i32) -> Result<Vec<CategoryRule>, String>

#[tauri::command]
pub async fn create_category_rule(
    category_id: i32,
    rule_type: String,
    pattern: String,
    priority: i32
) -> Result<i64, String>

// 邮件分类操作
#[tauri::command]
pub async fn categorize_email(
    email_id: String,
    category_id: i32
) -> Result<(), String>

#[tauri::command]
pub async fn auto_categorize_emails() -> Result<i32, String> // 返回分类的邮件数量
```

## 实现设计

### 智能分类算法
```rust
pub struct EmailCategorizer {
    rules: Vec<CategoryRule>,
}

impl EmailCategorizer {
    pub fn categorize_email(&self, email: &Email) -> Option<i32> {
        // 按优先级排序规则
        let mut sorted_rules = self.rules.clone();
        sorted_rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        for rule in sorted_rules {
            if self.matches_rule(email, &rule) {
                return Some(rule.category_id);
            }
        }
        
        None // 使用默认分类
    }
    
    fn matches_rule(&self, email: &Email, rule: &CategoryRule) -> bool {
        match rule.rule_type.as_str() {
            "sender" => self.matches_sender_rule(email, &rule.pattern),
            "keyword" => self.matches_keyword_rule(email, &rule.pattern),
            "time" => self.matches_time_rule(email, &rule.pattern),
            _ => false,
        }
    }
    
    fn matches_sender_rule(&self, email: &Email, pattern: &str) -> bool {
        // 支持通配符和正则表达式
        if pattern.contains("*") {
            // 通配符匹配
            let regex_pattern = pattern.replace("*", ".*");
            if let Ok(regex) = regex::Regex::new(&regex_pattern) {
                return regex.is_match(&email.sender);
            }
        }
        
        email.sender.contains(pattern)
    }
    
    fn matches_keyword_rule(&self, email: &Email, pattern: &str) -> bool {
        let content = format!("{} {}", email.subject, email.body).to_lowercase();
        let pattern = pattern.to_lowercase();
        
        if pattern.starts_with("regex:") {
            // 正则表达式匹配
            let regex_pattern = &pattern[6..];
            if let Ok(regex) = regex::Regex::new(regex_pattern) {
                return regex.is_match(&content);
            }
        }
        
        content.contains(&pattern)
    }
    
    fn matches_time_rule(&self, email: &Email, pattern: &str) -> bool {
        // 时间规则匹配（工作时间、周末等）
        let created_time = email.created_at;
        
        match pattern {
            "work_hours" => {
                let hour = created_time.hour();
                let weekday = created_time.weekday();
                hour >= 9 && hour <= 18 && weekday.num_days_from_monday() < 5
            },
            "weekend" => {
                let weekday = created_time.weekday();
                weekday.num_days_from_monday() >= 5
            },
            _ => false,
        }
    }
}
```

### 用户界面设计

#### 分类管理界面
```vue
<template>
  <div class="category-manager">
    <div class="category-list">
      <div v-for="category in categories" :key="category.id" class="category-item">
        <div class="category-info">
          <span class="category-color" :style="{ backgroundColor: category.color }"></span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">({{ getCategoryCount(category.id) }})</span>
        </div>
        <div class="category-actions">
          <button @click="editCategory(category)">编辑</button>
          <button @click="deleteCategory(category.id)" v-if="!category.is_system">删除</button>
        </div>
      </div>
    </div>
    
    <div class="category-rules">
      <h3>分类规则</h3>
      <div v-for="rule in selectedCategoryRules" :key="rule.id" class="rule-item">
        <span class="rule-type">{{ getRuleTypeName(rule.rule_type) }}</span>
        <span class="rule-pattern">{{ rule.pattern }}</span>
        <span class="rule-priority">优先级: {{ rule.priority }}</span>
      </div>
    </div>
  </div>
</template>
```

#### 智能分类设置界面
```vue
<template>
  <div class="auto-categorization">
    <div class="rule-builder">
      <h3>创建分类规则</h3>
      <form @submit.prevent="createRule">
        <div class="form-group">
          <label>规则类型:</label>
          <select v-model="newRule.type">
            <option value="sender">发件人</option>
            <option value="keyword">关键词</option>
            <option value="time">时间</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>匹配模式:</label>
          <input v-model="newRule.pattern" placeholder="输入匹配模式">
          <small class="help-text">
            发件人: 支持通配符 (*@company.com)<br>
            关键词: 支持正则表达式 (regex:pattern)<br>
            时间: work_hours, weekend
          </small>
        </div>
        
        <div class="form-group">
          <label>目标分类:</label>
          <select v-model="newRule.categoryId">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>优先级:</label>
          <input type="number" v-model="newRule.priority" min="1" max="100">
        </div>
        
        <button type="submit">创建规则</button>
      </form>
    </div>
    
    <div class="auto-categorize-actions">
      <button @click="runAutoCategorization" :disabled="running">
        {{ running ? '分类中...' : '运行自动分类' }}
      </button>
      <div v-if="lastResult" class="result">
        已分类 {{ lastResult }} 封邮件
      </div>
    </div>
  </div>
</template>
```

## 实现计划

### 阶段一：基础分类功能
- [ ] 扩展数据库表结构
- [ ] 实现分类 CRUD 操作
- [ ] 创建分类管理界面

### 阶段二：手动分类功能
- [ ] 邮件列表拖拽分类
- [ ] 右键菜单分类
- [ ] 批量分类操作

### 阶段三：智能分类规则
- [ ] 分类规则数据模型
- [ ] 规则匹配算法实现
- [ ] 规则管理界面

### 阶段四：自动分类功能
- [ ] 自动分类服务
- [ ] 定时分类任务
- [ ] 分类结果统计

### 阶段五：高级功能
- [ ] 机器学习分类（未来版本）
- [ ] 分类规则导入导出
- [ ] 分类性能优化

## 测试计划

### 功能测试
- [ ] 分类 CRUD 操作测试
- [ ] 规则匹配算法测试
- [ ] 自动分类准确性测试

### 性能测试
- [ ] 大量邮件分类性能测试
- [ ] 规则匹配效率测试
- [ ] 界面响应性能测试

### 用户体验测试
- [ ] 分类操作流畅性测试
- [ ] 规则创建易用性测试
- [ ] 分类结果准确性验证

## 成功标准

### 功能完整性
- [ ] 支持至少 3 种分类规则类型
- [ ] 自动分类准确率 > 80%
- [ ] 支持至少 20 个自定义分类

### 性能指标
- [ ] 1000 封邮件分类时间 < 5s
- [ ] 规则匹配响应时间 < 100ms
- [ ] 界面操作响应时间 < 500ms

### 用户体验
- [ ] 分类操作直观易懂
- [ ] 规则创建简单明了
- [ ] 分类结果可视化清晰