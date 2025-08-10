<template>
  <div class="category-manager">
    <div class="category-header">
      <h3>📂 邮件分类管理</h3>
      <button @click="showAddModal = true" class="btn btn-sm btn-primary">
        添加分类
      </button>
    </div>

    <!-- 分类列表 -->
    <div class="category-list">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="category-item"
        :class="{ system: category.is_system }"
      >
        <div class="category-info">
          <div class="category-color" :style="{ backgroundColor: category.color }"></div>
          <div class="category-details">
            <div class="category-name">{{ category.name }}</div>
            <div class="category-description">{{ category.description || '无描述' }}</div>
          </div>
        </div>
        <div class="category-actions" v-if="!category.is_system">
          <button 
            @click="editCategory(category)" 
            class="btn btn-xs btn-secondary"
          >
            编辑
          </button>
          <button 
            @click="deleteCategory(category.id)" 
            class="btn btn-xs btn-danger"
          >
            删除
          </button>
        </div>
        <div class="system-badge" v-else>
          系统分类
        </div>
      </div>
    </div>

    <!-- 添加/编辑分类模态框 -->
    <div v-if="showAddModal || editingCategory" class="modal-overlay" @click="closeModal">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h4>{{ editingCategory ? '编辑分类' : '添加分类' }}</h4>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>分类名称:</label>
            <input 
              v-model="categoryForm.name" 
              type="text" 
              required 
              class="form-input"
              placeholder="工作、学习、生活等"
            >
          </div>

          <div class="form-group">
            <label>颜色:</label>
            <div class="color-picker">
              <input 
                v-model="categoryForm.color" 
                type="color" 
                class="color-input"
              >
              <span class="color-preview" :style="{ backgroundColor: categoryForm.color }">
                {{ categoryForm.color }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>描述 (可选):</label>
            <textarea 
              v-model="categoryForm.description" 
              class="form-textarea"
              rows="3"
              placeholder="分类的用途说明"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">取消</button>
          <button 
            @click="saveCategory" 
            class="btn btn-primary"
            :disabled="!categoryForm.name.trim()"
          >
            {{ editingCategory ? '更新' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/core'

export default {
  name: 'CategoryManager',
  data() {
    return {
      categories: [],
      showAddModal: false,
      editingCategory: null,
      categoryForm: {
        name: '',
        color: '#007bff',
        description: ''
      }
    }
  },
  
  async mounted() {
    await this.loadCategories()
  },
  
  methods: {
    async loadCategories() {
      try {
        this.categories = await invoke('get_email_categories')
      } catch (error) {
        console.error('加载分类失败:', error)
        alert('加载分类失败: ' + error)
      }
    },
    
    editCategory(category) {
      this.editingCategory = category
      this.categoryForm = {
        name: category.name,
        color: category.color,
        description: category.description || ''
      }
    },
    
    closeModal() {
      this.showAddModal = false
      this.editingCategory = null
      this.categoryForm = {
        name: '',
        color: '#007bff',
        description: ''
      }
    },
    
    async saveCategory() {
      if (!this.categoryForm.name.trim()) return
      
      try {
        if (this.editingCategory) {
          // 编辑功能暂未实现
          alert('编辑功能暂未实现')
        } else {
          await invoke('add_email_category', {
            name: this.categoryForm.name.trim(),
            color: this.categoryForm.color,
            description: this.categoryForm.description.trim() || null
          })
          
          await this.loadCategories()
          this.closeModal()
          this.$emit('categories-updated')
          alert('分类添加成功！')
        }
      } catch (error) {
        console.error('保存分类失败:', error)
        alert('保存分类失败: ' + error)
      }
    },
    
    async deleteCategory(categoryId) {
      if (!confirm('确定要删除这个分类吗？')) return
      
      try {
        await invoke('delete_email_category', { categoryId })
        await this.loadCategories()
        this.$emit('categories-updated')
        alert('分类已删除')
      } catch (error) {
        console.error('删除分类失败:', error)
        alert('删除分类失败: ' + error)
      }
    }
  }
}
</script>

<style scoped>
.category-manager {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.category-header h3 {
  margin: 0;
  color: #333;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.category-item.system {
  background: #e9ecef;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #ddd;
}

.category-details {
  flex: 1;
}

.category-name {
  font-weight: bold;
  color: #333;
}

.category-description {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.system-badge {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.modal-content.small {
  max-width: 400px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 50px;
  height: 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-preview {
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}

.btn-xs {
  padding: 2px 8px;
  font-size: 12px;
}
</style>