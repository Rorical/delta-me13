<template>
  <div class="system-dashboard">
    <!-- Main Container -->
    <div class="dashboard-container">

      <!-- Core Metrics -->
      <div class="metric-card core-metrics">
        <div class="card-header">
          <h3>核心指标</h3>
          <div class="card-glow"></div>
        </div>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">逻辑核心格数</div>
            <div class="metric-value">{{ coreCount.toLocaleString() }}</div>
            <div class="metric-unit">格</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">总线带宽</div>
            <div class="metric-value">{{ (bandwidth / 1000).toFixed(1) }}</div>
            <div class="metric-unit">ZB/s</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">能量消耗</div>
            <div class="metric-value">{{ energyConsumption.toFixed(1) }}</div>
            <div class="metric-unit">GW</div>
          </div>
        </div>
      </div>

      <!-- System Alerts -->
      <div class="metric-card system-alerts">
        <div class="card-header">
          <h3>系统警报</h3>
          <div class="card-glow"></div>
        </div>
        <div class="alerts-list">
          <div v-for="alert in systemAlerts" :key="alert.id" class="alert-item" :class="alert.level">
            <div class="alert-icon">{{ alert.icon }}</div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-time">{{ alert.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Usage -->
      <div class="metric-card core-usage">
        <div class="card-header">
          <h3>核心占用率</h3>
          <div class="card-glow"></div>
        </div>
        <div class="core-display">
          <div class="core-count">总核心数: {{ totalCores.toLocaleString() }}</div>
          <div class="core-grid">
            <div v-for="core in displayedCores" :key="core.id" class="core-item" :class="{ active: core.active }"
              :style="{ opacity: core.active ? core.usage / 100 : 0.3 }">
            </div>
          </div>
          <div class="core-stats">
            <span>活跃: {{ activeCores.toLocaleString() }}</span>
            <span>空闲: {{ (totalCores - activeCores).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Process Monitor -->
      <div class="metric-card process-monitor">
        <div class="card-header">
          <h3>活跃进程</h3>
          <div class="card-glow"></div>
        </div>
        <div class="process-list">
          <div v-for="process in activeProcesses" :key="process.id" class="process-item">
            <div class="process-info">
              <div class="process-name">{{ process.name }}</div>
              <div class="process-id">PID: {{ process.id }}</div>
            </div>
            <div class="process-status">
              <div class="status-bar" :style="{ width: process.cpu + '%' }"></div>
              <span class="cpu-usage">{{ process.cpu.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Disk Usage -->
      <div class="metric-card disk-usage">
        <div class="card-header">
          <h3>存储矩阵</h3>
          <div class="card-glow"></div>
        </div>
        <div class="disk-display">
          <div v-for="disk in diskData" :key="disk.name" class="disk-item">
            <div class="disk-info">
              <span class="disk-name">{{ disk.name }}</span>
              <span class="disk-size">{{ disk.used }} / {{ disk.total }} YB</span>
            </div>
            <div class="disk-bar">
              <div class="disk-fill" :style="{ width: disk.usage + '%' }"></div>
            </div>
            <span class="disk-usage">{{ disk.usage.toFixed(2) }}%</span>
          </div>
        </div>
      </div>

      <!-- Memory Exchange -->
      <div class="metric-card memory-exchange">
        <div class="card-header">
          <h3>忆质交换器</h3>
          <div class="card-glow"></div>
        </div>
        <div class="exchange-display">
          <div class="exchange-params">
            <div class="param-item">
              <span class="param-label">交换频率</span>
              <span class="param-value">{{ memoryFrequency }} THz</span>
            </div>
            <div class="param-item">
              <span class="param-label">忆质密度</span>
              <span class="param-value">{{ memoryDensity }} TB/cm³</span>
            </div>
            <div class="param-item">
              <span class="param-label">传输效率</span>
              <span class="param-value">{{ memoryEfficiency.toFixed(2) }}%</span>
            </div>
          </div>
          <div class="exchange-status">
            <div class="status-indicator" :class="{ running: memoryRunning }"></div>
            <span>{{ memoryRunning ? '运行中' : '待机' }}</span>
          </div>
        </div>
      </div>

      <!-- Network Status -->
      <div class="metric-card network-status">
        <div class="card-header">
          <h3>超距连接器</h3>
          <div class="card-glow"></div>
        </div>
        <div class="network-display">
          <div class="network-item">
            <span class="network-label">上传速度</span>
            <span class="network-value">{{ networkUpload }} ZB/s</span>
          </div>
          <div class="network-item">
            <span class="network-label">下载速度</span>
            <span class="network-value">{{ networkDownload }} ZB/s</span>
          </div>
          <div class="network-item">
            <span class="network-label">延迟</span>
            <span class="network-value">{{ networkLatency }} ms</span>
          </div>
          <div class="network-item">
            <span class="network-label">连接状态</span>
            <span class="network-status-indicator" :class="{ online: networkOnline }"></span>
          </div>
        </div>
      </div>

      <!-- Temperature Monitor -->
      <div class="metric-card temperature-monitor">
        <div class="card-header">
          <h3>温度监控</h3>
          <div class="card-glow"></div>
        </div>
        <div class="temperature-display">
          <div class="temp-item">
            <span class="temp-label">逻辑核心温度</span>
            <span class="temp-value">{{ cpuTemp }}°C</span>
            <div class="temp-bar" :style="{ width: (cpuTemp / 100) * 100 + '%' }"></div>
          </div>
          <div class="temp-item">
            <span class="temp-label">矩阵核心温度</span>
            <span class="temp-value">{{ gpuTemp }}°C</span>
            <div class="temp-bar" :style="{ width: (gpuTemp / 100) * 100 + '%' }"></div>
          </div>
          <div class="temp-item">
            <span class="temp-label">基质温度</span>
            <span class="temp-value">{{ boardTemp }}°C</span>
            <div class="temp-bar" :style="{ width: (boardTemp / 100) * 100 + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Shield Power -->
      <div class="metric-card shield-power">
        <div class="card-header">
          <h3>屏蔽罩功率</h3>
          <div class="card-glow"></div>
        </div>
        <div class="shield-display">
          <div class="shield-circle">
            <div class="shield-fill" :style="{ transform: `rotate(${shieldPower * 3.6}deg)` }"></div>
            <div class="shield-text">{{ shieldPower.toFixed(2) }}%</div>
          </div>
          <div class="shield-status">
            <div class="status-item">
              <span class="status-label">防护等级</span>
              <span class="status-value">{{ shieldLevel }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">能量储备</span>
              <span class="status-value">{{ shieldEnergy.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory Usage -->
      <div class="metric-card memory-usage">
        <div class="card-header">
          <h3>栅格变量空间</h3>
          <div class="card-glow"></div>
        </div>
        <div class="memory-display">
          <div class="memory-circle">
            <div class="memory-fill" :style="{ transform: `rotate(${memoryUsage * 3.6}deg)` }"></div>
            <div class="memory-text">{{ memoryUsage.toFixed(2) }}%</div>
          </div>
          <div class="memory-details">
            <div class="memory-item">
              <span class="memory-label">已用</span>
              <span class="memory-value">{{ memoryUsed }} YB</span>
            </div>
            <div class="memory-item">
              <span class="memory-label">可用</span>
              <span class="memory-value">{{ memoryAvailable }} YB</span>
            </div>
            <div class="memory-item">
              <span class="memory-label">总计</span>
              <span class="memory-value">{{ memoryTotal }} YB</span>
            </div>
          </div>
        </div>
      </div>

             <!-- Windows Style CPU Grid -->
       <div class="metric-card cpu-grid-card grid-span-2">
        <div class="card-header">
          <h3>核心占用率监控</h3>
          <div class="card-glow"></div>
        </div>
        <div class="cpu-grid-container">
          <div class="cpu-grid-header">
            <span>总核心数: {{ totalCores.toLocaleString() }}</span>
            <span>活跃: {{ activeCores.toLocaleString() }}</span>
          </div>
          <div class="cpu-grid">
            <div v-for="cpu in cpuGridData" :key="cpu.id" class="cpu-cell"
              :class="{ active: cpu.active, high: cpu.usage > 80, medium: cpu.usage > 50 && cpu.usage <= 80, low: cpu.usage <= 50 }"
              :style="{
                opacity: cpu.active ? (0.3 + (cpu.usage / 100) * 0.7) : 0.1,
                background: cpu.active ? `rgba(173, 216, 230, ${cpu.usage / 100})` : 'rgba(173, 216, 230, 0.1)'
              }">
              <div class="cpu-cell-content">
                <div class="cpu-id">{{ cpu.id }}</div>
                <div class="cpu-usage-text">{{ cpu.usage.toFixed(2) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Reactive data
const coreCount = ref(2847)
const bandwidth = ref(1250)
const energyConsumption = ref(847.3)
const totalCores = ref(3355)
const activeCores = ref(2847)
const shieldPower = ref(87)
const shieldLevel = ref('A级')
const shieldEnergy = ref(94)
const memoryFrequency = ref(156.7)
const memoryDensity = ref(847.3)
const memoryEfficiency = ref(98.5)
const memoryRunning = ref(true)

// New data for additional cards
const networkUpload = ref(45.7)
const networkDownload = ref(128.3)
const networkLatency = ref(12)
const networkOnline = ref(true)

const cpuTemp = ref(67)
const gpuTemp = ref(72)
const boardTemp = ref(45)

const memoryUsage = ref(78)
const memoryUsed = ref(12.4)
const memoryAvailable = ref(3.5)
const memoryTotal = ref(16)

const diskData = ref([
  { name: 'C:', used: 156.7, total: 500, usage: 31 },
  { name: 'D:', used: 234.2, total: 1000, usage: 23 },
  { name: 'E:', used: 89.5, total: 2000, usage: 4 }
])

const cpuGridData = ref<Array<{ id: number, active: boolean, usage: number }>>([])

const activeProcesses = ref([
  { id: 1001, name: '量子计算核心', cpu: 87 },
  { id: 1002, name: '神经网络处理器', cpu: 92 },
  { id: 1003, name: '数据同步引擎', cpu: 45 },
  { id: 1004, name: '安全防护模块', cpu: 23 },
  { id: 1005, name: '忆质交换器', cpu: 78 }
])

const systemAlerts = ref([
  { id: 1, level: 'info', icon: 'INFO', title: '系统运行正常', time: '2分钟前' },
  { id: 2, level: 'warning', icon: 'WARN', title: '核心温度略高', time: '5分钟前' },
  { id: 3, level: 'success', icon: 'OK', title: '备份完成', time: '8分钟前' }
])

// Computed
const displayedCores = ref<Array<{ id: number, active: boolean, usage: number }>>([])

// Generate core display data
const generateCoreData = () => {
  const cores = []
  for (let i = 0; i < 100; i++) { // Show 100 cores as sample
    cores.push({
      id: i,
      active: Math.random() > 0.3,
      usage: Math.random() * 100
    })
  }
  displayedCores.value = cores
}

// Generate CPU grid data (Windows style)
const generateCpuGridData = () => {
  const cpus = []
  for (let i = 0; i < 64; i++) { // Show 64 CPU cores in grid
    cpus.push({
      id: i + 1,
      active: Math.random() > 0.2,
      usage: Math.random() * 100
    })
  }
  cpuGridData.value = cpus
}

// Update data randomly
const updateData = () => {
  coreCount.value += Math.floor(Math.random() * 10 - 5)
  bandwidth.value += Math.random() * 100 - 50
  energyConsumption.value += Math.random() * 10 - 5
  shieldPower.value = Math.max(0, Math.min(100, shieldPower.value + Math.random() * 10 - 5))
  memoryFrequency.value += Math.random() * 10 - 5
  memoryEfficiency.value = Math.max(90, Math.min(100, memoryEfficiency.value + Math.random() * 2 - 1))

  // Update network data
  networkUpload.value = Math.max(0, networkUpload.value + Math.random() * 20 - 10)
  networkDownload.value = Math.max(0, networkDownload.value + Math.random() * 30 - 15)
  networkLatency.value = Math.max(1, Math.min(50, networkLatency.value + Math.random() * 10 - 5))

  // Update temperature data
  cpuTemp.value = Math.max(30, Math.min(95, cpuTemp.value + Math.random() * 10 - 5))
  gpuTemp.value = Math.max(35, Math.min(90, gpuTemp.value + Math.random() * 10 - 5))
  boardTemp.value = Math.max(25, Math.min(70, boardTemp.value + Math.random() * 8 - 4))

  // Update memory data
  memoryUsage.value = Math.max(10, Math.min(95, memoryUsage.value + Math.random() * 10 - 5))
  memoryUsed.value = Math.max(8, Math.min(15, memoryUsed.value + Math.random() * 2 - 1))
  memoryAvailable.value = Math.max(1, Math.min(8, memoryAvailable.value + Math.random() * 2 - 1))

  // Update disk data
  diskData.value.forEach(disk => {
    disk.usage = Math.max(1, Math.min(95, disk.usage + Math.random() * 10 - 5))
    disk.used = Math.max(50, Math.min(disk.total * 0.9, disk.used + Math.random() * 20 - 10))
  })

  // Update process CPU usage
  activeProcesses.value.forEach(process => {
    process.cpu = Math.max(0, Math.min(100, process.cpu + Math.random() * 20 - 10))
  })

  // Update active cores
  activeCores.value = Math.floor(totalCores.value * (0.7 + Math.random() * 0.2))

  // Generate new core display data
  generateCoreData()
  generateCpuGridData()
}

let updateInterval: number | null = null

onMounted(() => {
  generateCoreData()
  generateCpuGridData()
  updateInterval = setInterval(updateData, 2000) as unknown as number // Update every 2 seconds
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.system-dashboard {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.dashboard-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  min-height: 100%;
  align-items: start;
}

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
  min-height: 280px;
}

/* Compact cards for better layout */
.metric-card.core-metrics,
.metric-card.system-alerts,
.metric-card.core-usage {
  min-height: 220px;
  max-height: 220px;
}

.metric-card.process-monitor {
  min-height: 220px;
  max-height: 220px;
}

/* Grid span classes */
.grid-span-2 {
  grid-column: span 2;
}

/* Flexible content area */
.metric-card .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.metric-card.core-metrics .card-header,
.metric-card.system-alerts .card-header,
.metric-card.process-monitor .card-header,
.metric-card.core-usage .card-header {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.metric-card.process-monitor .process-list {
  max-height: 120px;
  flex: 1;
}

.metric-card.system-alerts .alerts-list {
  max-height: 120px;
  flex: 1;
}

.metric-card.core-usage .core-display {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.metric-card.core-usage .core-grid {
  max-height: 80px;
  flex: 1;
}

.metric-card:hover {
  background: rgba(173, 216, 230, 0.05);
  border-color: rgba(173, 216, 230, 0.2);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.card-header h3 {
  color: rgba(173, 216, 230, 0.9);
  font-size: 18px;
  margin: 0;
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.metric-item {
  text-align: center;
  padding: 12px 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(173, 216, 230, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.metric-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
  margin-bottom: 5px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  margin-bottom: 2px;
  line-height: 1.2;
}

.metric-unit {
  font-size: 9px;
  color: rgba(173, 216, 230, 0.5);
  line-height: 1;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.process-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.05);
}

.process-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.process-name {
  font-size: 14px;
  color: rgba(173, 216, 230, 0.9);
}

.process-id {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.5);
}

.process-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-bar {
  width: 60px;
  height: 4px;
  background: rgba(173, 216, 230, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.status-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.4));
  border-radius: 2px;
  animation: status-fill 2s ease-in-out infinite;
}

@keyframes status-fill {

  0%,
  100% {
    width: 0%;
  }

  50% {
    width: 100%;
  }
}

.cpu-usage {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
  min-width: 30px;
}

.core-display {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.core-count {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
  text-align: center;
  flex-shrink: 0;
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 2px;
  max-height: 120px;
  overflow-y: auto;
}

.core-item {
  width: 8px;
  height: 8px;
  background: rgba(173, 216, 230, 0.3);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.core-item.active {
  background: rgba(173, 216, 230, 0.8);
  box-shadow: 0 0 4px rgba(173, 216, 230, 0.5);
}

.core-stats {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(173, 216, 230, 0.6);
  flex-shrink: 0;
  margin-top: auto;
}

.shield-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.shield-circle {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(173, 216, 230, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(173, 216, 230, 0.2);
}

.shield-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(173, 216, 230, 0.8) 0deg, transparent 0deg);
  transition: transform 0.5s ease;
}

.shield-text {
  font-size: 24px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  z-index: 2;
}

.shield-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
}

.status-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.status-value {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

.exchange-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exchange-params {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
}

.param-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.param-value {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

.exchange-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(173, 216, 230, 0.3);
}

.status-indicator.running {
  background: #00ff88;
  animation: blink 1s ease-in-out infinite;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid transparent;
}

.alert-item.info {
  background: rgba(0, 123, 255, 0.1);
  border-left-color: #007bff;
}

.alert-item.warning {
  background: rgba(255, 193, 7, 0.1);
  border-left-color: #ffc107;
}

.alert-item.success {
  background: rgba(40, 167, 69, 0.1);
  border-left-color: #28a745;
}

.alert-icon {
  font-size: 16px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  margin-bottom: 2px;
}

.alert-time {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.5);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-container {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .metric-card {
    min-height: 250px;
  }
  
  .metric-card.core-metrics,
  .metric-card.system-alerts,
  .metric-card.core-usage,
  .metric-card.process-monitor {
    min-height: 200px;
    max-height: none;
  }
  
  /* Reset grid span on mobile */
  .grid-span-2 {
    grid-column: span 1;
  }
  
  .core-grid {
    grid-template-columns: repeat(15, 1fr);
  }
  
  .cpu-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .system-dashboard {
    padding: 10px;
  }

  .metric-card {
    padding: 15px;
  }

  .core-grid {
    grid-template-columns: repeat(10, 1fr);
  }

  .cpu-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Custom Scrollbar Styles */
.system-dashboard::-webkit-scrollbar,
.process-list::-webkit-scrollbar,
.core-grid::-webkit-scrollbar,
.alerts-list::-webkit-scrollbar,
.cpu-grid::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.system-dashboard::-webkit-scrollbar-track,
.process-list::-webkit-scrollbar-track,
.core-grid::-webkit-scrollbar-track,
.alerts-list::-webkit-scrollbar-track,
.cpu-grid::-webkit-scrollbar-track {
  background: rgba(173, 216, 230, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.1);
}

.system-dashboard::-webkit-scrollbar-thumb,
.process-list::-webkit-scrollbar-thumb,
.core-grid::-webkit-scrollbar-thumb,
.alerts-list::-webkit-scrollbar-thumb,
.cpu-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(173, 216, 230, 0.6), rgba(173, 216, 230, 0.3));
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.2);
  box-shadow: 0 0 4px rgba(173, 216, 230, 0.3);
  transition: all 0.3s ease;
}

.system-dashboard::-webkit-scrollbar-thumb:hover,
.process-list::-webkit-scrollbar-thumb:hover,
.core-grid::-webkit-scrollbar-thumb:hover,
.alerts-list::-webkit-scrollbar-thumb:hover,
.cpu-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.5));
  box-shadow: 0 0 8px rgba(173, 216, 230, 0.5);
}

.system-dashboard::-webkit-scrollbar-corner,
.process-list::-webkit-scrollbar-corner,
.core-grid::-webkit-scrollbar-corner,
.alerts-list::-webkit-scrollbar-corner,
.cpu-grid::-webkit-scrollbar-corner {
  background: rgba(173, 216, 230, 0.05);
}

/* Firefox scrollbar styles */
.system-dashboard,
.process-list,
.core-grid,
.alerts-list,
.cpu-grid {
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 216, 230, 0.6) rgba(173, 216, 230, 0.05);
}

/* Reduce right padding for scrollable elements */
.process-list {
  padding-right: 8px;
}

.alerts-list {
  padding-right: 8px;
}

.core-grid {
  padding-right: 8px;
}

.cpu-grid {
  padding-right: 8px;
}

.system-dashboard {
  padding-right: 12px;
}

/* Network Status Styles */
.network-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.05);
}

.network-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.network-value {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

.network-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(173, 216, 230, 0.3);
}

.network-status-indicator.online {
  background: #00ff88;
  animation: blink 1s ease-in-out infinite;
}

/* Temperature Monitor Styles */
.temperature-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.temp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.05);
  position: relative;
}

.temp-label {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.6);
}

.temp-value {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

.temp-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.4));
  border-radius: 1px;
  transition: width 0.3s ease;
}

