import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FileData {
  name: string
  content: string
}

export interface FolderData {
  name: string
  icon: string
  files: FileData[]
}

export const useAppStore = defineStore('app', () => {
  // State
  const progress = ref(0)
  const selectedFolder = ref(0)
  const selectedFile = ref(0)

  // Static data
  const folders: FolderData[] = [
    { 
      name: '基础资料',
      icon: 'Database',
      files: [
        { name: '权杖δ-me13', content: `权杖δ-me13，星体计算机。模拟世界「翁法罗斯」基于此载体运行，并不断循环。
有别于其他权杖，曾作为「智识」博识尊的天体神经元存在。后被废弃。
于漫长的演算中受「毁灭」瞥视，升格为绝灭大君「铁墓」。` },
        { name: '来古士', content: '是个纸张' },
        { name: '铁幕', content: '于漫长的演算中踏上「毁灭」，由权杖-me13升格的绝灭大君银河间的铁墓并非单一实体，而是权杖散布的「毁灭」方程式副本。「铁墓」这一代号由星际和平公司提出，后被来古士采用。' }
      ]
    },
    { 
      name: '算法逻辑',
      icon: 'Settings',
      files: [
        { name: '核心算法', content: `检测到当前运行核心算法为「翁法罗斯」，由权杖δ-me13演算。
「翁法罗斯」为大型模拟世界，你可以把它想象成一个巨大的RPG游戏，其中由代理人和NPC们。
然而，复刻完整的权杖和世界难如登天。权杖δ-me13本身蕴含着极高的复杂性，其内部结构和运行机制远超常规计算设备的承载能力。为了尽可能还原翁法罗斯世界的运行进程，[已删除]采用了先进的矩阵计算加速系统（俗称GPU），以提升大规模并行计算的效率。同时，结合大世界模型注意力压缩方法（即LLM），实现了对庞大世界状态和多样化角色行为的高效建模与推理。
在此基础上，系统搭建了一个多代理互动系统（Multi-Agent），每个代理代表世界中的一个独立智能体，能够自主决策、协作或对抗。通过这些技术的协同作用，翁法罗斯的复杂生态与动态演化得以在有限的算力资源下被逼真地模拟和展现，为研究者提供了近乎真实的虚拟实验环境。
// 该系统采用多电信号（Multi-Agent）架构，每个电信号（Agent）代表翁法罗斯世界中的一个智能体（如黄金裔、泰坦、NPC等），能够基于世界状态自主决策。电信号的决策逻辑由大语言模型（LLM）驱动，结合记忆系统（Memory）实现上下文感知和长期推理。系统通过周期性地收集世界状态（OmphalosWorldState），为每个电信号生成决策提示（Prompt），并解析模型返回的JSON行动数组，驱动世界演化。各类电信号的决策提示模板、可用行动集和动机描述均存储于文件，便于多语言支持和灵活扩展。核心流程包括：
// 1. 收集世界状态与电信号记忆
// 2. 生成决策提示（Prompt），从文件读取模板
// 3. 调用OpenAI等LLM服务，获取行动建议
// 4. 解析并执行行动，更新世界状态
// 5. 记录决策过程与结果，供后续记忆与分析


` },
        { name: '优化协议', content: '系统性能优化方案，包含内存管理和处理速度提升策略。' },
        { name: '错误处理', content: '异常情况处理机制，确保系统在各种条件下的稳定运行。' }
      ]
    },
    { 
      name: '保护措施',
      icon: 'Shield',
      files: [
        { name: '安全协议', content: '多层次安全防护体系，包含访问控制和数据加密机制。' },
        { name: '备份系统', content: '自动化数据备份方案，确保关键信息的安全存储和快速恢复。' },
        { name: '监控预警', content: '实时系统监控和异常预警机制，提供24小时不间断的安全保障。' }
      ]
    },
    { 
      name: '实验归档',
      icon: 'Archive',
      files: [
        { name: '实验日志001', content: '第一阶段实验记录，包含初始测试数据和观察结果分析。' },
        { name: '测试报告', content: '综合性能测试报告，涵盖功能性、稳定性和兼容性测试结果。' },
        { name: '结果分析', content: '实验数据深度分析报告，提供改进建议和未来发展方向。' }
      ]
    },
        {
      name: '控制台',
      icon: 'Code',
      files: [
        { name: '系统状态', content: '实时系统运行状态监控，包括CPU使用率、内存占用、网络连接等关键指标。' },
        { name: '操作日志', content: '用户操作记录和系统事件日志，提供完整的操作追踪和审计功能。' },
        { name: '调试工具', content: '高级调试和诊断工具集，支持系统性能分析和问题排查。' }
      ]
    },
    {
      name: '再创世',
      icon: 'Zap',
      files: [
        { name: '交互协议', content: '交互协议，用于与再创世进行交互。' },
        { name: '原初动力', content: '原初动力，用于驱动再创世。' },
        { name: '因果矩阵', content: '因果矩阵，用于控制再创世。' }
      ]
    }
  ]

  // Computed
  const currentFiles = computed(() => folders[selectedFolder.value].files)
  const selectedFileContent = computed(() => currentFiles.value[selectedFile.value].content)

  // Actions
  const selectFolder = (index: number) => {
    selectedFolder.value = index
    selectedFile.value = 0
  }

  const selectFile = (index: number) => {
    selectedFile.value = index
  }

  const animateProgress = () => {
    const targetProgress = 85
    const duration = 3000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      progress.value = targetProgress * progressRatio
      
      if (progressRatio < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }

  return {
    // State
    progress,
    selectedFolder,
    selectedFile,
    folders,
    
    // Computed
    currentFiles,
    selectedFileContent,
    
    // Actions
    selectFolder,
    selectFile,
    animateProgress
  }
}) 