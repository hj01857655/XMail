<template>
  <div class="app">
    <!-- 头部 -->
    <header class="header">
      <h1>📧 邮件管理系统</h1>
      <div class="stats">
        <span>总计: {{ statistics.total_count }}</span>
        <span>未读: {{ statistics.unread_count }}</span>
        <span>重要: {{ statistics.important_count }}</span>
      </div>
    </header>

    <!-- 主体 -->
    <div class="main-container">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <input 
          v-model="searchKeyword" 
          @input="filterEmails"
          type="text" 
          class="search-box" 
          placeholder="搜索邮件..."
        >
        
        <div class="filter-section">
          <h3>状态筛选</h3>
          <div class="filter-options">
            <label>
              <input v-model="filterUnread" @change="filterEmails" type="checkbox"> 
              只显示未读
            </label>
            <label>
              <input v-model="filterImportant" @change="filterEmails" type="checkbox"> 
              只显示重要
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3>分类筛选</h3>
          <select v-model="selectedCategory" @change="filterEmails" class="category-select">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <!-- 分类管理 -->
        <CategoryManager @categories-updated="loadCategories" />

        <div class="actions">
          <button @click="showCreateModal = true" class="btn btn-primary">新建邮件</button>
          <button @click="showAccountModal = true" class="btn btn-info">账户管理</button>
          <button @click="refreshData" class="btn btn-success">刷新</button>
        </div>
      </aside>

      <!-- 邮件列表 -->
      <div class="email-list">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="filteredEmails.length === 0" class="empty">没有邮件</div>
        <div 
          v-else
          v-for="email in filteredEmails" 
          :key="email.id"
          :class="['email-item', { 
            'unread': !email.is_read, 
            'selected': selectedEmail?.id === email.id 
          }]"
          @click="selectEmail(email)"
        >
          <div class="email-header">
            <span class="email-sender">{{ email.sender }}</span>
            <span class="email-time">{{ formatDate(email.created_at) }}</span>
          </div>
          <div class="email-subject">
            {{ email.subject }}
            <span v-if="email.is_important" class="important">⭐</span>
          </div>
          <div class="email-preview">{{ truncateText(email.body, 100) }}</div>
          <div class="email-meta">
            <span class="email-category">{{ email.category }}</span>
            <span>{{ email.is_read ? '已读' : '未读' }}</span>
          </div>
        </div>
      </div>

      <!-- 邮件详情 -->
      <div class="email-detail" :class="{ empty: !selectedEmail }">
        <div v-if="!selectedEmail" class="empty-message">
          请选择一封邮件查看详情
        </div>
        <div v-else>
          <div class="detail-header">
            <h2 class="detail-subject">{{ selectedEmail.subject }}</h2>
            <div class="detail-meta">
              <div><strong>发件人:</strong> {{ selectedEmail.sender }}</div>
              <div><strong>收件人:</strong> {{ selectedEmail.recipient }}</div>
              <div><strong>分类:</strong> {{ selectedEmail.category }}</div>
              <div><strong>时间:</strong> {{ formatDateTime(selectedEmail.created_at) }}</div>
              <div><strong>状态:</strong> {{ selectedEmail.is_read ? '已读' : '未读' }}</div>
              <div><strong>重要:</strong> {{ selectedEmail.is_important ? '是' : '否' }}</div>
            </div>
          </div>
          <div class="detail-content">{{ selectedEmail.body }}</div>
          <div class="actions">
            <button 
              @click="toggleImportant(selectedEmail)" 
              class="btn"
              :class="selectedEmail.is_important ? 'btn-warning' : 'btn-secondary'"
            >
              {{ selectedEmail.is_important ? '取消重要' : '标记重要' }}
            </button>
            <button @click="deleteEmail(selectedEmail.id)" class="btn btn-danger">
              删除邮件
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建邮件模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>新建邮件</h2>
          <button @click="showCreateModal = false" class="modal-close">✕</button>
        </div>
        <form @submit.prevent="createEmail" class="modal-body">
          <div class="form-group">
            <label>发件人:</label>
            <input v-model="newEmail.sender" type="email" required class="form-input">
          </div>
          <div class="form-group">
            <label>收件人:</label>
            <input v-model="newEmail.recipient" type="email" required class="form-input">
          </div>
          <div class="form-group">
            <label>主题:</label>
            <input v-model="newEmail.subject" type="text" required class="form-input">
          </div>
          <div class="form-group">
            <label>分类:</label>
            <select v-model="newEmail.category" class="form-select">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>内容:</label>
            <textarea v-model="newEmail.body" required class="form-textarea" rows="6"></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">取消</button>
          <button @click="createEmail" class="btn btn-primary">发送</button>
        </div>
      </div>
    </div>

    <!-- 账户管理模态框 -->
    <div v-if="showAccountModal" class="modal-overlay" @click="showAccountModal = false">
      <div class="modal-content fullscreen" @click.stop>
        <div class="modal-header">
          <h2>邮件账户管理</h2>
          <button @click="showAccountModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <AccountManager @emails-synced="onEmailsSynced" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/core'
