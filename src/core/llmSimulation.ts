import { EnvironmentAgent } from './agent/environment';
import { TitanAgent } from './agent/titan';
import { NpcAgent } from './agent/npc';
import { GoldenHeirAgent } from './agent/goldenHeir';
import { WorldAgent } from './agent/worldAgent';
import { getAllGoldenHeirProfiles } from './agent/goldenHeirProfiles';
import { getAgentStartingLocation, getGoldenHeirLocation } from './config/locationConfig';
import { generateRandomNPCs } from './config/npcSeeds';
import { getTitanStartingLocation, getTitanDomain, getTitanPower } from './config/titanLocationConfig';
import { getNPCHealthByRole, getNPCStartingInventory, type NPCRole } from './config/npcConfig';
import { getGoldenHeirStartingInventory, getGoldenHeirPower } from './config/goldenHeirConfig';
import type { OmphalosWorldState } from './omphalosWorldState';
import { createInitialOmphalosWorld } from './omphalosWorldState';
import { enhanceOmphalosWorld } from './config/omphalosInitializer';
import { TWELVE_TITANS } from './agent/titanProfiles';
import OpenAI from 'openai';

// Main simulation class that requires real OpenAI client
export class OmphalosSimulation {
  private environment: EnvironmentAgent;
  private agents: any[];
  private onUpdate?: (state: OmphalosWorldState) => void;

