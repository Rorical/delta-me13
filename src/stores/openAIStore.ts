import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import OpenAI from 'openai';

export interface OpenAISettings {
  openaiEndpoint: string
  apiKey: string
  selectedModel: string
  temperature: number
  topP: number
  topK: number
}

export interface OpenAIInstance {
  settings: OpenAISettings
  isConnected: boolean
  lastTestResult: { success: boolean; message: string } | null
  client: OpenAI | null
}

export const useOpenAIStore = defineStore('openAI', () => {
  // State
  const settings = reactive<OpenAISettings>({
    openaiEndpoint: '',
    apiKey: '',
    selectedModel: '',
    temperature: 0.7,
    topP: 0.9,
    topK: 50
  })

  const isConnected = ref(false)
  const lastTestResult = ref<{ success: boolean; message: string } | null>(null)
  const openAIInstance = ref<OpenAIInstance | null>(null)

  // Actions
  const updateSettings = async (newSettings: Partial<OpenAISettings>) => {
    Object.assign(settings, newSettings)
    saveToLocalStorage()
    await initializeOpenAIInstance()
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('openai-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('openai-settings', JSON.stringify(settings))
  }

  const initializeOpenAIInstance = async () => {
    console.log('Initializing OpenAI instance...')
    console.log(settings)
    if (settings.openaiEndpoint && settings.apiKey && settings.selectedModel) {
      try {
        const client = new OpenAI({
          apiKey: settings.apiKey,
          baseURL: settings.openaiEndpoint,
          dangerouslyAllowBrowser: true
        })
        
        openAIInstance.value = {
          settings: { ...settings },
          isConnected: isConnected.value,
          lastTestResult: lastTestResult.value,
          client
        }

        // Try to auto-connect if not already connected
        if (!isConnected.value) {
          try {
            const result = await testConnection()
            console.log('Auto-connection result:', result.success ? 'Success' : 'Failed')
          } catch (error) {
            console.log('Auto-connection failed silently:', error)
          }
        }
      } catch (error) {
        console.error('Failed to initialize OpenAI instance:', error)
        openAIInstance.value = null
      }
    } else {
      openAIInstance.value = null
    }
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.openaiEndpoint || !settings.apiKey) {
      const result = { success: false, message: '配置不完整，无法测试连接' }
      lastTestResult.value = result
      return result
    }

    try {
      // Test connection using OpenAI client
      const client = new OpenAI({
        apiKey: settings.apiKey,
        baseURL: settings.openaiEndpoint,
        dangerouslyAllowBrowser: true
      })
      
      await client.models.list()
      
      const result = { success: true, message: '连接测试成功！API密钥和端点配置正确。' }
      isConnected.value = true
      lastTestResult.value = result
      initializeOpenAIInstance()
      return result
    } catch (error) {
      console.error('Connection test error:', error)
      const result = { success: false, message: '连接测试失败，请检查API密钥和端点配置。' }
      isConnected.value = false
      lastTestResult.value = result
      initializeOpenAIInstance()
      return result
    }
  }

  const getOpenAIInstance = (): any => {
    return openAIInstance.value
  }

  const getClient = (): any => {
    return openAIInstance.value?.client || null
  }

  const isConfigured = (): boolean => {
    return !!(settings.openaiEndpoint && settings.apiKey && settings.selectedModel)
  }

  const resetSettings = () => {
    Object.assign(settings, {
      openaiEndpoint: '',
      apiKey: '',
      selectedModel: '',
      temperature: 0.7,
      topP: 0.9,
      topK: 50
    })
    isConnected.value = false
    lastTestResult.value = null
    openAIInstance.value = null
    localStorage.removeItem('openai-settings')
  }

  // Initialize
  loadFromLocalStorage()
  initializeOpenAIInstance() // Don't await here as we're in store initialization

  return {
    // State
    settings,
    isConnected,
    lastTestResult,
    openAIInstance,
    
    // Actions
    updateSettings,
    testConnection,
    getOpenAIInstance,
    getClient,
    isConfigured,
    resetSettings,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})

// Legacy export for backward compatibility
export const useLangChainStore = useOpenAIStore 