import AccountManager from './components/AccountManager.vue'
import CategoryManager from './components/CategoryManager.vue'

export default {
  name: 'App',
  components: {
    AccountManager,
    CategoryManager
  },
  data() {
    return {
      emails: [],
      filteredEmails: [],
      selectedEmail: null,
      categories: [],
      statistics: {
        total_count: 0,
        unread_count: 0,
        important_count: 0
      },
      loading: true,
      
      // 筛选条件
      searchKeyword: '',
      filterUnread: false,
      filterImportant: false,
      selectedCategory: '',
      
      // 创建邮件
      showCreateModal: false,
      showAccountModal: false,
      newEmail: {
        sender: '',
        recipient: '',
        subject: '',
        body: '',
        category: 'personal'
      }
    }
  },
  
  async mounted() {
    await this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadEmails(),
          this.loadCategories(),
          this.loadStatistics()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadEmails() {
      try {
        this.emails = await invoke('get_all_emails')
        this.filterEmails()
      } catch (error) {
        console.error('加载邮件失败:', error)
      }
    },
    
    async loadCategories() {
      try {
        this.categories = await invoke('get_categories')
        if (this.categories.length > 0) {
          this.newEmail.category = this.categories[0]
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },
    
    async loadStatistics() {
      try {
        this.statistics = await invoke('get_statistics')
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },
    
    filterEmails() {
      this.filteredEmails = this.emails.filter(email => {
        // 搜索筛选
        if (this.searchKeyword) {
          const keyword = this.searchKeyword.toLowerCase()
          if (!email.subject.toLowerCase().includes(keyword) &&
              !email.body.toLowerCase().includes(keyword) &&
              !email.sender.toLowerCase().includes(keyword)) {
            return false
          }
        }
        
        // 未读筛选
        if (this.filterUnread && email.is_read) return false
        
        // 重要筛选
        if (this.filterImportant && !email.is_important) return false
        
        // 分类筛选
        if (this.selectedCategory && email.category !== this.selectedCategory) return false
        
        return true
      })
    },
    
    async selectEmail(email) {
      this.selectedEmail = email
      
      // 如果是未读邮件，标记为已读
      if (!email.is_read) {
        try {
          await invoke('mark_email_as_read', { id: email.id })
          email.is_read = true
          await this.loadStatistics()
        } catch (error) {
          console.error('标记已读失败:', error)
        }
      }
    },
    
    async toggleImportant(email) {
      try {
        await invoke('mark_email_as_important', { id: email.id })
        email.is_important = !email.is_important
        await this.loadStatistics()
      } catch (error) {
        console.error('切换重要状态失败:', error)
        alert('操作失败: ' + error)
      }
    },
    
    async deleteEmail(emailId) {
      if (!confirm('确定要删除这封邮件吗？')) return
      
      try {
        await invoke('delete_email', { id: emailId })
        this.emails = this.emails.filter(e => e.id !== emailId)
        this.filterEmails()
        
        if (this.selectedEmail?.id === emailId) {
          this.selectedEmail = null
        }
        
        await this.loadStatistics()
        alert('邮件已删除')
      } catch (error) {
        console.error('删除邮件失败:', error)
        alert('删除失败: ' + error)
      }
    },
    
    async createEmail() {
      try {
        await invoke('create_email', {
          sender: this.newEmail.sender,
          recipient: this.newEmail.recipient,
          subject: this.newEmail.subject,
          body: this.newEmail.body,
          category: this.newEmail.category
        })
        
        // 重置表单
        this.newEmail = {
          sender: '',
          recipient: '',
          subject: '',
          body: '',
          category: this.categories[0] || 'personal'
        }
        
        this.showCreateModal = false
        await this.loadData()
        alert('邮件创建成功！')
      } catch (error) {
        console.error('创建邮件失败:', error)
        alert('创建失败: ' + error)
      }
    },
    
    async refreshData() {
      await this.loadData()
    },
    
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    },
    
    formatDateTime(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },

    onEmailsSynced(emails) {
      // 处理同步的邮件
      console.log('同步了邮件:', emails)
      // 刷新邮件列表
      this.refreshData()
    }
  }
}
</script>

<style>
.modal-content.fullscreen {
  width: 95%;
  height: 90%;
  max-width: none;
  max-height: none;
}

.modal-content.fullscreen .modal-body {
  height: calc(100% - 120px);
  overflow-y: auto;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
  border: 1px solid #17a2b8;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #117a8b;
}
</style>