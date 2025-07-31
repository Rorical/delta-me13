// 十二泰坦的完整定义和特性
export interface TitanProfile {
  id: string;
  name: string;           // 泰坦名称
  title: string;          // 称号 (如 "万径之门")
  domain: string;         // 统治领域
  element: string;        // 元素属性
  personality: string;    // 性格特征
  backstory: string;      // 背景故事
  powers: string[];       // 特殊能力
  weakness?: string;      // 弱点
  emberName: string;      // 火种名称
  opposingPath?: string;  // 对应的黄金裔路径
  // 新增字段
  currentLocation?: string;        // 当前所在位置
  guardedCities?: string[];        // 守护的城邦
  currentState?: 'active' | 'dormant' | 'corrupted' | 'awakening' | 'defeated' | 'sealed';
  awakenLevel?: number;            // 觉醒等级 (0-100)
  relationshipWithGoldenHeirs?: Record<string, number>; // 与黄金裔的关系(-100到100)
  followers?: string[];            // 信徒和追随者
  sacredSites?: string[];          // 神圣地点
  // 新增：战斗系统相关
  combatStats?: {
    attackPower: number;
    defenseRating: number;
    magicPower: number;
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
  };
}

export const TWELVE_TITANS: TitanProfile[] = [
  {
    id: "janus",
    name: "雅努斯",
    title: "万径之门",
    domain: "门户与通道",
    element: "空间",
    personality: "神秘而具有双重性，能同时看到过去和未来。喜欢观察而非直接干预，但掌握着世界间的所有通道。",
    backstory: "作为最古老的泰坦之一，雅努斯见证了翁法罗斯的诞生与毁灭循环。他掌管着连接不同世界、时间和空间的门户，是再创世的关键守护者。",
    powers: ["空间传送", "门户创造", "时空感知", "维度控制"],
    weakness: "无法同时关注所有门户，容易被分散注意力",
    emberName: "通途之火",
    opposingPath: "智慧",
    currentLocation: "yanusapolis",
    guardedCities: ["yanusapolis"],
    currentState: "dormant",
    awakenLevel: 60,
    relationshipWithGoldenHeirs: {
      "缇宝": 20,
      "慧心": 40
    },
    followers: ["命运三泰坦信徒", "朝圣者"],
    sacredSites: ["万径之门", "命运三相殿", "门径终处"]
  },
  {
    id: "talanton", 
    name: "塔兰顿",
    title: "公正之秤",
    domain: "正义与审判",
    element: "平衡",
    personality: "绝对公正，不偏不倚，但有时过于严苛。相信一切都有代价，绝不容忍不公。",
    backstory: "塔兰顿曾是诸神的首席审判官，负责维持宇宙的道德秩序。他的秤能衡量一切生灵的善恶，是最后审判的执行者。",
    powers: ["审判之眼", "业力感知", "正义之锤", "道德束缚"],
    weakness: "过于拘泥于规则，可能被善意的欺骗所迷惑",
    emberName: "正义之火",
    opposingPath: "正义",
    currentLocation: "omphalos-heart",
    guardedCities: ["omphalos-heart"],
    currentState: "active",
    awakenLevel: 85,
    relationshipWithGoldenHeirs: {
      "正念": 70,
      "思辨": 30
    },
    followers: ["正义之秤信徒", "法官", "执法者"],
    sacredSites: ["公正法庭", "审判之殿"]
  },
  {
    id: "ourolonis",
    name: "欧洛尼斯", 
    title: "永夜之帷",
    domain: "黑暗与死亡",
    element: "阴影",
    personality: "深沉而充满智慧，理解死亡的必要性。虽然掌管黑暗，但并非邪恶，而是生命循环的守护者。",
    backstory: "欧洛尼斯是死亡的温柔引导者，帮助灵魂从生者的世界过渡到死者的国度。她的永夜之帷为那些疲惫的灵魂提供最终的安息。",
    powers: ["死亡凝视", "灵魂引导", "暗影操控", "生命吸取"],
    weakness: "对生命有深深的眷恋，难以真正伤害无辜者",
    emberName: "安息之火", 
    opposingPath: "死亡",
    currentLocation: "ailidiea",
    guardedCities: ["ailidiea", "stykoxia"],
    currentState: "active",
    awakenLevel: 75,
    relationshipWithGoldenHeirs: {
      "遐蝶": 80,
      "白厄": 35
    },
    followers: ["岁月神殿信徒", "引魂师", "死者守护者"],
    sacredSites: ["永夜之帷", "岁月神殿", "安息圣地"]
  },
  {
    id: "giorgia",
    name: "吉奥里亚",
    title: "磐岩之脊",  
    domain: "大地与坚固",
    element: "土",
    personality: "稳重如山，极具耐心，但一旦愤怒便如地震般可怕。视自己为世界的根基和守护者。",
    backstory: "吉奥里亚是大地的化身，翁法罗斯的每一寸土地都与她相连。她的脊梁撑起了整个世界，她的怒火能引发毁灭性的地震。",
    powers: ["地震控制", "岩石塑形", "大地感知", "重力操控"],
    weakness: "行动缓慢，难以应对快速变化的情况",
    emberName: "稳固之火",
    opposingPath: "秩序"
  },
  {
    id: "fagina",
    name: "法吉娜", 
    title: "满溢之杯",
    domain: "丰饶与生命",
    element: "水",
    personality: "慷慨而富有同情心，渴望看到生命繁荣。但过度的给予有时会导致失衡和腐败。",
    backstory: "法吉娜掌管着生命的源泉，她的杯子永远满溢着生命之水。她是所有生灵的母亲，但她的过度眷顾有时会带来意想不到的后果。",
    powers: ["生命治愈", "丰饶赐福", "水元素控制", "再生能力"],
    weakness: "无法拒绝求助者，容易被利用",
    emberName: "繁荣之火",
    opposingPath: "创造"
  },
  {
    id: "aigle",
    name: "艾格勒",
    title: "晨昏之眼", 
    domain: "时间与预言",
    element: "光",
    personality: "具有超越时间的视野，能看到所有可能的未来。常显得忧郁，因为她知道所有悲剧的不可避免。",
    backstory: "艾格勒是时间的见证者，她的眼睛能看穿过去、现在和未来的迷雾。她曾尝试改变预见的悲剧，但学会了接受命运的必然性。",
    powers: ["预知未来", "时间暂停", "光辉审视", "命运洞察"],
    weakness: "被未来的知识所困扰，有时会消极等待",
    emberName: "时光之火",
    opposingPath: "岁月"
  },
  {
    id: "cephalos",
    name: "刻法勒", 
    title: "全世之座",
    domain: "统治与秩序",
    element: "威权",
    personality: "绝对的统治者，相信秩序胜过一切。冷酷而高效，但有着深沉的责任感。",
    backstory: "刻法勒曾是诸神之王，建立了完美的等级制度。他的统治虽然严苛，但带来了空前的繁荣和稳定。他视混乱为最大的敌人。",
    powers: ["威权统治", "秩序之力", "精神控制", "组织协调"],
    weakness: "过于依赖规则，面对真正的混乱时会手足无措",
    emberName: "统御之火",
    opposingPath: "理性",
    currentLocation: "omphalos-heart",
    guardedCities: ["omphalos-heart", "dawn-cliff"],
    currentState: "active",
    awakenLevel: 95,
    relationshipWithGoldenHeirs: {
      "阿格莱雅": 60,
      "缇宝": 50,
      "风堇": 45,
      "刻律德菈": 65,
      "思辨": -20
    },
    followers: ["负世之泰坦信徒", "元老院", "半神议院祭司"],
    sacredSites: ["全世之座", "刻法勒广场", "半神议院", "负世泰坦觐见处"]
  },
  {
    id: "ceresis",
    name: "瑟希斯", 
    title: "裂分之枝",
    domain: "分裂与选择",
    element: "分歧",
    personality: "多变而不可预测，体现了所有可能性的分支。既可以是创造者也可以是毁灭者。",
    backstory: "瑟希斯代表着每个决定点的分叉，每个选择创造的新可能性。她的存在提醒人们，任何决定都会导向不同的命运分支。",
    powers: ["现实分裂", "可能性操控", "选择强制", "命运分流"],
    weakness: "自身也被分裂困扰，难以做出决定性的行动",
    emberName: "分歧之火",
    opposingPath: "混沌"
  },
  {
    id: "moneta",
    name: "墨涅塔", 
    title: "黄金之茧",
    domain: "蜕变与重生",
    element: "变化",
    personality: "温和而神秘，深信破坏是重生的前提。总是在计划着下一次蜕变。",
    backstory: "墨涅塔掌管着所有的转变和重生。她的茧孕育着新的可能性，每一次蜕变都是一次死亡与重生的完美结合。",
    powers: ["形态变化", "重生赐予", "进化加速", "蜕变庇护"],
    weakness: "变化过程中会有脆弱期，容易被突袭",
    emberName: "蜕变之火",
    opposingPath: "毁灭"
  },
  {
    id: "nicatori",
    name: "尼卡多利", 
    title: "天谴之矛",
    domain: "战争与毁灭",
    element: "雷电",
    personality: "好战而荣耀至上，相信只有通过战斗才能证明价值。虽然暴力，但有自己的荣誉准则。",
    backstory: "尼卡多利是战争的化身，他的矛能穿透任何防御。他相信弱者应该被淘汰，只有最强者才配生存，但他尊重勇敢的对手。",
    powers: ["雷电控制", "战争掌控", "毁灭打击", "战斗狂热"],
    weakness: "过于直接，容易被计谋所困",
    emberName: "征战之火",
    opposingPath: "力量"
  },
  {
    id: "senatos",
    name: "塞纳托斯", 
    title: "灰黯之手",
    domain: "绝望与虚无",
    element: "虚无",
    personality: "深沉而悲观，被绝望所困扰。但正是因为理解绝望，所以能够给予真正的同情。",
    backstory: "塞纳托斯是负面情绪的集合体，承载着世界的所有痛苦和绝望。他的存在提醒人们珍惜光明，因为他深知黑暗的可怕。",
    powers: ["绝望传播", "虚无创造", "意志摧毁", "希望湮灭"],
    weakness: "被自身的绝望所困，难以采取积极行动",
    emberName: "虚无之火", 
    opposingPath: "负世"
  },
  {
    id: "zagreus",
    name: "扎格列斯", 
    title: "翻飞之币",
    domain: "机运与变数",
    element: "随机",
    personality: "变化无常，充满好奇心。喜欢制造意外和惊喜，是最不可预测的泰坦。",
    backstory: "扎格列斯代表着所有的偶然性和随机性。他的硬币决定着无数的巧合和意外，是命运女神都无法完全掌控的存在。",
    powers: ["运气操控", "随机性支配", "概率扭曲", "巧合制造"],
    weakness: "无法完全控制自己的能力，有时会自食其果",
    emberName: "机缘之火",
    opposingPath: "诡计"
  }
];

// 获取特定泰坦配置文件
export function getTitanProfile(id: string): TitanProfile | null {
  return TWELVE_TITANS.find(titan => titan.id === id || titan.name === id) || null;
}

export function getTitanByName(name: string): TitanProfile | undefined {
  return TWELVE_TITANS.find(titan => titan.name === name || titan.id === name);
}

export function getTitanByPath(path: string): TitanProfile | undefined {
  return TWELVE_TITANS.find(titan => titan.opposingPath === path);
}

export function getAllTitanEmbers(): string[] {
  return TWELVE_TITANS.map(titan => titan.emberName);
}
