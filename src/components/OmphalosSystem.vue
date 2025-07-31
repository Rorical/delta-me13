<template>
  <div class="omphalos-system">
    <!-- Header Section -->
    <div class="system-header">
      <h1>翁法罗斯</h1>
      <div class="header-subtitle">Omphalos Simulation</div>
    </div>

    <!-- Dashboard Container -->
    <div class="dashboard-container">
      
      <!-- System Control Panel -->
      <div class="metric-card control-panel">
        <div class="card-header">
          <h3>系统控制面板</h3>
          <div class="card-glow"></div>
        </div>
        <div class="control-content">
      <div class="connection-status">
            <div class="status-indicator" :class="{ connected: openAIStore.isConnected }"></div>
            <div class="status-info">
              <div class="status-title">
                {{ openAIStore.isConnected ? '因果矩阵 已连接' : '因果矩阵 连接必要' }}
              </div>
              <div class="status-subtitle">
                {{ openAIStore.isConnected ? '准备运行仿真' : '请配置因果矩阵以运行仿真' }}
              </div>
            </div>
          </div>
          
          <div class="control-buttons">
            <button class="btn-primary" @click="startSimulation" :disabled="isRunning">
              {{ isRunning ? '仿真运行中...' : '启动仿真' }}
            </button>
            <button class="btn-secondary" @click="resetSimulation" :disabled="isRunning">
              重置系统
            </button>
          </div>
        </div>
      </div>
      
      <!-- World Status -->
      <div class="metric-card world-status">
        <div class="card-header">
          <h3>世界状态</h3>
          <div class="card-glow"></div>
        </div>
        <div class="world-metrics">
          <div class="metric-item">
            <div class="metric-label">当前天数</div>
            <div class="metric-value">{{ worldState?.day ?? 0 }}</div>
            <div class="metric-unit">日</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">当前纪元</div>
            <div class="metric-value">{{ worldState?.era ?? 1 }}</div>
            <div class="metric-unit">代</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">活跃代理</div>
            <div class="metric-value">{{ agentCount }}</div>
            <div class="metric-unit">个</div>
          </div>
        </div>
    </div>

      <!-- Event Logs - Right Side Panel -->
      <div class="metric-card logs-panel logs-right-panel" :class="{ 'logs-fullscreen': isLogsFullscreen }">
        <div class="card-header">
          <h3>事件日志</h3>
          <div class="logs-controls">
            <select v-model="logImportanceFilter" class="logs-filter">
              <option value="all">全部日志</option>
              <option value="medium+">重要日志</option>
              <option value="high+">高重要度</option>
            </select>
            <button class="logs-control-btn" @click="toggleLogsFullscreen" :title="isLogsFullscreen ? '退出全屏' : '全屏观看'">
              <span v-if="!isLogsFullscreen">⛶</span>
              <span v-else>x</span>
            </button>
          </div>
          <div class="card-glow"></div>
        </div>
        <div class="logs-container" ref="logsContainer">
          <div v-if="filteredLogs.length === 0" class="empty-state">
            <em>{{ logs.length === 0 ? '暂无事件记录，启动仿真查看活动日志' : '当前过滤条件下暂无日志' }}</em>
          </div>
          <div v-for="(log, index) in filteredLogs" :key="index" class="log-entry">
            <div class="log-day">[第 {{ log?.day ?? 0 }} 天]</div>
            <div class="log-message">{{ log?.message || '未知事件' }}</div>
            <div v-if="log?.importance" class="log-importance" :class="log.importance">
              {{ log.importance.toUpperCase() }}
            </div>
          </div>
        </div>
        <div v-if="isLogsFullscreen" class="logs-stats">
          <span>总事件数: {{ logs.length }}</span>
          <span v-if="logs.length > 0">最新: 第{{ logs[logs.length - 1]?.day ?? 0 }}天</span>
        </div>
      </div>
    
      <!-- Cities Information -->
      <div class="metric-card cities-panel grid-span-full">
        <div class="card-header">
          <h3>城邦状况</h3>
          <div class="card-glow"></div>
        </div>
        <div class="cities-grid">
          <div v-if="Object.keys(worldState?.cityStates || {}).length === 0" class="empty-state">
            <em>暂无城邦数据</em>
          </div>
          <div v-for="(city, id) in (worldState?.cityStates || {})" :key="id" class="city-card">
            <div class="city-header">
              <strong>{{ city?.name || '未知城市' }}</strong>
              <span class="city-type">{{ city?.type || '未知类型' }}</span>
            </div>
            <div class="city-stats">
              <div class="city-stat-item">
                <span class="stat-label">人口</span>
                <span class="stat-value">{{ (city?.population || 0).toLocaleString() }}</span>
              </div>
              <div class="city-stat-item">
                <span class="stat-label">繁荣度</span>
                <span class="stat-value">{{ city?.prosperity || 0 }}%</span>
              </div>
              <div class="city-stat-item">
                <span class="stat-label">城墙</span>
                <span class="stat-value">{{ city?.defenses?.walls || 0 }}</span>
              </div>
              <div class="city-stat-item">
                <span class="stat-label">守望塔</span>
                <span class="stat-value">{{ city?.defenses?.watchtowers || 0 }}</span>
              </div>
            </div>
            <div class="city-resources">
              <div class="resources-title">资源储备</div>
              <div class="resources-list">
                <span v-for="(amount, resource) in (city?.resources || {})" :key="resource" class="resource-item">
            {{ resource }}: {{ amount }} 
          </span>
              </div>
            </div>
          </div>
        </div>
        </div>

      <!-- Corruption Monitor -->
      <div class="metric-card corruption-monitor">
        <div class="card-header">
          <h3>黑潮监控</h3>
          <div class="card-glow"></div>
        </div>
        <div class="corruption-list">
          <div v-if="Object.keys(worldState?.darkTide?.corruptedAreas || {}).length === 0" class="empty-state">
            <em>暂无黑潮区域</em>
          </div>
          <div v-for="(level, area) in (worldState?.darkTide?.corruptedAreas || {})" :key="area" class="corruption-item">
            <div class="corruption-info">
              <span class="corruption-area">{{ area }}</span>
              <span class="corruption-level">{{ (level?.corruptionLevel || 0).toFixed(1) }}%</span>
            </div>
            <div class="corruption-bar">
              <div class="corruption-fill" :style="{ width: (level?.corruptionLevel || 0) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Logs -->
      <div class="metric-card logs-panel">
        <div class="card-header">
          <h3>对话记录</h3>
          <div class="card-glow"></div>
        </div>
        <div class="logs-container" ref="chatLogsContainer">
          <div v-if="chatLogs.length === 0" class="empty-state">
            <em>暂无对话记录</em>
          </div>
          <div v-for="(log, index) in chatLogs" :key="index" class="log-entry">
            <div class="log-day">[第 {{ log?.day ?? 0 }} 天]</div>
            <div class="log-message">{{ log?.message || '未知事件' }}</div>
          </div>
        </div>
      </div>

      <!-- AI Call Logs -->
      <div class="metric-card logs-panel ai-logs-panel">
        <div class="card-header">
          <h3>AI调用日志</h3>
          <div class="ai-logs-controls">
            <button class="logs-control-btn" @click="toggleAILogsDetails" :title="showAILogsDetails ? '隐藏详情' : '显示详情'">
              <span v-if="!showAILogsDetails">📊</span>
              <span v-else>📋</span>
            </button>
          </div>
          <div class="card-glow"></div>
        </div>
        <div class="logs-container ai-logs-container" ref="aiLogsContainer">
          <div v-if="aiLogs.length === 0" class="empty-state">
            <em>暂无AI调用记录</em>
          </div>
          <div v-for="(log, index) in aiLogs" :key="index" class="log-entry ai-log-entry" :class="{ 'detailed': showAILogsDetails }">
            <div class="log-day">[第 {{ log?.day ?? 0 }} 天]</div>
            <div class="ai-log-content">
              <div class="ai-log-main">
                <span class="ai-agent-name">{{ log?.metadata?.agentId || '未知代理' }}</span>
                <span class="ai-model-name">{{ log?.metadata?.model || 'unknown' }}</span>
                <span class="ai-duration" :class="getDurationClass(log?.metadata?.duration)">
                  {{ log?.metadata?.duration || 0 }}ms
                </span>
              </div>
              <div v-if="showAILogsDetails" class="ai-log-details">
                <div class="ai-token-usage" v-if="log?.metadata?.tokenUsage">
                  Token: {{ log?.metadata?.tokenUsage?.totalTokens || 0 }} 
                  (输入: {{ log?.metadata?.tokenUsage?.promptTokens || 0 }}, 
                   输出: {{ log?.metadata?.tokenUsage?.completionTokens || 0 }})
                </div>
                <div class="ai-prompt-preview" v-if="log?.metadata?.prompt">
                  提示: {{ log?.metadata?.prompt }}
                </div>
                <div class="ai-response-preview" v-if="log?.metadata?.response">
                  响应: {{ log?.metadata?.response }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ai-logs-stats" v-if="aiLogs.length > 0">
          <span>AI调用: {{ aiLogs.length }}</span>
          <span>平均耗时: {{ averageAIDuration }}ms</span>
          <span v-if="totalTokens > 0">总Token: {{ totalTokens }}</span>
        </div>
      </div>

      <!-- Agents Status Grid -->
      <div class="metric-card agents-panel grid-span-full">
        <div class="card-header">
          <h3>电信号状态监控</h3>
          <div class="card-glow"></div>
    </div>
      <div class="agents-grid">
          <div v-if="allAgents.length === 0" class="empty-state">
            <em>暂无电信号数据</em>
          </div>
        <div v-for="(agent, id) in allAgents" :key="id" class="agent-card">
            <div class="agent-header">
              <h4 class="agent-name">{{ agent?.name || '未知代理' }}</h4>
              <span class="agent-type" :class="agent?.type?.toLowerCase().replace(' ', '-')">
                {{ agent?.type || '未知' }}
              </span>
            </div>
            
            <div class="agent-stats">
              <div class="stat-item">
                <span class="stat-label">位置</span>
                <span class="stat-value">{{ agent?.location || '未知' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">生命值</span>
                <span class="stat-value">{{ agent?.hp || 0 }}/{{ agent?.maxHp || 0 }}</span>
              </div>
              <div v-if="agent?.power" class="stat-item">
                <span class="stat-label">力量</span>
                <span class="stat-value">{{ agent.power }}</span>
              </div>
              <div v-if="agent?.role" class="stat-item">
                <span class="stat-label">角色</span>
                <span class="stat-value">{{ agent.role }}</span>
              </div>
              <div v-if="agent?.target" class="stat-item">
                <span class="stat-label">目标</span>
                <span class="stat-value">{{ agent.target }}</span>
              </div>
            </div>

            <div class="agent-inventory">
              <div class="inventory-label">库存物品</div>
              <div v-if="!agent?.inventory || Object.keys(agent.inventory).length === 0" class="inventory-empty">
                无物品
              </div>
              <div v-else class="inventory-items">
                <span v-for="(amount, item) in agent.inventory" :key="item" class="inventory-item">
                  {{ item }}: {{ amount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { OmphalosSimulation } from '../core/llmSimulation';
import { useOpenAIStore } from '../stores/openAIStore';
import { OmphalosWorldState, createInitialOmphalosWorld } from '../core/omphalosWorldState';
import { getAllGoldenHeirProfiles } from '../core/agent/goldenHeirProfiles';
import { TWELVE_TITANS } from '../core/agent/titanProfiles';
import { notificationService } from '../services/notificationService';

const isRunning = ref(false);
const worldState = ref<OmphalosWorldState>(createInitialOmphalosWorld());
const logs = ref<any[]>([]);
const chatLogs = ref<any[]>([]);
const aiLogs = ref<any[]>([]);
const logsContainer = ref<HTMLElement>();
const aiLogsContainer = ref<HTMLElement>();
const openAIStore = useOpenAIStore();
const isLogsFullscreen = ref(false);
const showAILogsDetails = ref(false);
const logImportanceFilter = ref('all');

let simulation: OmphalosSimulation;

const agentCount = computed(() => {
  const heroes = Object.keys(worldState.value?.goldenHeirs || {}).length;
  const titans = Object.keys(worldState.value?.titans || {}).length;
  const npcs = Object.keys(worldState.value?.npcs || {}).length;
  return heroes + titans + npcs;
});

// 过滤日志根据重要度
const filteredLogs = computed(() => {
  if (logImportanceFilter.value === 'all') {
    return logs.value;
  } else if (logImportanceFilter.value === 'medium+') {
    return logs.value.filter(log => 
      ['medium', 'high', 'critical'].includes(log?.importance || 'medium')
    );
  } else if (logImportanceFilter.value === 'high+') {
    return logs.value.filter(log => 
      ['high', 'critical'].includes(log?.importance || 'medium')
    );
  }
  return logs.value;
});

const allAgents = computed(() => {
  const agents: any[] = [];
  
  // 添加黄金裔 (逐火十二英雄)
  const goldenHeirProfiles = getAllGoldenHeirProfiles();
  Object.entries(worldState.value?.goldenHeirs || {}).forEach(([id, status], idx) => {
    const profile = goldenHeirProfiles[idx];
    agents.push({
      id,
      ...status,
      name: profile?.codename,
      type: '黄金裔',
      target: profile?.titanTarget || '未知'
    });
  });

  // 添加泰坦 (十二泰坦)
  Object.entries(worldState.value?.titans || {}).forEach(([id, status]) => {
    const titanProfile = TWELVE_TITANS.find(t => t.id === id);
    agents.push({
      id,
      ...status,
      name: titanProfile ? `${titanProfile.name} (${titanProfile.title})` : id,
      type: '泰坦'
    });
  });

  // 添加NPC (动态生成的NPC)
  Object.entries(worldState.value?.npcs || {}).forEach(([id, status]) => {
    // Generate display name based on NPC ID and role
    let npcName = id;
    const npcStatus = status as any;
    
    // Create meaningful names for known NPC types
    if (id === 'npc1') {
      npcName = '商人伊拉拉';
    } else if (id === 'npc2') {
      npcName = '守卫马库斯';
    } else if (id.startsWith('random_npc_')) {
      const role = npcStatus?.role || npcStatus?.occupation || '市民';
      const npcNumber = id.replace('random_npc_', '');
      npcName = `${role} ${npcNumber}`;
    } else {
      const role = npcStatus?.role || npcStatus?.occupation || '市民';
      npcName = `${role} ${id}`;
    }
    
    agents.push({
      id,
      ...status,
      name: npcName,
      type: 'NPC'
    });
  });

  return agents;
});

// AI日志统计计算属性
const averageAIDuration = computed(() => {
  if (aiLogs.value.length === 0) return 0;
  const totalDuration = aiLogs.value.reduce((sum, log) => sum + (log?.metadata?.duration || 0), 0);
  return Math.round(totalDuration / aiLogs.value.length);
});

const totalTokens = computed(() => {
  return aiLogs.value.reduce((sum, log) => sum + (log?.metadata?.tokenUsage?.totalTokens || 0), 0);
});

const startSimulation = async () => {
      // Check if OpenAI is configured and connected
    if (!openAIStore.isConfigured() || !openAIStore.isConnected) {
      notificationService.showError('请先配置并连接到因果矩阵才能开始模拟。', '配置错误');
      return;
    }

    const client = openAIStore.getClient();
    if (!client) {
      notificationService.showError('无法获取因果矩阵客户端。请检查您的配置。', '连接错误');
      return;
    }

  isRunning.value = true;
  
  try {
    console.log('正在启动翁法罗斯模拟...');
    simulation = new OmphalosSimulation(client, {
      model: openAIStore.settings.selectedModel,
      temperature: openAIStore.settings.temperature
    });
    
    worldState.value = simulation.getState();
    logs.value = [];

    await simulation.runSimulation(33550336, (state) => {
      worldState.value = { ...state } as OmphalosWorldState;
      logs.value = [...(state?.logs || [])];
      chatLogs.value = state.logs.filter(log => log.tags?.includes('chat_action'));
      aiLogs.value = state.logs.filter(log => log.type === 'ai_call');
      
      // 自动滚动日志到底部
      nextTick(() => {
        if (logsContainer.value) {
          logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
        }
        if (aiLogsContainer.value) {
          aiLogsContainer.value.scrollTop = aiLogsContainer.value.scrollHeight;
        }
      });
    });
  } catch (error: any) {
    console.error('模拟器发生错误:', error);
    notificationService.showError(`模拟器遇到错误: ${error?.message || '未知错误'}`, '模拟器错误');
  } finally {
    isRunning.value = false;
  }
};

const resetSimulation = () => {
  worldState.value = createInitialOmphalosWorld();
  logs.value = [];
  chatLogs.value = [];
  aiLogs.value = [];
};

const toggleLogsFullscreen = () => {
  isLogsFullscreen.value = !isLogsFullscreen.value;
  // Auto-scroll to bottom when entering fullscreen
  if (isLogsFullscreen.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
      }
    });
  }
};

// AI日志详情切换
const toggleAILogsDetails = () => {
  showAILogsDetails.value = !showAILogsDetails.value;
};

// 获取耗时样式类
const getDurationClass = (duration: number) => {
  if (duration < 1000) return 'fast';
  if (duration < 3000) return 'medium';
  return 'slow';
};

// Keyboard shortcuts for fullscreen
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isLogsFullscreen.value) {
    toggleLogsFullscreen();
  }
};