/* Memory Usage Styles */
.memory-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.memory-circle {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(173, 216, 230, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(173, 216, 230, 0.2);
}

.memory-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(173, 216, 230, 0.8) 0deg, transparent 0deg);
  transition: transform 0.5s ease;
}

.memory-text {
  font-size: 18px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  z-index: 2;
}

.memory-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.memory-item {
  display: flex;
  justify-content: space-between;
  padding: 6px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
}

.memory-label {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.6);
}

.memory-value {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

/* CPU Grid Styles */
.cpu-grid-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cpu-grid-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(173, 216, 230, 0.7);
}

.cpu-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.cpu-cell {
  aspect-ratio: 1;
  border: 1px solid rgba(173, 216, 230, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  background: rgba(0, 0, 0, 0.2);
}

.cpu-cell.active {
  border-color: rgba(173, 216, 230, 0.5);
  box-shadow: 0 0 4px rgba(173, 216, 230, 0.3);
}

.cpu-cell.high {
  border-color: rgba(255, 100, 100, 0.6);
  box-shadow: 0 0 6px rgba(255, 100, 100, 0.4);
}

.cpu-cell.medium {
  border-color: rgba(255, 193, 7, 0.6);
  box-shadow: 0 0 4px rgba(255, 193, 7, 0.3);
}

.cpu-cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 2;
  width: 100%;
  height: 100%;
  justify-content: center;
}

