// 位置配置，用于替换硬编码的位置分配逻辑
export interface LocationConfig {
  defaultCities: string[];
  spawnStrategy: 'alternating' | 'random' | 'grouped' | 'specified';
  customPlacements?: Record<string, string>; // agentId -> cityId
}

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  defaultCities: ["奥赫玛", "悬锋城"],
  spawnStrategy: 'alternating',
  customPlacements: {
    // 可以为特定代理指定位置
    "titan1": "奥赫玛", // 克洛诺斯守护奥赫玛
    "npc1": "奥赫玛",   // 商人在奥赫玛
    "npc2": "悬锋城"    // 守卫在悬锋城
  }
};

export function getAgentStartingLocation(
  agentId: string, 
  agentIndex: number, 
  config: LocationConfig = DEFAULT_LOCATION_CONFIG
): string {
  // 优先使用自定义位置
  if (config.customPlacements && config.customPlacements[agentId]) {
    return config.customPlacements[agentId];
  }

  // 根据策略分配位置
  switch (config.spawnStrategy) {
    case 'alternating':
      return config.defaultCities[agentIndex % config.defaultCities.length];
    
    case 'random':
      return config.defaultCities[Math.floor(Math.random() * config.defaultCities.length)];
    
    case 'grouped':
      // 前半分在第一个城市，后半分在第二个城市
      const midpoint = Math.ceil(agentIndex / 2);
      const cityIndex = agentIndex < midpoint ? 0 : 1;
      return config.defaultCities[cityIndex] || config.defaultCities[0];
    
    case 'specified':
      // 需要在customPlacements中指定所有位置
      return config.defaultCities[0]; // 回退到第一个城市
    
    default:
      return config.defaultCities[0];
  }
}

// 黄金裔特殊位置配置 - 根据路径分配
export const GOLDEN_HEIR_LOCATIONS: Record<string, string> = {
  "负世": "哀地里亚",     // 白厄应该在黑潮之地
  "岁月": "奥赫玛",       // 昔涟在时间流逝的奥赫玛
  "诡计": "悬锋城",       // 赛飞儿在战略要地
  "死亡": "斯缇科西亚",   // 遐蝶在死者安息之地
  "理性": "神悟树庭"      // 思辨在学术区域
};

export function getGoldenHeirLocation(path: string): string {
  return GOLDEN_HEIR_LOCATIONS[path] || "奥赫玛";
}