  constructor(client: OpenAI, config: { model?: string; temperature?: any } = {}) {
    const agentConfig = {
      model: config.model || 'gpt-4o',
      temperature: parseFloat(config.temperature ?? '0.7'),
      memory_max_tokens: 8192
    };

    // Create ALL 12 Golden Heirs - 逐火十二英雄
    const allGoldenHeirProfiles = getAllGoldenHeirProfiles();
    const goldenHeirs = allGoldenHeirProfiles.map((profile, index) => 
      new GoldenHeirAgent(`heir_${index + 1}`, profile, client, agentConfig)
    );
    
    // Create ALL 12 TITANS
    const allTitans = TWELVE_TITANS.map((titanProfile, index) => {
      return new TitanAgent(`titan${index + 1}`, titanProfile.name, titanProfile, client, agentConfig);
    });
    
    // Create base NPCs
    const baseMerchant = new NpcAgent("npc1", "商人伊拉拉", "MERCHANT", client, agentConfig);
    const baseGuard = new NpcAgent("npc2", "守卫马库斯", "GUARD", client, agentConfig);
    
    // Generate random NPCs using seed library
    const randomNPCData = generateRandomNPCs(8); // 生成8个随机NPC
    const randomNPCs = randomNPCData.map((npcData, index) => {
      return new NpcAgent(
        `random_npc_${index + 1}`, 
        npcData.name, 
        npcData.role as any, 
        client, 
        agentConfig
      );
    });

    this.agents = [
      ...allTitans,                    // 12 titans
      ...goldenHeirs,                  // 12 golden heirs (逐火十二英雄)
      baseMerchant, baseGuard,         // 2 base NPCs 
      ...randomNPCs                    // 8 random NPCs
    ];
    
    console.log(`🔥 逐火翁法罗斯初始化完成！共 ${this.agents.length} 个电信号：`);
    console.log(`  ⚔️  逐火十二英雄: ${goldenHeirs.length} (黄金裔)`);
    console.log(`  ⚡ 泰坦守护者: ${allTitans.length} (火种守护)`);
    console.log(`  👥 城邦居民: ${2 + randomNPCs.length} (${2} 基础 + ${randomNPCs.length} 随机)`);
    console.log(`  🌍 世界意志: 1 (世界事件管理)`);
    console.log(`  🌍 总电信号数: ${this.agents.length + 1}`);

    // Create initial Omphalos world state
    const initialWorldState = createInitialOmphalosWorld();
    
    // 填充代理状态到新世界状态
    // Golden Heirs
    goldenHeirs.forEach(heir => {
      initialWorldState.goldenHeirs[heir.id] = {
        name: heir.name,
        location: getGoldenHeirLocation(heir.profile.path),
        hp: 100,
        maxHp: 100,
        inventory: getGoldenHeirStartingInventory(heir.profile.path),
        allies: [],
        path: heir.profile.path,
        pathProgress: 0,
        embersCollected: 0,
        targetTitanId: heir.profile.titanTarget || '',
        power: getGoldenHeirPower(heir.profile.path),
        xp: 0,
        level: 1,
        specialAbilities: heir.profile.specialAbilities || [],
        pathMastery: 0,
        relationshipWithOthers: {},
        activeQuests: [],
        isActive: true,
        hasDiedOnce: false,
        corruptionResistance: 50,
        emberResonance: 0
      };
    });
    
    // Titans
    allTitans.forEach((titan, index) => {
      const titanProfile = TWELVE_TITANS[index];
      initialWorldState.titans[titan.id] = {
        name: titan.name,
        location: getTitanStartingLocation(titanProfile, index),
        hp: 200,
        maxHp: 200,
        inventory: {},
        allies: [],
        domain: getTitanDomain(titanProfile, index),
        domainPower: getTitanPower(titanProfile, index),
        emberGuarded: `ember_${index + 1}`,
        isEmberTaken: false,
        titlePower: titanProfile.title,
        elementalAffinity: titanProfile.element,
        awakening: 80,
        challengersDefeated: [],
        respectForChallengers: {}
      };
      
      // 添加火种到系统中
      initialWorldState.emberSystem.emberLocations[`ember_${index + 1}`] = {
        emberId: `ember_${index + 1}`,
        name: titanProfile.emberName,
        guardianTitanId: titan.id,
        isCollected: false,
        location: getTitanStartingLocation(titanProfile, index),
        power: getTitanPower(titanProfile, index) / 10,
        elementType: titanProfile.element
      };
    });
    
    // NPCs
    [baseMerchant, baseGuard, ...randomNPCs].forEach((npc, index) => {
      const isRandomNPC = index >= 2;
      const npcData = isRandomNPC ? randomNPCData[index - 2] : null;
      const role = isRandomNPC ? npcData?.role || 'MERCHANT' : (index === 0 ? 'MERCHANT' : 'GUARD');
      
      initialWorldState.npcs[npc.id] = {
        name: npc.name,
        location: getAgentStartingLocation(npc.id, index),
        hp: isRandomNPC ? getNPCHealthByRole(role as NPCRole) : (index === 0 ? 60 : 120),
        maxHp: isRandomNPC ? getNPCHealthByRole(role as NPCRole) : (index === 0 ? 60 : 120),
        inventory: isRandomNPC ? getNPCStartingInventory(role as NPCRole) : (index === 0 ? { "wood": 3, "stone": 2 } : {}),
        allies: [],
        role: role,
        occupation: role.toLowerCase(),
        loyalties: [],
        knownInformation: [],
        tradingGoods: {},
        isCorrupted: false,
        corruptionLevel: 0
      };
    });
    
    // 增强世界状态
    const enhancedWorldState = enhanceOmphalosWorld(initialWorldState);

    // Create World Agent with the actual world state
    const worldAgent = new WorldAgent('world_agent', '世界意志', client, enhancedWorldState, agentConfig);
    this.agents.push(worldAgent);

    this.environment = new EnvironmentAgent(enhancedWorldState, (state: OmphalosWorldState) => this.handleUpdate(state), client);
    
    // 设置代理日志回调
    this.environment.setupAgentLogging(this.agents);
  }

  private handleUpdate(state: OmphalosWorldState) {
    if (this.onUpdate) {
      this.onUpdate(state);
    }
  }

  async runSimulation(days: number, onUpdate?: (state: OmphalosWorldState) => void): Promise<OmphalosWorldState> {
    this.onUpdate = onUpdate;
    for (let day = 1; day <= days; day++) {
      await this.environment.runDailyCycle(this.agents);
      
      // The delay can now be smaller as updates are real-time
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.onUpdate = undefined; // Clean up
    return this.environment.getState();
  }

  getState(): OmphalosWorldState {
    return this.environment.getState();
  }

  getCommunicationService() {
    return this.environment.getCommunicationService();
  }
}