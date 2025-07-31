import { GoldenHeirProfile } from './goldenHeir';

// 黄金裔分布信息
export interface GoldenHeirLocation {
  goldenHeirName: string;
  currentLocation: string;
  alternativeLocations?: string[];  // 其他可能出现的地点
  associatedCities?: string[];      // 相关城邦
}

export const GOLDEN_HEIR_LOCATIONS: GoldenHeirLocation[] = [
  {
    goldenHeirName: '白厄',
    currentLocation: 'aiimi-grove',
    associatedCities: ['aiimi-grove']
  },
  {
    goldenHeirName: '昔涟', 
    currentLocation: 'aiimi-grove',
    associatedCities: ['aiimi-grove']
  },
  {
    goldenHeirName: '赛飞儿',
    currentLocation: 'dolos',
    associatedCities: ['dolos']
  },
  {
    goldenHeirName: '遐蝶',
    currentLocation: 'ailidiea',
    associatedCities: ['ailidiea']
  },
  {
    goldenHeirName: '思辨',
    currentLocation: 'shenwu-court',
    associatedCities: ['shenwu-court', 'edulia']
  },
  {
    goldenHeirName: '阿格莱雅',
    currentLocation: 'omphalos-heart',
    associatedCities: ['omphalos-heart']
  },
  {
    goldenHeirName: '缇宝',
    currentLocation: 'omphalos-heart',
    alternativeLocations: ['yanusapolis'],
    associatedCities: ['omphalos-heart', 'yanusapolis']
  },
  {
    goldenHeirName: '风堇',
    currentLocation: 'omphalos-heart',
    alternativeLocations: ['dusk-garden'],
    associatedCities: ['omphalos-heart', 'dusk-garden']
  },
  {
    goldenHeirName: '刻律德菈',
    currentLocation: 'omphalos-heart',
    associatedCities: ['omphalos-heart']
  },
  {
    goldenHeirName: '万敌',
    currentLocation: 'xuanfeng-city',
    associatedCities: ['xuanfeng-city']
  },
  {
    goldenHeirName: '那刻夏',
    currentLocation: 'shenwu-court',
    associatedCities: ['shenwu-court']
  },
  {
    goldenHeirName: '海瑟音',
    currentLocation: 'stykoxia',
    associatedCities: ['stykoxia']
  }
];

// 已知的5个黄金裔配置
export const KNOWN_GOLDEN_HEIRS: GoldenHeirProfile[] = [
  {
    codename: "NeiKos496",
    trueName: "白厄",
    path: "负世",
    primeDrive: "憎恨",
    titanTarget: "刻法勒",
    personality: "冷酷而充满怨恨，但内心深处渴望理解。对世界的黑暗面有着超常的洞察力，能够看穿他人隐藏的痛苦和恶意。",
    backstory: "曾经历过巨大的背叛和痛苦，因此选择了负世之路。白厄相信只有拥抱世界的黑暗面，才能真正理解存在的意义。",
    specialAbilities: ["暗影感知", "痛苦共鸣", "憎恨增幅", "负面情绪操控"]
  },
  {
    codename: "PhiLia093", 
    trueName: "昔涟",
    path: "岁月",
    primeDrive: "平和",
    titanTarget: "欧洛尼斯",
    personality: "温和而睿智，拥有超越年龄的成熟。能够以长远的眼光看待问题，不轻易被短期的得失困扰。",
    backstory: "天生具有感知时间流逝的能力，见证了无数兴衰起伏。昔涟深知万物皆有定时，追求在变迁中寻找永恒的平衡。",
    specialAbilities: ["时间感知", "历史回溯", "预见未来", "岁月沉淀"]
  },
  {
    codename: "OreXis945",
    trueName: "赛飞儿", 
    path: "诡计",
    primeDrive: "渴望",
    titanTarget: "扎格列斯",
    personality: "机智狡黠，充满魅力但难以捉摸。善于利用他人的弱点，总能在复杂的局势中找到对自己有利的角度。",
    backstory: "从小在诡谲的环境中长大，学会了用智慧和诡计生存。赛飞儿渴望获得真正的力量，不再需要依赖他人。",
    specialAbilities: ["诡计策划", "魅惑诱导", "陷阱制作", "机会洞察"]
  },
  {
    codename: "EpieiKeia216",
    trueName: "遐蝶",
    path: "死亡", 
    primeDrive: "平和",
    titanTarget: "塞纳托斯",
    personality: "超然物外，对生死有着深刻的理解。不恐惧死亡，也不过分执着于生命，追求在生与死之间找到真正的平静。",
    backstory: "掌管死亡的女神，她双手的触碰可以带走生命。遐蝶相信死亡是另一种形式的解脱和新生。",
    specialAbilities: ["死亡感知", "灵魂指引", "生死平衡", "安息赐予"]
  },
  {
    codename: "SkeMma720",
    trueName: "那刻夏",
    path: "理性",
    primeDrive: "批判", 
    titanTarget: "瑟希斯",
    personality: "逻辑严密，思维敏锐，对一切事物都抱有批判性的态度。不轻信任何观点，坚持用理性分析一切问题。",
    backstory: "天生的哲学家和思想家，从小就对世界的本质抱有强烈的好奇心。思辨相信只有通过不断的质疑和批判，才能接近真理。",
    specialAbilities: ["逻辑推演", "谬误识别", "理性分析", "批判思维"]
  }
];

