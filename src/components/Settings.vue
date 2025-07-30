<template>
  <div class="langchain-settings">
    <div class="settings-header">
      <h2>因果矩阵配置</h2>
      <div class="header-glow"></div>
    </div>
    
    <div class="settings-container">
      <!-- OpenAI Configuration -->
      <div class="config-section">
        <div class="section-header">
          <h3>OpenAI 连接配置</h3>
          <div class="status-indicator" :class="{ active: isConnected }">
            {{ isConnected ? '已连接' : '未连接' }}
          </div>
        </div>
        
        <div class="input-group">
          <label>API Endpoint</label>
          <div class="input-wrapper">
            <input 
              v-model="settings.openaiEndpoint" 
              type="text" 
              placeholder="https://api.openai.com/v1"
              @input="saveSettings"
            />
            <div class="input-glow"></div>
          </div>
        </div>
        
        <div class="input-group">
          <label>API Key</label>
          <div class="input-wrapper">
            <input 
              v-model="settings.apiKey" 
              type="password" 
              placeholder="sk-..."
              @input="saveSettings"
            />
            <div class="input-glow"></div>
          </div>
        </div>
      </div>

             <!-- Model Selection -->
       <div class="config-section">
         <div class="section-header">
           <h3>模型选择</h3>
           <button class="refresh-btn" @click="fetchModels" :disabled="isLoading">
             <RefreshCw :size="16" />
             刷新
           </button>
         </div>
         
         <!-- Current Selected Model Display -->
         <div class="current-model" v-if="selectedModel">
           <div class="current-model-header">
             <h4>当前选中模型</h4>
             <div class="model-badge">
               <Check :size="12" />
               已选择
             </div>
           </div>
           <div class="current-model-info">
             <div class="current-model-name">{{ selectedModel.id }}</div>
             <div class="current-model-details">
               <span class="model-type">{{ getModelType(selectedModel.id) }}</span>
               <span class="model-created">{{ formatDate(selectedModel.created) }}</span>
             </div>
           </div>
         </div>
         
         <div class="model-search">
           <div class="input-wrapper">
             <input 
               v-model="modelSearch" 
               type="text" 
               placeholder="搜索模型..."
               @input="filterModels"
             />
             <Search :size="16" class="search-icon" />
           </div>
         </div>
         
         <div class="model-list" v-if="filteredModels.length > 0">
           <div 
             v-for="model in filteredModels" 
             :key="model.id"
             class="model-item"
             :class="{ selected: selectedModel?.id === model.id }"
             @click="selectModel(model)"
           >
             <div class="model-info">
               <div class="model-name">{{ model.id }}</div>
               <div class="model-details">
                 <span class="model-type">{{ getModelType(model.id) }}</span>
                 <span class="model-created">{{ formatDate(model.created) }}</span>
               </div>
             </div>
             <div class="model-status" v-if="selectedModel?.id === model.id">
               <Check :size="16" />
             </div>
           </div>
         </div>
         
         <div class="no-models" v-else-if="!isLoading">
           <AlertCircle :size="24" />
           <span>未找到匹配的模型</span>
         </div>
       </div>

      <!-- Model Parameters -->
      <div class="config-section" v-if="selectedModel">
        <div class="section-header">
          <h3>模型参数</h3>
        </div>
        
        <div class="parameter-grid">
          <div class="parameter-item">
            <label>Temperature</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model="settings.temperature" 
                min="0" 
                max="2" 
                step="0.1"
                @input="saveSettings"
              />
              <span class="value-display">{{ settings.temperature }}</span>
            </div>
            <div class="parameter-description">
              控制输出的随机性 (0=确定性, 2=高随机性)
            </div>
          </div>
          
          <div class="parameter-item">
            <label>Top P</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model="settings.topP" 
                min="0" 
                max="1" 
                step="0.1"
                @input="saveSettings"
              />
              <span class="value-display">{{ settings.topP }}</span>
            </div>
            <div class="parameter-description">
              核采样参数 (0=确定性, 1=高多样性)
            </div>
          </div>
          
          <div class="parameter-item">
            <label>Top K</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model="settings.topK" 
                min="1" 
                max="100" 
                step="1"
                @input="saveSettings"
              />
              <span class="value-display">{{ settings.topK }}</span>
            </div>
            <div class="parameter-description">
              限制词汇选择范围 (1-100)
            </div>
          </div>
        </div>
      </div>

      <!-- Connection Test -->
      <div class="config-section">
        <div class="section-header">
          <h3>连接测试</h3>
        </div>
        
        <div class="test-controls">
          <button 
            class="test-btn" 
            @click="testConnection"
            :disabled="!canTest || isTesting"
          >
            <Zap :size="16" />
            {{ isTesting ? '测试中...' : '测试连接' }}
          </button>
          
          <div class="test-result" v-if="testResult">
            <div class="result-icon" :class="{ success: testResult.success, error: !testResult.success }">
              <Check v-if="testResult.success" :size="16" />
              <X v-else :size="16" />
            </div>
            <span class="result-message">{{ testResult.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  RefreshCw, 
  Search, 
  Check, 
  AlertCircle, 
  Zap, 
  X 
} from 'lucide-vue-next'
import { useOpenAIStore } from '../stores/openAIStore.ts'
import { notificationService } from '../services/notificationService.ts'

interface Model {
  id: string
  created: number
  object: string
}

interface Settings {
  openaiEndpoint: string
  apiKey: string
  selectedModel: string
  temperature: number
  topP: number
  topK: number
}

const openAIStore = useOpenAIStore()

// Reactive data
const settings = reactive<Settings>({
  openaiEndpoint: 'https://api.openai.com/v1',
  apiKey: '',
  selectedModel: '',
  temperature: 0.7,
  topP: 0.9,
  topK: 50
})

const modelSearch = ref('')
const models = ref<Model[]>([])
const filteredModels = ref<Model[]>([])
const selectedModel = ref<Model | null>(null)
const isLoading = ref(false)
const isTesting = ref(false)
const isConnected = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// Computed
const canTest = computed(() => {
  return settings.openaiEndpoint && settings.apiKey
})

// Methods
const loadSettings = () => {
  const saved = localStorage.getItem('openai-settings')
  if (saved) {
    const parsed = JSON.parse(saved)
    Object.assign(settings, parsed)
  }
}

const saveSettings = async () => {
  localStorage.setItem('openai-settings', JSON.stringify(settings))
  await openAIStore.updateSettings(settings)
  
  // Show more detailed notification based on what was saved
  if (settings.selectedModel) {
    notificationService.showSuccess(`配置已保存 - 模型: ${settings.selectedModel}`, '设置保存成功')
  } else {
    notificationService.showSettingsSaved()
  }
}

const filterModels = () => {
  if (!modelSearch.value) {
    filteredModels.value = models.value
  } else {
    filteredModels.value = models.value.filter(model =>
      model.id.toLowerCase().includes(modelSearch.value.toLowerCase())
    )
  }
}

const selectModel = async (model: Model) => {
  selectedModel.value = model
  settings.selectedModel = model.id
  await saveSettings()
  notificationService.showInfo(`已选择模型: ${model.id}`, '模型选择')
}

const getModelType = (modelId: string) => {
  if (modelId.includes('gpt-4')) return 'GPT-4'
  if (modelId.includes('gpt-3.5')) return 'GPT-3.5'
  if (modelId.includes('gpt-3')) return 'GPT-3'
  return 'Unknown'
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}

const fetchModels = async () => {
  if (!settings.openaiEndpoint || !settings.apiKey) {
    return
  }
  
  isLoading.value = true
  try {
    const response = await fetch(`${settings.openaiEndpoint}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      models.value = data.data || []
      filterModels()
      isConnected.value = true
      notificationService.showModelLoaded(models.value.length)
      
      // Restore selected model if exists in settings
      if (settings.selectedModel && !selectedModel.value) {
        const savedModel = models.value.find(m => m.id === settings.selectedModel)
        if (savedModel) {
          selectedModel.value = savedModel
        }
      }
    } else {
      throw new Error('Failed to fetch models')
    }
  } catch (error) {
    console.error('Error fetching models:', error)
    models.value = []
    isConnected.value = false
    notificationService.showConnectionError('无法获取模型列表，请检查配置。')
  } finally {
    isLoading.value = false
  }
}

const testConnection = async () => {
  if (!canTest.value) return
  
  isTesting.value = true
  testResult.value = null
  notificationService.showTestStarted()
  
  try {
    // Test connection by fetching models list (free API call)
    const response = await fetch(`${settings.openaiEndpoint}/models`, {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      testResult.value = {
        success: true,
        message: '连接测试成功！API密钥和端点配置正确。'
      }
      isConnected.value = true
      notificationService.showConnectionSuccess()
    } else {
      throw new Error('API request failed')
    }
  } catch (error) {
    console.error('Connection test error:', error)
    testResult.value = {
      success: false,
      message: '连接测试失败，请检查API密钥和端点配置。'
    }
    isConnected.value = false
    notificationService.showConnectionError('连接测试失败，请检查API密钥和端点配置。')
  } finally {
    isTesting.value = false
  }
}

// Initialize
onMounted(() => {
  loadSettings()
  if (settings.openaiEndpoint && settings.apiKey) {
    fetchModels()
  }
  
  // Load selected model from settings if exists
  if (settings.selectedModel) {
    // Try to find the model in the loaded models or set a placeholder
    const savedModel = models.value.find(m => m.id === settings.selectedModel)
    if (savedModel) {
      selectedModel.value = savedModel
    } else {
      // Create a placeholder model for display
      selectedModel.value = {
        id: settings.selectedModel,
        created: Date.now() / 1000,
        object: 'model'
      }
    }
  }
})
</script>

<style scoped>
.langchain-settings {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  color: rgba(173, 216, 230, 0.9);
}

.settings-header {
  position: relative;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(173, 216, 230, 0.05);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
}

.settings-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.95);
}

.header-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(173, 216, 230, 0.1), transparent);
  border-radius: 8px;
  pointer-events: none;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.config-section {
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.config-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(173, 216, 230, 0.3), transparent);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(173, 216, 230, 0.9);
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 0, 0, 0.2);
  color: rgba(255, 100, 100, 0.9);
  border: 1px solid rgba(255, 100, 100, 0.3);
}

.status-indicator.active {
  background: rgba(0, 255, 0, 0.2);
  color: rgba(100, 255, 100, 0.9);
  border-color: rgba(100, 255, 100, 0.3);
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(173, 216, 230, 0.8);
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(173, 216, 230, 0.2);
  border-radius: 6px;
  color: rgba(173, 216, 230, 0.9);
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  outline: none;
  border-color: rgba(173, 216, 230, 0.5);
  box-shadow: 0 0 10px rgba(173, 216, 230, 0.2);
}

.input-wrapper input::placeholder {
  color: rgba(173, 216, 230, 0.4);
}

.input-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  background: linear-gradient(45deg, transparent, rgba(173, 216, 230, 0.1), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.input-wrapper:focus-within .input-glow {
  opacity: 1;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(173, 216, 230, 0.1);
  border: 1px solid rgba(173, 216, 230, 0.2);
  border-radius: 6px;
  color: rgba(173, 216, 230, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(173, 216, 230, 0.2);
  border-color: rgba(173, 216, 230, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-search {
  margin-bottom: 20px;
}

.model-search .input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(173, 216, 230, 0.5);
}

/* Current Model Display */
.current-model {
  background: rgba(173, 216, 230, 0.05);
  border: 1px solid rgba(173, 216, 230, 0.2);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.current-model::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(173, 216, 230, 0.3), transparent);
}

.current-model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.current-model-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(173, 216, 230, 0.9);
}

.model-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(100, 255, 100, 0.1);
  border: 1px solid rgba(100, 255, 100, 0.3);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(100, 255, 100, 0.9);
}

.current-model-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-model-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(173, 216, 230, 0.95);
}

.current-model-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.model-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(173, 216, 230, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.model-item:hover {
  background: rgba(173, 216, 230, 0.05);
}

.model-item.selected {
  background: rgba(173, 216, 230, 0.1);
  border-left: 3px solid rgba(173, 216, 230, 0.6);
}

.model-item:last-child {
  border-bottom: none;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(173, 216, 230, 0.9);
  margin-bottom: 4px;
}

.model-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: rgba(173, 216, 230, 0.6);
}

.model-status {
  color: rgba(173, 216, 230, 0.8);
}

.no-models {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: rgba(173, 216, 230, 0.5);
  font-size: 14px;
}

.parameter-grid {
  display: grid;
  gap: 20px;
}

.parameter-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 6px;
  padding: 16px;
}

.parameter-item label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(173, 216, 230, 0.8);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.slider-container input[type="range"] {
  flex: 1;
  height: 4px;
  background: rgba(173, 216, 230, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider-container input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: rgba(173, 216, 230, 0.8);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(173, 216, 230, 0.4);
}

.value-display {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: rgba(173, 216, 230, 0.9);
}

.parameter-description {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.5);
  line-height: 1.4;
}

.test-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.test-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(173, 216, 230, 0.1);
  border: 1px solid rgba(173, 216, 230, 0.2);
  border-radius: 6px;
  color: rgba(173, 216, 230, 0.9);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-btn:hover:not(:disabled) {
  background: rgba(173, 216, 230, 0.2);
  border-color: rgba(173, 216, 230, 0.4);
  box-shadow: 0 0 10px rgba(173, 216, 230, 0.2);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.test-result.success {
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(100, 255, 100, 0.3);
  color: rgba(100, 255, 100, 0.9);
}

.test-result.error {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  color: rgba(255, 100, 100, 0.9);
}

.result-icon {
  display: flex;
  align-items: center;
}

/* Custom scrollbar */
.langchain-settings::-webkit-scrollbar,
.model-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.langchain-settings::-webkit-scrollbar-track,
.model-list::-webkit-scrollbar-track {
  background: rgba(173, 216, 230, 0.05);
  border-radius: 4px;
}

.langchain-settings::-webkit-scrollbar-thumb,
.model-list::-webkit-scrollbar-thumb {
  background: rgba(173, 216, 230, 0.3);
  border-radius: 4px;
}

.langchain-settings::-webkit-scrollbar-thumb:hover,
.model-list::-webkit-scrollbar-thumb:hover {
  background: rgba(173, 216, 230, 0.5);
}

.langchain-settings,
.model-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 216, 230, 0.3) rgba(173, 216, 230, 0.05);
}
</style> 