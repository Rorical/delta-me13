// 位置配置，用于替换硬编码的位置分配逻辑
export interface LocationConfig {
  defaultCities: string[];
  spawnStrategy: 'alternating' | 'random' | 'grouped' | 'specified';
  customPlacements?: Record<string, string>; // agentId -> cityId
}

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  defaultCities: ["city-of-dawn", "fortress-of-dusk"],
  spawnStrategy: 'alternating',
  customPlacements: {
    // 可以为特定代理指定位置
    "titan1": "city-of-dawn", // 克洛诺斯守护晨曦之城
    "npc1": "city-of-dawn",   // 商人在晨曦之城
    "npc2": "fortress-of-dusk" // 守卫在黄昏要塞
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
  "负世": "corrupted-plains", // 白厄应该在黑潮之地
  "岁月": "city-of-dawn",     // 昔涟在时间流逝的晨曦之城
  "诡计": "fortress-of-dusk", // 赛飞儿在战略要地
  "死亡": "cemetery-district", // 遐蝶在死者安息之地
  "理性": "academy-quarter"   // 思辨在学术区域
};

export function getGoldenHeirLocation(path: string): string {
  return GOLDEN_HEIR_LOCATIONS[path] || "city-of-dawn";
}