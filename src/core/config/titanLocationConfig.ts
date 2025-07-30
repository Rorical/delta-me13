// 泰坦位置和领域配置
import type { TitanProfile } from '../agent/titanProfiles';

// 泰坦起始位置映射
const TITAN_STARTING_LOCATIONS = [
  "city-of-dawn",        // 雅努斯 - 万径之门
  "fortress-of-dusk",    // 塔兰顿 - 公正之秤
  "corrupted-plains",    // 欧洛尼斯 - 永夜之帷
  "mystic-grove",        // 伊瑞丝 - 彩虹桥梁
  "crystal-caverns",     // 克洛诺斯 - 时间沙漏
  "storm-peaks",         // 忒弥斯 - 自然律法
  "sunken-depths",       // 姬亚 - 大地母亲
  "floating-isle",       // 乌拉诺斯 - 苍穹之主
  "ember-forges",        // 赫斯提亚 - 圣火之心
  "shadow-realm",        // 厄瑞布斯 - 原始黑暗
  "ocean-throne",        // 俄刻阿诺斯 - 环流之王
  "fate-crossroads"      // 阿南刻 - 必然命运
];

// 泰坦领域映射
const TITAN_DOMAINS = [
  "dimensional-gates",   // 雅努斯的门户领域
  "justice-courts",      // 塔兰顿的审判领域  
  "death-realm",         // 欧洛尼斯的死亡领域
  "rainbow-bridge",      // 伊瑞丝的彩虹领域
  "temporal-nexus",      // 克洛诺斯的时间领域
  "natural-law",         // 忒弥斯的自然领域
  "earth-core",          // 姬亚的大地领域
  "sky-domain",          // 乌拉诺斯的天空领域
  "sacred-flames",       // 赫斯提亚的火焰领域
  "primordial-void",     // 厄瑞布斯的黑暗领域
  "oceanic-currents",    // 俄刻阿诺斯的海洋领域
  "destiny-threads"      // 阿南刻的命运领域
];

// 泰坦力量等级
const TITAN_POWER_LEVELS = [
  120,  // 雅努斯 - 门户掌控者，力量强大
  110,  // 塔兰顿 - 审判之神，力量很强
  90,   // 欧洛尼斯 - 在黑潮之地，力量受限
  100,  // 伊瑞丝 - 信息传递者，中等力量
  130,  // 克洛诺斯 - 时间之主，最强力量
  105,  // 忒弥斯 - 自然法则，强力
  115,  // 姬亚 - 大地母亲，极强力量
  125,  // 乌拉诺斯 - 天空之主，强力统治
  95,   // 赫斯提亚 - 圣火守护，中等偏上
  85,   // 厄瑞布斯 - 原始黑暗，力量古老但受限
  110,  // 俄刻阿诺斯 - 海洋之王，强力
  135   // 阿南刻 - 命运主宰，至高力量
];

export function getTitanStartingLocation(_titanProfile: TitanProfile, index: number): string {
  return TITAN_STARTING_LOCATIONS[index] || "unknown-realm";
}

export function getTitanDomain(_titanProfile: TitanProfile, index: number): string {
  return TITAN_DOMAINS[index] || "unknown-domain";
}

export function getTitanPower(_titanProfile: TitanProfile, index: number): number {
  return TITAN_POWER_LEVELS[index] || 100;
}

// 获取所有泰坦位置列表
export function getAllTitanLocations(): string[] {
  return [...TITAN_STARTING_LOCATIONS];
}

// 根据泰坦ID获取配置
export function getTitanConfigById(titanId: string): { location: string; domain: string; power: number } | null {
  const index = parseInt(titanId.replace('titan', '')) - 1;
  if (index >= 0 && index < TITAN_STARTING_LOCATIONS.length) {
    return {
      location: TITAN_STARTING_LOCATIONS[index],
      domain: TITAN_DOMAINS[index], 
      power: TITAN_POWER_LEVELS[index]
    };
  }
  return null;
}