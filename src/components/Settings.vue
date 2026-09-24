<template>
  <div class="llm-settings om-root">
    <!-- 协议 -->
    <section class="om-panel">
      <div class="om-panel-header">
        <Network :size="16" /> 调用协议 <div class="om-line"></div>
        <span class="om-tag" :class="{ strong: store.isConnected }">
          <span class="om-dot" :class="{ live: store.isConnected }"></span>{{ store.isConnected ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="providers">
        <button v-for="(info, kind) in PROVIDERS" :key="kind" class="om-item provider" :class="{ active: form.provider === kind }"
          @click="selectProvider(kind)">
          <b>{{ info.label }}</b>
          <small>{{ info.description }}</small>
        </button>
      </div>
    </section>

    <!-- 连接 -->
    <section class="om-panel">
      <div class="om-panel-header"><KeyRound :size="16" /> 连接 <div class="om-line"></div></div>
      <label class="field">
        <span>API 端点</span>
        <input v-model.trim="form.endpoint" class="om-input" :placeholder="`${info.defaultEndpoint}（留空使用官方地址）`" />
      </label>
      <label class="field">
        <span>API Key</span>
        <input v-model.trim="form.apiKey" class="om-input" type="password" autocomplete="off" :placeholder="info.keyPlaceholder" />
      </label>
      <p class="om-muted note">
        <Info :size="12" /> 密钥仅保存在本机浏览器，请求由浏览器直接发往端点；端点需允许跨域访问（CORS）。
      </p>
    </section>

    <!-- 模型 -->
    <section class="om-panel">
      <div class="om-panel-header">
        <Cpu :size="16" /> 模型 <div class="om-line"></div>
        <button class="om-btn" :disabled="!form.apiKey || loadingModels" @click="fetchModels">
          <RefreshCw :size="13" :class="{ spin: loadingModels }" /> 获取模型列表
        </button>
      </div>
      <label class="field">
        <span>模型 ID</span>
        <input v-model.trim="form.selectedModel" class="om-input" list="llm-model-options" placeholder="输入或从下方选择" />
        <datalist id="llm-model-options">
          <option v-for="m in modelOptions" :key="m" :value="m" />
        </datalist>
      </label>
      <div class="chips">
        <button v-for="m in visibleModels" :key="m" class="om-chip" :class="{ active: form.selectedModel === m }" @click="pickModel(m)">{{ m }}</button>
      </div>
      <p v-if="fetchedModels.length > visibleModels.length" class="om-muted note">共 {{ fetchedModels.length }} 个模型，输入关键字筛选。</p>
    </section>

    <!-- 思考与采样 -->
    <section class="om-panel">
      <div class="om-panel-header"><Brain :size="16" /> 思考强度 <div class="om-line"></div></div>
      <div class="chips">
        <button v-for="lvl in info.reasoningLevels" :key="lvl" class="om-chip" :class="{ active: form.reasoning === lvl }" @click="form.reasoning = lvl">
          {{ REASONING_LABEL[lvl] }}
        </button>
      </div>
      <p class="om-muted note">{{ reasoningNote }}</p>
      <label class="field slider" :class="{ dim: !temperatureUsed }">
        <span>Temperature</span>
        <input v-model.number="form.temperature" type="range" min="0" max="2" step="0.1" />
        <b>{{ form.temperature.toFixed(1) }}</b>
      </label>
      <p class="om-muted note">{{ temperatureUsed ? '控制输出的随机性。' : '当前协议/模型/思考设置下不使用 temperature。' }}</p>
    </section>

    <!-- 测试 -->
    <section class="om-panel">
      <div class="om-panel-header"><Zap :size="16" /> 连接测试 <div class="om-line"></div></div>
      <div class="test-row">
        <button class="om-btn primary" :disabled="!form.apiKey || testing" @click="test">
          <Zap :size="14" /> {{ testing ? '测试中…' : '测试连接' }}
        </button>
        <span v-if="store.lastTestResult" class="result" :class="{ ok: store.lastTestResult.success }">
          <Check v-if="store.lastTestResult.success" :size="14" /><X v-else :size="14" />
          {{ store.lastTestResult.message }}
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { Brain, Check, Cpu, Info, KeyRound, Network, RefreshCw, X, Zap } from 'lucide-vue-next'
import { useOpenAIStore, type LLMSettings } from '../stores/openAIStore'
import { notificationService } from '../services/notificationService'
import { PROVIDERS, REASONING_LABEL, clampReasoning, type ProviderKind } from '../core/providers'
import './sim/sim.css'

const store = useOpenAIStore()
const form = reactive<LLMSettings>({ ...store.settings })
const info = computed(() => PROVIDERS[form.provider])

const fetchedModels = ref<string[]>([])
const loadingModels = ref(false)
const testing = ref(false)

const modelOptions = computed(() => [...new Set([...info.value.suggestedModels, ...fetchedModels.value])])
const visibleModels = computed(() => {
  const q = form.selectedModel.toLowerCase()
  const list = fetchedModels.value.length ? fetchedModels.value : info.value.suggestedModels
  const filtered = q && !list.includes(form.selectedModel) ? list.filter(m => m.toLowerCase().includes(q)) : list
  return filtered.slice(0, 24)
})

const isAdaptiveClaude = computed(() => /claude-(opus|sonnet|fable|mythos)-(4-[678]|5)/i.test(form.selectedModel))
const isOpenAIReasoning = computed(() => /(^|\/)(o\d|gpt-5|codex)/i.test(form.selectedModel))

const temperatureUsed = computed(() => {
  switch (form.provider) {
    case 'anthropic': return !isAdaptiveClaude.value && form.reasoning === 'off'
    case 'deepseek': return form.reasoning === 'off'
    default: return !isOpenAIReasoning.value
  }
})

const reasoningNote = computed(() => {
  switch (form.provider) {
    case 'anthropic':
      return isAdaptiveClaude.value
        ? '新一代 Claude 使用自适应思考，档位对应 effort；「关闭」以最低 effort 运行（部分型号无法完全关闭思考）。'
        : '旧款 Claude 以思考预算（budget_tokens）运行；「关闭」则不思考。'
    case 'deepseek':
      return 'DeepSeek V4 思考模式：「高」「极高」对应 reasoning_effort high / max；「关闭」使用非思考模式。'
    case 'openai-responses':
      return isOpenAIReasoning.value ? '推理模型的 reasoning effort，并返回推理摘要。' : '当前模型不是推理模型，思考强度不生效。'
    default:
      return isOpenAIReasoning.value ? '以 reasoning_effort 传给推理模型；兼容端点若返回 reasoning_content 也会被记录。' : '当前模型不是推理模型，思考强度不生效。'
  }
})

const selectProvider = (kind: ProviderKind) => {
  if (form.provider === kind) return
  const wasDefault = !form.endpoint || form.endpoint === PROVIDERS[form.provider].defaultEndpoint
  form.provider = kind
  if (wasDefault) form.endpoint = ''
  form.reasoning = clampReasoning(kind, form.reasoning)
  fetchedModels.value = []
  if (!form.selectedModel || !modelOptions.value.includes(form.selectedModel)) form.selectedModel = PROVIDERS[kind].suggestedModels[0]
}

const pickModel = (m: string) => {
  form.selectedModel = m
}

// 输入时防抖保存；协议/端点/密钥变化时 store 会自动重新测试连接
let timer: ReturnType<typeof setTimeout> | null = null
watch(form, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void store.updateSettings({ ...form })
  }, 600)
})
onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
    void store.updateSettings({ ...form })
  }
})

