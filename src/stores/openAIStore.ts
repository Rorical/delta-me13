import { defineStore } from 'pinia'
import { ref, reactive, markRaw } from 'vue'
import OpenAI from 'openai'

export interface OpenAISettings {
  openaiEndpoint: string
  apiKey: string
  selectedModel: string
  temperature: number
  topP: number
  topK: number
}

const STORAGE_KEY = 'openai-settings'

const DEFAULTS: OpenAISettings = {
  openaiEndpoint: '',
  apiKey: '',
  selectedModel: '',
  temperature: 0.7,
  topP: 0.9,
  topK: 50
}

export const useOpenAIStore = defineStore('openAI', () => {
  const settings = reactive<OpenAISettings>({ ...DEFAULTS })
  const isConnected = ref(false)
  const lastTestResult = ref<{ success: boolean; message: string } | null>(null)
  // 客户端不需要响应式
  let client: OpenAI | null = null
  let clientKey = ''
  let testing: Promise<{ success: boolean; message: string }> | null = null

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) Object.assign(settings, JSON.parse(saved))
    } catch {
      // 损坏的配置直接忽略
    }
  }

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 隐私模式等情况下无法写入
    }
  }

  // 仅在端点或密钥变化时重建客户端
  const rebuildClient = (): boolean => {
    const key = `${settings.openaiEndpoint}\n${settings.apiKey}`
    if (key === clientKey && client) return false
    clientKey = key
    client = settings.openaiEndpoint && settings.apiKey
      ? markRaw(new OpenAI({ apiKey: settings.apiKey, baseURL: settings.openaiEndpoint, dangerouslyAllowBrowser: true }))
      : null
    isConnected.value = false
    return true
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (testing) return testing
    rebuildClient()
    if (!client) {
      const result = { success: false, message: '配置不完整，无法测试连接' }
      lastTestResult.value = result
      return result
    }
    const current = client
    testing = (async () => {
      try {
        await current.models.list()
        isConnected.value = true
        return { success: true, message: '连接测试成功！API密钥和端点配置正确。' }
      } catch (error) {
        console.error('Connection test error:', error)
        isConnected.value = false
        return { success: false, message: '连接测试失败，请检查API密钥和端点配置。' }
      }
    })()
    try {
      const result = await testing
      lastTestResult.value = result
      return result
    } finally {
      testing = null
    }
  }

  // 更新设置：端点/密钥变化时才重新测试连接，避免每次输入都发请求
  const updateSettings = async (newSettings: Partial<OpenAISettings>) => {
    Object.assign(settings, newSettings)
    saveToLocalStorage()
    if (rebuildClient() && client) await testConnection()
  }

  const getClient = (): OpenAI | null => {
    rebuildClient()
    return client
  }

  const isConfigured = (): boolean => !!(settings.openaiEndpoint && settings.apiKey && settings.selectedModel)

  const resetSettings = () => {
    Object.assign(settings, DEFAULTS)
    isConnected.value = false
    lastTestResult.value = null
    client = null
    clientKey = ''
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* 忽略 */ }
  }

  loadFromLocalStorage()
  if (settings.openaiEndpoint && settings.apiKey) void testConnection()

  return {
    settings,
    isConnected,
    lastTestResult,
    updateSettings,
    testConnection,
    getClient,
    isConfigured,
    resetSettings,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})
