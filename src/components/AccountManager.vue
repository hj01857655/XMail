<template>
  <div class="account-manager">
    <div class="account-header">
      <h2>📧 邮件账户管理</h2>
      <button @click="showAddModal = true" class="btn btn-primary">
        添加账户
      </button>
    </div>

    <!-- 账户列表 -->
    <div class="account-list">
      <div v-if="accounts.length === 0" class="empty">
        暂无邮件账户，请添加一个账户开始使用
      </div>
      <div 
        v-else
        v-for="account in accounts" 
        :key="account.id"
        class="account-item"
        :class="{ inactive: !account.is_active }"
      >
        <div class="account-info">
          <div class="account-email">{{ account.email_address }}</div>
          <div class="account-name">{{ account.display_name }}</div>
          <div class="account-provider">{{ getProviderName(account.provider_id) }}</div>
          <div class="account-sync">
            最后同步: {{ formatDate(account.last_sync) }}
          </div>
        </div>
        <div class="account-actions">
          <button 
            @click="syncAccount(account.id)" 
            class="btn btn-sm btn-success"
            :disabled="syncing === account.id"
          >
            {{ syncing === account.id ? '同步中...' : '同步' }}
          </button>
          <button 
            @click="toggleAccount(account.id)" 
            class="btn btn-sm"
            :class="account.is_active ? 'btn-warning' : 'btn-secondary'"
          >
            {{ account.is_active ? '禁用' : '启用' }}
          </button>
          <button 
            @click="deleteAccount(account.id)" 
            class="btn btn-sm btn-danger"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加账户模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>添加邮件账户</h3>
          <button @click="showAddModal = false" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>邮件服务商:</label>
            <select v-model="newAccount.provider_id" class="form-select" @change="onProviderChange">
              <option value="">请选择服务商</option>
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                {{ provider.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>邮箱地址:</label>
            <input 
              v-model="newAccount.email_address" 
              type="email" 
              required 
              class="form-input"
              placeholder="example@gmail.com"
            >
          </div>

          <div class="form-group">
            <label>显示名称:</label>
            <input 
              v-model="newAccount.display_name" 
              type="text" 
              required 
              class="form-input"
              placeholder="张三"
            >
          </div>

          <div class="form-group">
            <label>用户名:</label>
            <input 
              v-model="newAccount.username" 
              type="text" 
              required 
              class="form-input"
              placeholder="通常与邮箱地址相同"
            >
          </div>

          <div class="form-group">
            <label>密码/授权码:</label>
            <input 
              v-model="newAccount.password" 
              type="password" 
              required 
              class="form-input"
              placeholder="邮箱密码或应用专用密码"
            >
            <small class="form-help">
              对于 Gmail、QQ 等邮箱，可能需要使用应用专用密码而非登录密码
            </small>
          </div>

          <div class="connection-test" v-if="selectedProvider">
            <h4>连接配置</h4>
            <div class="config-info">
              <div><strong>IMAP:</strong> {{ selectedProvider.imap_server }}:{{ selectedProvider.imap_port }}</div>
              <div><strong>SMTP:</strong> {{ selectedProvider.smtp_server }}:{{ selectedProvider.smtp_port }}</div>
              <div><strong>加密:</strong> {{ selectedProvider.use_ssl ? 'SSL' : '' }} {{ selectedProvider.use_tls ? 'TLS' : '' }}</div>
            </div>
            
            <button 
              @click="testConnection" 
              class="btn btn-secondary"
              :disabled="testing || !canTest"
            >
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            
            <div v-if="testResult !== null" class="test-result">
              <span :class="testResult ? 'success' : 'error'">
                {{ testResult ? '✅ 连接成功' : '❌ 连接失败' }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showAddModal = false" class="btn btn-secondary">取消</button>
          <button 
            @click="addAccount" 
            class="btn btn-primary"
            :disabled="!canAddAccount"
          >
            添加账户
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/core'

export default {
  name: 'AccountManager',
  data() {
    return {
      accounts: [],
      providers: [],
      showAddModal: false,
      syncing: null,
      testing: false,
      testResult: null,
      
      newAccount: {
        provider_id: '',
        email_address: '',
        display_name: '',
        username: '',
        password: ''
      }
    }
  },
  
  computed: {
    selectedProvider() {
      return this.providers.find(p => p.id === this.newAccount.provider_id)
    },
    
    canTest() {
      return this.newAccount.provider_id && 
             this.newAccount.username && 
             this.newAccount.password
    },
    
    canAddAccount() {
      return this.newAccount.provider_id && 
             this.newAccount.email_address && 
             this.newAccount.display_name && 
             this.newAccount.username && 
             this.newAccount.password
    }
  },
  
  async mounted() {
    await this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.loadProviders(),
          this.loadAccounts()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
        alert('加载数据失败: ' + error)
      }
    },
    
    async loadProviders() {
      this.providers = await invoke('get_email_providers')
    },
    
    async loadAccounts() {
      this.accounts = await invoke('get_email_accounts')
    },
    
    getProviderName(providerId) {
      const provider = this.providers.find(p => p.id === providerId)
      return provider ? provider.name : '未知'
    },
    
    onProviderChange() {
      // 自动填充用户名
      if (this.newAccount.email_address) {
        this.newAccount.username = this.newAccount.email_address
      }
      this.testResult = null
    },
    
    async testConnection() {
      if (!this.canTest) return
      
      this.testing = true
      this.testResult = null
      
      try {
        this.testResult = await invoke('test_email_connection', {
          providerId: this.newAccount.provider_id,
          username: this.newAccount.username,
          password: this.newAccount.password
        })
      } catch (error) {
        console.error('测试连接失败:', error)
        this.testResult = false
      } finally {
        this.testing = false
      }
    },
    
    async addAccount() {
      if (!this.canAddAccount) return
      
      try {
        await invoke('add_email_account', {
          providerId: this.newAccount.provider_id,
          emailAddress: this.newAccount.email_address,
          displayName: this.newAccount.display_name,
          username: this.newAccount.username,
          password: this.newAccount.password
        })
        
        // 重置表单
        this.newAccount = {
          provider_id: '',
          email_address: '',
          display_name: '',
          username: '',
          password: ''
        }
        this.testResult = null
        this.showAddModal = false
        
        await this.loadAccounts()
        alert('账户添加成功！')
      } catch (error) {
        console.error('添加账户失败:', error)
        alert('添加账户失败: ' + error)
      }
    },
    
    async syncAccount(accountId) {
      this.syncing = accountId
      
      try {
        const emails = await invoke('sync_account_emails', { accountId })
        
        // 通知父组件有新邮件
        this.$emit('emails-synced', emails)
        
        await this.loadAccounts() // 更新同步时间
        alert(`同步完成！获取到 ${emails.length} 封邮件`)
      } catch (error) {
        console.error('同步失败:', error)
        alert('同步失败: ' + error)
      } finally {
        this.syncing = null
      }
    },
    
    async toggleAccount(accountId) {
      try {
        await invoke('toggle_account_status', { accountId })
        await this.loadAccounts()
      } catch (error) {
        console.error('切换账户状态失败:', error)
        alert('操作失败: ' + error)
      }
    },
    
    async deleteAccount(accountId) {
      if (!confirm('确定要删除这个邮件账户吗？这将不会删除已同步的邮件。')) return
      
      try {
        await invoke('delete_email_account', { accountId })
        await this.loadAccounts()
        alert('账户已删除')
      } catch (error) {
        console.error('删除账户失败:', error)
        alert('删除失败: ' + error)
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '从未同步'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.account-manager {
  padding: 20px;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.account-item.inactive {
  opacity: 0.6;
  background: #f8f9fa;
}

.account-info {
  flex: 1;
}

.account-email {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.account-name {
  color: #666;
  margin: 5px 0;
}

.account-provider {
  color: #007bff;
  font-size: 14px;
}

.account-sync {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

.account-actions {
  display: flex;
  gap: 10px;
}

.modal-content.large {
  max-width: 600px;
  width: 90%;
}

.connection-test {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
}

.config-info {
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}

.config-info div {
  margin: 5px 0;
}

.test-result {
  margin-top: 10px;
}

.test-result .success {
  color: #28a745;
}

.test-result .error {
  color: #dc3545;
}

.form-help {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>