.cpu-id {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: bold;
  line-height: 1;
  text-shadow: 
    -1px -1px 0 rgba(30, 100, 150, 0.9),
    1px -1px 0 rgba(30, 100, 150, 0.9),
    -1px 1px 0 rgba(30, 100, 150, 0.9),
    1px 1px 0 rgba(30, 100, 150, 0.9),
    0 0 3px rgba(173, 216, 230, 0.8);
}

.cpu-usage-text {
  font-size: 7px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
  text-shadow: 
    -1px -1px 0 rgba(30, 100, 150, 0.9),
    1px -1px 0 rgba(30, 100, 150, 0.9),
    -1px 1px 0 rgba(30, 100, 150, 0.9),
    1px 1px 0 rgba(30, 100, 150, 0.9),
    0 0 3px rgba(173, 216, 230, 0.6);
}

/* Disk Usage Styles */
.disk-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.disk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(173, 216, 230, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(173, 216, 230, 0.05);
}

.disk-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}

.disk-name {
  font-size: 12px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
}

.disk-size {
  font-size: 10px;
  color: rgba(173, 216, 230, 0.5);
}

.disk-bar {
  flex: 1;
  height: 6px;
  background: rgba(173, 216, 230, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.disk-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.4));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.disk-usage {
  font-size: 11px;
  color: rgba(173, 216, 230, 0.9);
  font-weight: bold;
  min-width: 30px;
  text-align: right;
}
</style>