// Auto-connect when component mounts if settings are configured
onMounted(async () => {
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeydown);
  
  // 检查OpenAI是否已配置但未连接
  if (openAIStore.isConfigured() && !openAIStore.isConnected) {
    console.log('因果矩阵（OpenAI）已配置但未连接，正在尝试自动连接...');
    try {
      const result = await openAIStore.testConnection();
      if (result.success) {
        console.log('自动连接成功！');
      } else {
        console.warn('自动连接失败:', result.message);
      }
    } catch (error) {
      console.error('自动连接时发生错误:', error);
    }
  } else if (openAIStore.isConnected) {
    console.log('因果矩阵（OpenAI）已连接就绪。');
  } else {
    console.log('因果矩阵（OpenAI）未配置。请先设置您的API。');
  }
});

// Clean up event listener when component unmounts
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.omphalos-system {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* Header Styling */
.system-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.system-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: 600;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(173, 216, 230, 0.6);
  margin: 0;
}

/* Dashboard Container */
.dashboard-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  min-height: 100%;
  align-items: stretch;
  grid-auto-rows: minmax(180px, auto);
}

/* Metric Card Base */
.metric-card {
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Standard card height */
.metric-card:not(.logs-fullscreen):not(.grid-span-full) {
  min-height: 220px;
  max-height: 220px;
}

/* Control panel and world status specific height */
.control-panel,
.world-status {
  min-height: 180px;
  max-height: 180px;
}

/* Logs panel takes more space */
.logs-panel {
  min-height: 400px;
  max-height: 600px;
}

/* Right panel logs - no row span for now */
.logs-right-panel {
  /* Removed grid-row span to prevent white space */
  display: flex;
  flex-direction: column;
}

/* Cities panel special styling */
.cities-panel {
  min-height: 250px;
}

.metric-card:hover {
  background: rgba(173, 216, 230, 0.05);
  border-color: rgba(173, 216, 230, 0.2);
  transform: translateY(-2px);
}

/* Grid Spans */
.grid-span-2 {
  grid-column: span 2;
}

.grid-span-full {
  grid-column: 1 / -1;
}

/* Logs Layout Classes */

.logs-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  grid-column: unset !important;
  grid-row: unset !important;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.9);
  display: flex !important;
  flex-direction: column !important;
  max-height: calc(100vh - 400px) !important;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.logs-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.logs-filter {
  background: rgba(173, 216, 230, 0.1);
  border: 1px solid rgba(173, 216, 230, 0.3);
  color: rgba(173, 216, 230, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.logs-filter:focus {
  outline: none;
  border-color: rgba(173, 216, 230, 0.6);
}

.logs-control-btn {
  background: rgba(173, 216, 230, 0.1);
  border: 1px solid rgba(173, 216, 230, 0.3);
  color: rgba(173, 216, 230, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logs-control-btn:hover {
  background: rgba(173, 216, 230, 0.2);
  border-color: rgba(173, 216, 230, 0.5);
  transform: translateY(-1px);
}

.card-header h3 {
  color: rgba(173, 216, 230, 0.9);
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(173, 216, 230, 0.1), transparent);
  opacity: 0;
  animation: card-shine 3s ease-in-out infinite;
}

@keyframes card-shine {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Control Panel */
.control-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(173, 216, 230, 0.02);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 6px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.8);
  animation: blink 2s ease-in-out infinite;
}

.status-indicator.connected {
  background: rgba(0, 255, 136, 0.8);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 14px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: 600;
  margin-bottom: 4px;
}

.status-subtitle {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.control-buttons {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 6px;
  border: 1px solid rgba(173, 216, 230, 0.3);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: rgba(173, 216, 230, 0.05);
  color: rgba(173, 216, 230, 0.9);
}

.btn-primary {
  background: rgba(173, 216, 230, 0.1);
  border-color: rgba(173, 216, 230, 0.4);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(173, 216, 230, 0.15);
  transform: translateY(-1px);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(173, 216, 230, 0.08);
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* World Metrics */
.world-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(173, 216, 230, 0.05);
}

.metric-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  margin-bottom: 4px;
}

.metric-unit {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.5);
}

/* Cities Grid */
.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;
}

