import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  PROVIDERS, clampReasoning, createAdapter,
  type ProviderAdapter, type ProviderKind, type ProviderSettings, type ReasoningLevel
} from '../core/providers'

// 因果矩阵（模型连接）配置。文件名沿用旧名以保持引用不变。
export interface LLMSettings {
  provider: ProviderKind
  endpoint: string
  apiKey: string
  selectedModel: string
  temperature: number
  reasoning: ReasoningLevel
}

const STORAGE_KEY = 'openai-settings'

const DEFAULTS: LLMSettings = {
  provider: 'openai-responses',
  endpoint: '',
  apiKey: '',
  selectedModel: '',
  temperature: 0.7,
  reasoning: 'medium'
}

// 兼容旧版保存的 { openaiEndpoint, apiKey, selectedModel, temperature, topP, topK }
function migrate(raw: Record<string, unknown>): Partial<LLMSettings> {
  const out: Partial<LLMSettings> = {}
  const provider = raw.provider as ProviderKind | undefined
  out.provider = provider && provider in PROVIDERS ? provider : (raw.openaiEndpoint ? 'openai-chat' : DEFAULTS.provider)
  const endpoint = (raw.endpoint ?? raw.openaiEndpoint) as string | undefined
  if (typeof endpoint === 'string') out.endpoint = endpoint
  if (typeof raw.apiKey === 'string') out.apiKey = raw.apiKey
  if (typeof raw.selectedModel === 'string') out.selectedModel = raw.selectedModel
  const t = Number(raw.temperature)
  if (Number.isFinite(t)) out.temperature = t
  const r = raw.reasoning as ReasoningLevel | undefined
  if (r) out.reasoning = clampReasoning(out.provider, r)
  return out
}

export const useOpenAIStore = defineStore('openAI', () => {
  const settings = reactive<LLMSettings>({ ...DEFAULTS })
  const isConnected = ref(false)
  const lastTestResult = ref<{ success: boolean; message: string } | null>(null)
  let connectionKey = ''
  let testing: Promise<{ success: boolean; message: string }> | null = null

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) Object.assign(settings, migrate(JSON.parse(saved)))
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

  const providerSettings = (): ProviderSettings => ({
    provider: settings.provider,
    endpoint: settings.endpoint,
    apiKey: settings.apiKey,
    model: settings.selectedModel,
    temperature: Number(settings.temperature) || 0,
    reasoning: settings.reasoning
  })

  // 协议、端点或密钥变化后需要重新测试连接
  const currentKey = () => `${settings.provider}\n${settings.endpoint}\n${settings.apiKey}`
  const invalidateIfChanged = (): boolean => {
    const key = currentKey()
    if (key === connectionKey) return false
    connectionKey = key
    isConnected.value = false
    return true
  }

  const createClientAdapter = (): ProviderAdapter | null => (settings.apiKey ? createAdapter(providerSettings()) : null)

  const listModels = async (): Promise<string[]> => {
    const adapter = createClientAdapter()
    if (!adapter) throw new Error('请先填写 API Key')
    return adapter.listModels()
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (testing) return testing
    invalidateIfChanged()
    if (!settings.apiKey) {
      const result = { success: false, message: '请先填写 API Key' }
      lastTestResult.value = result
      return result
    }
    const key = currentKey()
    testing = (async () => {
      try {
        const models = await listModels()
        if (key === currentKey()) isConnected.value = true
        return { success: true, message: `连接成功（${PROVIDERS[settings.provider].label}，可用模型 ${models.length} 个）` }
      } catch (error: any) {
        console.error('Connection test error:', error)
        if (key === currentKey()) isConnected.value = false
        const status = error?.status ? ` [${error.status}]` : ''
        return { success: false, message: `连接失败${status}：${String(error?.message ?? error).slice(0, 120)}` }
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

  // 更新设置：协议/端点/密钥变化时才重新测试连接，避免每次输入都发请求
  const updateSettings = async (patch: Partial<LLMSettings>) => {
    Object.assign(settings, patch)
    settings.reasoning = clampReasoning(settings.provider, settings.reasoning)
    saveToLocalStorage()
    if (invalidateIfChanged() && settings.apiKey) await testConnection()
  }

  // 供仿真使用的适配器（总是使用最新的模型与推理设置）
  const getAdapter = (): ProviderAdapter | null => (isConfigured() ? createAdapter(providerSettings()) : null)

  const isConfigured = (): boolean => !!(settings.apiKey && settings.selectedModel)

  const resetSettings = () => {
    Object.assign(settings, DEFAULTS)
    isConnected.value = false
    lastTestResult.value = null
    connectionKey = ''
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* 忽略 */ }
  }

  loadFromLocalStorage()
  connectionKey = currentKey()
  if (settings.apiKey) void testConnection()

  return {
    settings,
    isConnected,
    lastTestResult,
    updateSettings,
    testConnection,
    listModels,
    getAdapter,
    isConfigured,
    resetSettings,
    loadFromLocalStorage,
    saveToLocalStorage
  }
})
