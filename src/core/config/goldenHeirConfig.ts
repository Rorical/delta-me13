// 黄金裔配置辅助函数
export const PATH_STARTING_INVENTORY: Record<string, Record<string, number>> = {
  "负世": { "shadow_essence": 2, "pain_crystal": 1 },
  "岁月": { "time_shard": 3, "memory_stone": 1 },
  "诡计": { "trick_scroll": 2, "charm_amulet": 1 },
  "死亡": { "soul_fragment": 2, "death_lily": 1 },
  "理性": { "logic_tome": 1, "analysis_crystal": 2 },
  "力量": { "power_rune": 2, "strength_potion": 1 },
  "智慧": { "wisdom_orb": 1, "knowledge_scroll": 3 },
  "正义": { "justice_seal": 1, "truth_gem": 2 },
  "混沌": { "chaos_fragment": 3, "storm_essence": 1 },
  "秩序": { "order_crystal": 2, "law_tablet": 1 },
  "创造": { "creation_seed": 2, "life_essence": 1 },
  "毁灭": { "destruction_core": 1, "void_crystal": 2 }
};

export const PATH_POWER_LEVELS: Record<string, number> = {
  "负世": 65,    // 白厄 - 憎恨强化
  "岁月": 70,    // 昔涟 - 时间掌控
  "诡计": 60,    // 赛飞儿 - 策略智慧
  "死亡": 75,    // 遐蝶 - 生死平衡
  "理性": 68,    // 思辨 - 逻辑分析
  "力量": 80,    // 刚烈 - 纯粹力量
  "智慧": 72,    // 慧心 - 深层理解
  "正义": 78,    // 正念 - 道德力量
  "混沌": 66,    // 天澜 - 不可预测
  "秩序": 74,    // 序章 - 规律掌控
  "创造": 69,    // 创生 - 生命之力
  "毁灭": 77     // 终结 - 破坏威能
};

// 根据路径获取黄金裔起始物品
export function getGoldenHeirStartingInventory(path: string): Record<string, number> {
  return PATH_STARTING_INVENTORY[path] || { "basic_gear": 1 };
}

// 根据路径获取黄金裔力量等级
export function getGoldenHeirPower(path: string): number {
  return PATH_POWER_LEVELS[path] || 60;
}

// 获取路径对应的特殊能力
export function getPathSpecialAbilities(path: string): string[] {
  const abilityMap: Record<string, string[]> = {
    "负世": ["暗影感知", "痛苦共鸣", "憎恨增幅"],
    "岁月": ["时间感知", "历史回溯", "预见未来"],
    "诡计": ["诡计策划", "魅惑诱导", "陷阱制作"],
    "死亡": ["死亡感知", "灵魂指引", "生死平衡"],
    "理性": ["逻辑推演", "谬误识别", "理性分析"],
    "力量": ["力量爆发", "战斗狂怒", "物理强化"],
    "智慧": ["深度思考", "知识融合", "智慧洞察"],
    "正义": ["正义审判", "道德感知", "保护光环"],
    "混沌": ["随机事件", "预测干扰", "秩序破坏"],
    "秩序": ["规律掌控", "秩序维护", "系统优化"],
    "创造": ["生命创造", "物质重构", "创新思维"],
    "毁灭": ["破坏威能", "终结力量", "虚无掌控"]
  };
  return abilityMap[path] || ["基础能力"];
}

// 获取路径的克制关系
export function getPathCounters(path: string): { strong_against: string[], weak_against: string[] } {
  const counterMap: Record<string, { strong_against: string[], weak_against: string[] }> = {
    "负世": { strong_against: ["正义", "秩序"], weak_against: ["岁月", "智慧"] },
    "岁月": { strong_against: ["混沌", "毁灭"], weak_against: ["理性", "死亡"] },
    "诡计": { strong_against: ["力量", "正义"], weak_against: ["智慧", "理性"] },
    "死亡": { strong_against: ["创造", "力量"], weak_against: ["岁月", "智慧"] },
    "理性": { strong_against: ["混沌", "诡计"], weak_against: ["创造", "死亡"] },
    "力量": { strong_against: ["毁灭", "混沌"], weak_against: ["诡计", "智慧"] },
    "智慧": { strong_against: ["负世", "诡计"], weak_against: ["力量", "正义"] },
    "正义": { strong_against: ["负世", "毁灭"], weak_against: ["诡计", "混沌"] },
    "混沌": { strong_against: ["秩序", "理性"], weak_against: ["力量", "岁月"] },
    "秩序": { strong_against: ["混沌", "毁灭"], weak_against: ["负世", "创造"] },
    "创造": { strong_against: ["毁灭", "死亡"], weak_against: ["理性", "秩序"] },
    "毁灭": { strong_against: ["创造", "秩序"], weak_against: ["正义", "岁月"] }
  };
  return counterMap[path] || { strong_against: [], weak_against: [] };
}