.city-card {
  background: rgba(173, 216, 230, 0.02);
  border: 1px solid rgba(173, 216, 230, 0.1);
  padding: 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.city-card:hover {
  background: rgba(173, 216, 230, 0.04);
  border-color: rgba(173, 216, 230, 0.2);
  transform: translateY(-2px);
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.city-header strong {
  font-size: 16px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: 600;
}

.city-type {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(173, 216, 230, 0.1);
  color: rgba(173, 216, 230, 0.8);
  border: 1px solid rgba(173, 216, 230, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.city-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.city-stat-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.05);
}

.city-stat-item .stat-label {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.6);
}

.city-stat-item .stat-value {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: 600;
}

.city-resources {
  border-top: 1px solid rgba(173, 216, 230, 0.1);
  padding-top: 8px;
}

.resources-title {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
  margin-bottom: 6px;
  font-weight: 500;
}

.resources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-item {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.7);
  background: rgba(173, 216, 230, 0.05);
  padding: 3px 6px;
  border-radius: 3px;
  border: 1px solid rgba(173, 216, 230, 0.1);
}

/* Corruption Monitor */
.corruption-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.corruption-item {
  padding: 12px;
  background: rgba(173, 216, 230, 0.02);
  border: 1px solid rgba(173, 216, 230, 0.05);
  border-radius: 6px;
}