// 剩余7个黄金裔的基础配置（待完善）
export const ADDITIONAL_GOLDEN_HEIRS: Partial<GoldenHeirProfile>[] = [
  {
    codename: "ForTis777",
    trueName: "万敌",
    path: "力量",
    primeDrive: "野心",
    titanTarget: "尼卡多利" // 天谴之矛
  },
  {
    codename: "SophiA444", 
    trueName: "提宝",
    path: "智慧",
    primeDrive: "探索",
    titanTarget: "雅努斯" // 万径之门
  },
  {
    codename: "JustiS333",
    trueName: "刻律德菈", 
    path: "正义",
    primeDrive: "保护",
    titanTarget: "塔兰顿" // 公正之秤
  },
  {
    codename: "Sky666",
    trueName: "海瑟音",
    path: "混沌",
    primeDrive: "希望",
    titanTarget: "艾格勒"
  },
  {
    codename: "OrdO111",
    trueName: "大地兽",
    path: "秩序",
    primeDrive: "统治", 
    titanTarget: "吉奥里亚" // 磐岩之脊
  },
  {
    codename: "CreA888",
    trueName: "海瑟音",
    path: "创造",
    primeDrive: "希望",
    titanTarget: "法吉娜" // 满溢之杯
  },
  {
    codename: "DesTroy999",
    trueName: "阿格莱亚",
    path: "浪漫", 
    primeDrive: "守护",
    titanTarget: "墨涅塔" // 黄金之茧
  }
];

export function getAllGoldenHeirProfiles(): GoldenHeirProfile[] {
  // 将已知的完整配置与待完善的配置合并
  const completeAdditional: GoldenHeirProfile[] = ADDITIONAL_GOLDEN_HEIRS.map(partial => ({
    codename: partial.codename || "Unknown",
    trueName: partial.trueName || "未命名",
    path: partial.path || "力量",
    primeDrive: partial.primeDrive || "希望", 
    titanTarget: partial.titanTarget,
    personality: partial.personality || "待定义的性格特征",
    backstory: partial.backstory || "待完善的背景故事",
    specialAbilities: partial.specialAbilities || ["待定义能力"]
  }));

  return [...KNOWN_GOLDEN_HEIRS, ...completeAdditional];
}

// 根据真名查找黄金裔位置
export function getGoldenHeirLocation(trueName: string): GoldenHeirLocation | null {
  return GOLDEN_HEIR_LOCATIONS.find(location => location.goldenHeirName === trueName) || null;
}

// 根据位置查找该地的黄金裔
export function getGoldenHeirsAtLocation(locationId: string): GoldenHeirLocation[] {
  return GOLDEN_HEIR_LOCATIONS.filter(location => 
    location.currentLocation === locationId || 
    location.alternativeLocations?.includes(locationId) ||
    location.associatedCities?.includes(locationId)
  );
}

// 获取已知黄金裔的代号到真名映射
export function getKnownGoldenHeirNameMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  KNOWN_GOLDEN_HEIRS.forEach(heir => {
    mapping[heir.codename] = heir.trueName;
  });
  ADDITIONAL_GOLDEN_HEIRS.forEach(heir => {
    if (heir.codename && heir.trueName) {
      mapping[heir.codename] = heir.trueName;
    }
  });
  return mapping;
}