const fetchModels = async () => {
  loadingModels.value = true
  try {
    await store.updateSettings({ ...form })
    fetchedModels.value = await store.listModels()
    notificationService.showModelLoaded(fetchedModels.value.length)
  } catch (error: any) {
    notificationService.showConnectionError(`无法获取模型列表：${String(error?.message ?? error).slice(0, 100)}`)
  } finally {
    loadingModels.value = false
  }
}

const test = async () => {
  testing.value = true
  notificationService.showTestStarted()
  try {
    await store.updateSettings({ ...form })
    const result = await store.testConnection()
    if (result.success) notificationService.showConnectionSuccess()
    else notificationService.showConnectionError(result.message)
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.llm-settings { display: flex; flex-direction: column; gap: 12px; font-size: 14px; }
.providers { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
.provider { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; }
.provider b { font-size: 15px; }
.provider small { font-size: 12px; line-height: 1.5; color: var(--om-muted); }
.field { display: grid; grid-template-columns: 90px 1fr; align-items: center; gap: 10px; margin-bottom: 10px; }
.field span { color: var(--om-muted); font-size: 13px; }
.field .om-input { width: 100%; box-sizing: border-box; font-size: 14px; padding: 7px 10px; }
.field.slider { grid-template-columns: 90px 1fr 40px; margin: 12px 0 0; }
.field.slider input { accent-color: rgba(173, 216, 230, 0.9); }
.field.slider b { font-weight: normal; text-align: right; }
.field.dim { opacity: 0.45; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.note { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; font-size: 12px; line-height: 1.6; }
.test-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.result { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--om-muted); }
.result.ok { color: var(--om-text); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 600px) { .field { grid-template-columns: 1fr; gap: 4px; } }
</style>