.corruption-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.corruption-area {
  font-size: 14px;
  color: rgba(173, 216, 230, 0.9);
}

.corruption-level {
  font-size: 14px;
  color: rgba(255, 107, 107, 0.8);
  font-weight: bold;
}

.corruption-bar {
  height: 6px;
  background: rgba(173, 216, 230, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.corruption-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.8), rgba(255, 107, 107, 0.4));
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Logs Panel */
.logs-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}



.logs-fullscreen .logs-container {
  height: calc(100vh - 120px) !important;
  max-height: 100% !important;
  background: rgba(0, 0, 0, 0.7);
  font-size: 14px;
  overflow-y: auto;
  flex: 1 !important;
}

.log-entry {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  padding: 12px;
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.05);
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.log-entry:hover {
  background: rgba(173, 216, 230, 0.06);
  border-color: rgba(173, 216, 230, 0.1);
}

.logs-fullscreen .log-entry {
  padding: 16px;
  margin-bottom: 4px;
  background: rgba(173, 216, 230, 0.05);
}

.log-day {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.8);
  font-weight: 600;
  min-width: 80px;
  padding: 4px 8px;
  background: rgba(173, 216, 230, 0.1);
  border-radius: 4px;
  text-align: center;
  flex-shrink: 0;
}

.logs-fullscreen .log-day {
  font-size: 14px;
  min-width: 100px;
}

