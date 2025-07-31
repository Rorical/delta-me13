// NPC配置辅助函数
export type NPCRole = 'MERCHANT' | 'GUARD' | 'SCHOLAR' | 'CRAFTSMAN';

// 根据NPC角色获取初始血量
export function getNPCHealthByRole(role: NPCRole): number {
  const healthMap = {
    'MERCHANT': 60,   // 商人体质一般
    'GUARD': 120,     // 守卫体质强壮
    'SCHOLAR': 50,    // 学者体质较弱
    'CRAFTSMAN': 80   // 工匠体质中等偏上
  };
  return healthMap[role] || 60;
}

// 根据NPC角色获取攻击力
export function getNPCPowerByRole(role: NPCRole): number {
  const powerMap = {
    'MERCHANT': 8,    // 商人攻击力较低
    'GUARD': 20,      // 守卫攻击力较高
    'SCHOLAR': 5,     // 学者攻击力最低
    'CRAFTSMAN': 12   // 工匠攻击力中等
  };
  return powerMap[role] || 8;
}

// 根据NPC角色获取初始物品
export function getNPCStartingInventory(role: NPCRole): Record<string, number> {
  const inventoryMap = {
    'MERCHANT': { "wood": 3, "stone": 2, "coins": 50 },
    'GUARD': { "stone": 5, "iron": 2 },
    'SCHOLAR': { "mana_crystal": 3, "scroll": 2 },
    'CRAFTSMAN': { "wood": 4, "stone": 3, "iron": 1 }
  };
  return inventoryMap[role] || {};
}

// 根据NPC角色获取偏好位置类型
export function getNPCPreferredLocationType(role: NPCRole): string[] {
  const locationPreferenceMap = {
    'MERCHANT': ["city-of-dawn", "fortress-of-dusk", "trading-post"],
    'GUARD': ["fortress-of-dusk", "watchtower", "city-of-dawn"],
    'SCHOLAR': ["ancient-library", "mystic-grove", "crystal-caverns"],
    'CRAFTSMAN': ["ember-forges", "city-of-dawn", "mountain-workshop"]
  };
  return locationPreferenceMap[role] || ["city-of-dawn"];
}

// 生成NPC的特殊技能
export function getNPCSpecialSkills(role: NPCRole): string[] {
  const skillsMap = {
    'MERCHANT': ["Trading", "Appraisal", "Negotiation", "Market Analysis"],
    'GUARD': ["Combat", "Patrol", "Threat Assessment", "Crowd Control"],
    'SCHOLAR': ["Research", "Ancient Languages", "Magic Theory", "Lore Keeping"],
    'CRAFTSMAN': ["Smithing", "Woodworking", "Engineering", "Material Science"]
  };
  return skillsMap[role] || [];
}