.log-message {
  font-size: 13px;
  color: rgba(173, 216, 230, 0.9);
  flex: 1;
  line-height: 1.4;
}

.logs-fullscreen .log-message {
  font-size: 15px;
  line-height: 1.5;
}

.log-importance {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.log-importance.low {
  background: rgba(144, 238, 144, 0.2);
  color: rgba(144, 238, 144, 0.9);
  border: 1px solid rgba(144, 238, 144, 0.3);
}

.log-importance.medium {
  background: rgba(255, 193, 7, 0.2);
  color: rgba(255, 193, 7, 0.9);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.log-importance.high {
  background: rgba(255, 99, 71, 0.2);
  color: rgba(255, 99, 71, 0.9);
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.log-importance.critical {
  background: rgba(220, 20, 60, 0.3);
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(220, 20, 60, 0.5);
  animation: pulse-critical 2s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.logs-stats {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  background: rgba(173, 216, 230, 0.05);
  border-top: 1px solid rgba(173, 216, 230, 0.1);
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
  margin-top: auto;
}

.logs-fullscreen .logs-stats {
  font-size: 14px;
  padding: 12px 20px !important;
  flex-shrink: 0 !important;
  margin-top: auto !important;
}

/* Regular logs panel styling */
.logs-panel .logs-container {
  max-height: 480px;
  height: 100%;
  flex: 1;
}

/* Agents Grid */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

/* Agents panel specific adjustments */
.agents-panel {
  min-height: 600px;
}

.agents-panel .agents-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  max-height: 800px;
}

.agent-card {
  background: rgba(173, 216, 230, 0.02);
  border: 1px solid rgba(173, 216, 230, 0.1);
  padding: 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.agent-card:hover {
  background: rgba(173, 216, 230, 0.04);
  border-color: rgba(173, 216, 230, 0.2);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.agent-name {
  margin: 0;
  font-size: 14px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: 600;
}

.agent-type {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.agent-type.黄金裔 {
  background: rgba(255, 215, 0, 0.2);
  color: rgba(255, 215, 0, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.agent-type.泰坦 {
  background: rgba(255, 99, 71, 0.2);
  color: rgba(255, 99, 71, 0.9);
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.agent-type.npc {
  background: rgba(144, 238, 144, 0.2);
  color: rgba(144, 238, 144, 0.9);
  border: 1px solid rgba(144, 238, 144, 0.3);
}

.agent-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: rgba(173, 216, 230, 0.6);
}

.stat-value {
  color: rgba(173, 216, 230, 0.9);
  font-weight: 500;
}

.agent-inventory {
  border-top: 1px solid rgba(173, 216, 230, 0.1);
  padding-top: 12px;
}

.inventory-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
  margin-bottom: 6px;
  font-weight: 500;
}

.inventory-empty {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.5);
  font-style: italic;
}

.inventory-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.inventory-item {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.7);
  background: rgba(173, 216, 230, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(173, 216, 230, 0.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(173, 216, 230, 0.5);
  font-style: italic;
  font-size: 14px;
}

/* Responsive Design */
@media (min-width: 1600px) {
  .dashboard-container {
    grid-template-columns: 1fr 1fr 1.5fr;
  }
}

@media (max-width: 1599px) and (min-width: 1200px) {
  .dashboard-container {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (max-width: 1199px) and (min-width: 900px) {
  .dashboard-container {
    grid-template-columns: 1fr 1fr;
  }
  
  .logs-right-panel {
    grid-column: span 2;
  }
}

@media (max-width: 899px) {
  .dashboard-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .grid-span-2,
  .grid-span-full {
    grid-column: span 1;
  }
  
  .metric-card:not(.logs-fullscreen):not(.grid-span-full) {
    min-height: 200px;
    max-height: none;
  }
  
  .control-panel,
  .world-status {
    min-height: 160px;
    max-height: none;
  }
  
  .logs-panel {
    min-height: 300px;
    max-height: none;
  }
  
  .logs-right-panel {
    grid-row: span 1;
  }
  
  .cities-grid {
    grid-template-columns: 1fr;
  }
  
  .city-stats {
    grid-template-columns: 1fr;
  }
  
  .world-metrics {
    grid-template-columns: 1fr;
  }
  
  .control-buttons {
    flex-direction: column;
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .logs-fullscreen .card-header {
    padding: 15px 20px !important;
    flex-shrink: 0 !important;
    margin-bottom: 0 !important;
  }
  
  .logs-control-btn {
    padding: 12px 16px;
    font-size: 18px;
  }
  
  .logs-panel .logs-container {
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  .omphalos-system {
    padding: 10px;
  }
  
  .dashboard-container {
    gap: 12px;
  }
  
  .metric-card {
    padding: 12px;
    min-height: 200px;
  }
  
  .system-header {
    padding: 12px;
    margin-bottom: 20px;
  }
  
  .system-header h1 {
    font-size: 20px;
  }
  
  .header-subtitle {
    font-size: 12px;
  }
  
  .logs-panel .logs-container {
    max-height: 180px;
  }
  
  /* 手机端日志优化 */
  .logs-container {
    padding: 8px;
    gap: 6px;
  }
  
  .log-entry {
    padding: 8px;
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .log-day {
    font-size: 10px;
    min-width: 60px;
    padding: 2px 4px;
    align-self: flex-start;
  }
  
  .log-message {
    font-size: 11px;
    line-height: 1.3;
    width: 100%;
    word-break: break-word;
  }
  
  .log-importance {
    font-size: 8px;
    padding: 1px 3px;
    align-self: flex-end;
    margin-top: 3px;
  }
  
  /* 手机端日志控制按钮优化 */
  .logs-controls {
    gap: 4px;
  }
  
  .logs-filter {
    padding: 2px 4px;
    font-size: 10px;
  }
  
  .logs-control-btn {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  /* 手机端全屏日志优化 */
  .logs-fullscreen {
    padding: 8px !important;
  }
  
  .logs-fullscreen .log-entry {
    padding: 10px;
    margin-bottom: 4px;
  }
  
  .logs-fullscreen .log-day {
    font-size: 11px;
    min-width: 70px;
  }
  
  .logs-fullscreen .log-message {
    font-size: 12px;
    line-height: 1.4;
  }
  
  .logs-fullscreen .logs-stats {
    padding: 8px 12px !important;
    font-size: 11px;
  }
  
  /* 手机端AI日志优化 */
  .ai-log-entry {
    padding: 8px;
  }
  
  .ai-log-main {
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .ai-agent-name {
    font-size: 11px;
  }
  
  .ai-model-name {
    font-size: 10px;
    padding: 1px 3px;
  }
  
  .ai-duration {
    font-size: 9px;
    padding: 1px 3px;
    min-width: 45px;
  }
  
  .ai-log-details {
    padding: 4px;
    gap: 3px;
  }
  
  .ai-token-usage {
    font-size: 9px;
  }
  
  .ai-prompt-preview,
  .ai-response-preview {
    font-size: 9px;
    padding: 2px 3px;
    max-height: 40px;
  }
  
  .ai-logs-stats {
    padding: 8px 10px;
    font-size: 10px;
    gap: 8px;
  }
  
  /* 手机端卡片头部优化 */
  .card-header {
    margin-bottom: 12px;
  }
  
  .card-header h3 {
    font-size: 14px;
  }
  
  /* 手机端滚动条优化 */
  .logs-container::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .logs-container::-webkit-scrollbar-thumb {
    border-radius: 2px;
  }
  
  /* 手机端空状态优化 */
  .empty-state {
    padding: 25px 12px;
    font-size: 11px;
  }
  
  /* 手机端控制面板优化 */
  .control-content {
    gap: 15px;
  }
  
  .connection-status {
    padding: 12px;
    gap: 12px;
  }
  
  .status-title {
    font-size: 13px;
  }
  
  .status-subtitle {
    font-size: 11px;
  }
  
  /* 手机端世界状态优化 */
  .world-metrics {
    gap: 8px;
  }
  
  .metric-item {
    padding: 12px;
  }
  
  .metric-label {
    font-size: 11px;
    margin-bottom: 6px;
  }
  
  .metric-value {
    font-size: 20px;
  }
  
  .metric-unit {
    font-size: 9px;
  }
  
  /* 手机端城市卡片优化 */
  .city-card {
    padding: 12px;
    gap: 10px;
  }
  
  .city-header strong {
    font-size: 14px;
  }
  
  .city-type {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .city-stat-item {
    padding: 4px 6px;
  }
  
  .city-stat-item .stat-label {
    font-size: 10px;
  }
  
  .city-stat-item .stat-value {
    font-size: 11px;
  }
  
  .resources-title {
    font-size: 11px;
    margin-bottom: 4px;
  }
  
  .resource-item {
    font-size: 9px;
    padding: 2px 4px;
  }
  
  /* 手机端代理卡片优化 */
  .agent-card {
    padding: 12px;
  }
  
  .agent-name {
    font-size: 13px;
  }
  
  .agent-type {
    font-size: 9px;
    padding: 3px 6px;
  }
  
  .stat-item {
    font-size: 11px;
  }
  
  .inventory-label {
    font-size: 11px;
    margin-bottom: 4px;
  }
  
  .inventory-item {
    font-size: 9px;
    padding: 2px 4px;
  }
  
  /* 手机端黑潮监控优化 */
  .corruption-item {
    padding: 10px;
  }
  
  .corruption-area {
    font-size: 13px;
  }
  
  .corruption-level {
    font-size: 13px;
  }
}

/* Custom Scrollbar */
.omphalos-system::-webkit-scrollbar,
.cities-grid::-webkit-scrollbar,
.corruption-list::-webkit-scrollbar,
.logs-container::-webkit-scrollbar,
.agents-grid::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.omphalos-system::-webkit-scrollbar-track,
.cities-grid::-webkit-scrollbar-track,
.corruption-list::-webkit-scrollbar-track,
.logs-container::-webkit-scrollbar-track,
.agents-grid::-webkit-scrollbar-track {
  background: rgba(173, 216, 230, 0.05);
  border-radius: 4px;
}

.omphalos-system::-webkit-scrollbar-thumb,
.cities-grid::-webkit-scrollbar-thumb,
.corruption-list::-webkit-scrollbar-thumb,
.logs-container::-webkit-scrollbar-thumb,
.agents-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(173, 216, 230, 0.6), rgba(173, 216, 230, 0.3));
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.2);
  transition: all 0.3s ease;
}

.omphalos-system::-webkit-scrollbar-thumb:hover,
.cities-grid::-webkit-scrollbar-thumb:hover,
.corruption-list::-webkit-scrollbar-thumb:hover,
.logs-container::-webkit-scrollbar-thumb:hover,
.agents-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.5));
}

/* AI日志面板样式 */
.ai-logs-panel {
  border: 1px solid rgba(100, 149, 237, 0.3);
}

.ai-logs-controls {
  display: flex;
  gap: 8px;
}

.ai-logs-container {
  max-height: 400px;
}

.ai-log-entry {
  border-left: 3px solid rgba(100, 149, 237, 0.5);
  background: rgba(100, 149, 237, 0.02);
}

.ai-log-entry:hover {
  border-left-color: rgba(100, 149, 237, 0.8);
  background: rgba(100, 149, 237, 0.05);
}

.ai-log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-log-main {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.ai-agent-name {
  font-weight: 600;
  color: rgba(173, 216, 230, 0.9);
  font-size: 13px;
}

.ai-model-name {
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(100, 149, 237, 0.2);
  border-radius: 3px;
  color: rgba(100, 149, 237, 0.9);
  border: 1px solid rgba(100, 149, 237, 0.3);
}

.ai-duration {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.ai-duration.fast {
  background: rgba(144, 238, 144, 0.2);
  color: rgba(144, 238, 144, 0.9);
  border: 1px solid rgba(144, 238, 144, 0.3);
}

.ai-duration.medium {
  background: rgba(255, 193, 7, 0.2);
  color: rgba(255, 193, 7, 0.9);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.ai-duration.slow {
  background: rgba(255, 99, 71, 0.2);
  color: rgba(255, 99, 71, 0.9);
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.ai-log-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(100, 149, 237, 0.1);
}

.ai-token-usage {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.7);
}

.ai-prompt-preview,
.ai-response-preview {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.6);
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 6px;
  border-radius: 3px;
  word-break: break-word;
  max-height: 60px;
  overflow: hidden;
}

.ai-logs-stats {
  display: flex;
  gap: 15px;
  padding: 12px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(100, 149, 237, 0.2);
  font-size: 12px;
  color: rgba(173, 216, 230, 0.8);
  justify-content: space-between;
  flex-wrap: wrap;
}

/* 详情展开时的样式 */
.ai-log-entry.detailed {
  padding: 16px;
}

.ai-log-entry.detailed .ai-log-main {
  margin-bottom: 8px;
}

/* Firefox scrollbar */
.omphalos-system,
.cities-grid,
.corruption-list,
.logs-container,
.agents-grid {
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 216, 230, 0.6) rgba(173, 216, 230, 0.05);
}
</style>