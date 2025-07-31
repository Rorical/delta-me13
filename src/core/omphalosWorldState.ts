// 翁法罗斯世界状态 - 完整的逐火之旅世界建模
import { Equipment } from './agent/base';

export interface OmphalosWorldState {
  // === 时间与纪元 ===
  day: number;
  era: number;                      // 当前纪元（每次再创世+1）
  cyclesSinceCreation: number;      // 自最初创世以来的循环数
  timeOfDay: 'dawn' | 'noon' | 'dusk' | 'midnight';
  season: 'spring' | 'summer' | 'autumn' | 'winter';

  // === 翁法罗斯城邦系统 ===
  cityStates: Record<string, CityState>;
  
  // === 火种系统 ===
  emberSystem: EmberSystem;
  
  // === 黑潮威胁 ===
  darkTide: DarkTideSystem;
  
  // === 代理状态 ===
  goldenHeirs: Record<string, GoldenHeirStatus>;
  titans: Record<string, TitanStatus>;
  npcs: Record<string, NPCStatus>;
  
  // === 全局事件 ===
  activeEvents: WorldEvent[];
  completedQuests: Quest[];
  
  // === 环境与资源 ===
  globalResources: GlobalResources;
  tradingPosts: Record<string, TradingPost>;
  
  // === 系统日志 ===
  logs: WorldLog[];
  
  // === 特殊状态 ===
  isRecreationPending: boolean;     // 是否准备再创世
  worldStability: number;           // 世界稳定度 (0-100)
  magicLevel: number;               // 魔法浓度 (0-100)
}

// === 城邦系统 ===
export interface CityState {
  id: string;
  name: string;
  type: 'capital' | 'fortress' | 'trading' | 'mystical' | 'corrupted' | 'titan_realm' | 'ruins' | 'floating' | 'sacred_site' | 'academy' | 'necropolis' | 'village' | 'religious';
  population: number;
  prosperity: number;               // 繁荣度 (0-100)
  defenses: CityDefenses;
  resources: CityResources;
  controllingFaction?: 'golden_heirs' | 'titans' | 'neutral' | 'corrupted' | 'undead' | 'sky_dwellers';
  specialFeatures: string[];        // 特殊建筑或特性
  connectedCities: string[];        // 连接的其他城市
  darkTideInfluence: number;        // 黑潮影响 (0-100)
  // 新增字段
  guardianTitan?: string;           // 守护泰坦
  currentState?: 'thriving' | 'declining' | 'ruined' | 'corrupted' | 'abandoned' | 'floating' | 'sealed';
  versionStates?: Record<string, CityVersionState>; // 不同版本状态
  districts?: District[];           // 城区划分
  goldenHeirsPresent?: string[];    // 当前的黄金裔
}

export interface CityDefenses {
  walls: number;
  watchtowers: number;
  guardPosts: number;
  magicalWards: number;
  totalDefenseRating: number;
}

export interface CityResources {
  food: number;
  materials: number;
  wealth: number;
  mana: number;
  rareElements: Record<string, number>;
}

// === 城邦版本状态 ===
export interface CityVersionState {
  version: string;                  // 版本标识 (如 "3.0", "3.3")
  name: string;                     // 该版本下的名称
  description: string;              // 版本描述
  population: number;
  prosperity: number;
  specialFeatures: string[];
  accessibleDistricts: string[];   // 可访问的区域
}

// === 城区系统 ===
export interface District {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'religious' | 'military' | 'academy' | 'ruins' | 'underground' | 'special';
  description: string;
  accessibility: 'open' | 'restricted' | 'sealed' | 'corrupted';
  notableFeatures: string[];
  npcsPresent?: string[];
  itemsAvailable?: string[];
}

// === 火种系统 ===
export interface EmberSystem {
  totalEmbers: number;              // 总火种数（12）
  collectedEmbers: number;          // 已收集火种数
  emberLocations: Record<string, EmberStatus>;
  emberPower: number;               // 火种总力量
  recreationProgress: number;       // 再创世进度 (0-100)
}

export interface EmberStatus {
  emberId: string;
  name: string;                     // 火种名称（如"通途之火"）
  guardianTitanId: string;          // 守护泰坦ID
  isCollected: boolean;
  collectorId?: string;             // 收集者ID（黄金裔）
  location: string;                 // 当前位置
  power: number;                    // 火种力量
  elementType: string;              // 元素类型
}

// === 黑潮系统 ===
export interface DarkTideSystem {
  currentIntensity: number;         // 当前强度 (0-100)
  corruptedAreas: Record<string, CorruptedArea>;
  tideEvents: DarkTideEvent[];
  resistancePoints: Record<string, ResistancePoint>;
  globalCorruption: number;         // 全球黑潮程度
  nextSurgeTime: number;            // 下次爆发时间
}

export interface CorruptedArea {
  areaId: string;
  name: string;
  corruptionLevel: number;          // 黑潮程度 (0-100)
  corruptionType: string;
  affectedCities: string[];
  monsters: CorruptedEntity[];
  isExpanding: boolean;
}

export interface CorruptedEntity {
  id: string;
  name: string;
  type: string;
  power: number;
  location: string;
  abilities: string[];
}

export interface DarkTideEvent {
  eventId: string;
  type: 'surge' | 'corruption_spread' | 'monster_spawn' | 'area_lost';
  severity: string;
  affectedAreas: string[];
  startTime: number;
  duration: number;
  isActive: boolean;
}

export interface ResistancePoint {
  pointId: string;
  name: string;
  location: string;
  strength: number;                 // 抵抗强度
  guardians: string[];              // 守护者ID列表
  isActive: boolean;
}

// === 黄金裔状态 ===
export interface GoldenHeirStatus {
  name: string;
  // 基础状态
  location: string;
  hp: number;
  maxHp: number;
  inventory: Record<string, number>;
  allies: string[];
  
  // 逐火之旅相关
  path: string;                     // 所走路径
  pathProgress: number;             // 路径进度 (0-100)
  embersCollected: number;
  targetTitanId: string;            // 目标泰坦
  
  // 能力与状态
  power: number;
  xp: number;
  level: number;
  specialAbilities: string[];
  pathMastery: number;              // 路径掌握度 (0-100)
  
  // 关系与联盟
  relationshipWithOthers: Record<string, number>; // -100到100的关系值
  activeQuests: string[];
  
  // 特殊状态
  isActive: boolean;                // 是否仍在逐火之旅中
  hasDiedOnce: boolean;             // 是否已经死过一次
  corruptionResistance: number;     // 黑潮抗性
  emberResonance: number;           // 火种共鸣
  
  // 新增：战斗系统相关
  defenseRating?: number;           // 防御力
  attackPower?: number;             // 攻击力
  magicPower?: number;              // 魔法力
  stamina?: number;                 // 耐力
  maxStamina?: number;              // 最大耐力
  
  // 新增：装备系统
  equipment?: Equipment[];          // 装备列表
  equippedWeapon?: string;          // 当前装备的武器
  equippedArmor?: string;           // 当前装备的护甲
  
  // 新增：技能系统
  skills?: string[];                // 掌握的技能
  craftingExperience?: number;      // 制作经验
}

// === 泰坦状态 ===
export interface TitanStatus {
  name: string;
  location: string;
  hp: number;
  maxHp: number;
  inventory: Record<string, number>;
  allies: string[];
  
  // 泰坦特有
  domain: string;                   // 统治领域
  domainPower: number;              // 领域力量
  emberGuarded: string;             // 守护的火种ID
  isEmberTaken: boolean;            // 火种是否被夺取
  
  // 泰坦能力
  titlePower: string;               // 称号力量
  elementalAffinity: string;        // 元素亲和
  awakening: number;                // 觉醒程度 (0-100)
  
  // 对黄金裔的态度
  challengersDefeated: string[];    // 击败的挑战者
  respectForChallengers: Record<string, number>; // 对特定挑战者的尊重
  
  // 新增：战斗系统相关
  defenseRating?: number;           // 防御力
  attackPower?: number;             // 攻击力
  magicPower?: number;              // 魔法力
  stamina?: number;                 // 耐力
  maxStamina?: number;              // 最大耐力
  
  // 新增：装备系统
  equipment?: Equipment[];          // 装备列表
  equippedWeapon?: string;          // 当前装备的武器
  equippedArmor?: string;           // 当前装备的护甲
}

// === NPC状态 ===
export interface NPCStatus {
  name: string;
  location: string;
  hp: number;
  maxHp: number;
  inventory: Record<string, number>;
  allies: string[];
  role: string;
  
  // NPC特有
  occupation: string;
  loyalties: string[];              // 忠诚对象
  knownInformation: string[];       // 掌握的信息
  tradingGoods: Record<string, number>;
  isCorrupted: boolean;             // 是否被黑潮黑潮
  corruptionLevel: number;          // 黑潮程度
  
  // 新增：战斗系统相关
  defenseRating?: number;           // 防御力
  attackPower?: number;             // 攻击力
  magicPower?: number;              // 魔法力
  stamina?: number;                 // 耐力
  maxStamina?: number;              // 最大耐力
  
  // 新增：装备系统
  equipment?: Equipment[];          // 装备列表
  equippedWeapon?: string;          // 当前装备的武器
  equippedArmor?: string;           // 当前装备的护甲
  
  // 新增：技能系统
  skills?: string[];                // 掌握的技能
  craftingExperience?: number;      // 制作经验
}

// === 全局资源 ===
export interface GlobalResources {
  totalWealth: number;
  rareElements: Record<string, number>;
  ancientKnowledge: Record<string, number>;
  magicalArtifacts: Artifact[];
}

export interface Artifact {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'ornament' | 'relic';
  power: number;
  location: string;
  ownerId?: string;
  abilities: string[];
  lore: string;
}

// === 交易站点 ===
export interface TradingPost {
  id: string;
  name: string;
  location: string;
  availableGoods: Record<string, number>;
  priceModifiers: Record<string, number>;
  reputation: Record<string, number>;  // 与各代理的声誉
  isActive: boolean;
}

// === 世界事件 ===
export interface WorldEvent {
  eventId: string;
  name: string;
  type: 'ember_discovery' | 'titan_awakening' | 'dark_tide_surge' | 'alliance_formed' | 'city_fallen' | 'recreation_ritual';
  severity: 'minor' | 'major' | 'world_changing';
  description: string;
  participants: string[];           // 参与代理ID
  location: string;
  startTime: number;
  duration: number;
  effects: EventEffect[];
  isOngoing: boolean;
}

export interface EventEffect {
  type: 'stat_change' | 'resource_change' | 'relationship_change' | 'new_ability' | 'corruption_spread' | 'reality_shift' | 'memory_alteration' | 'magic_level' | 'fate_intervention';
  target: string;                   // 目标代理或区域
  magnitude: number;
  description: string;
}

// === 任务系统 ===
export interface Quest {
  questId: string;
  name: string;
  type: 'ember_collection' | 'titan_challenge' | 'dark_tide_resistance' | 'alliance_building' | 'city_liberation';
  difficulty: 'trivial' | 'easy' | 'moderate' | 'hard' | 'legendary';
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  assignedTo: string[];             // 分配给的代理ID
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  timeLimit?: number;
}

export interface QuestObjective {
  objectiveId: string;
  description: string;
  isCompleted: boolean;
  progress: number;                 // 0-100
  requiredTarget?: string;
}

export interface QuestReward {
  type: 'xp' | 'item' | 'ability' | 'relationship' | 'resource';
  amount: number;
  itemId?: string;
  description: string;
}

// === 世界日志 ===
export interface WorldLog {
  timestamp: number;
  day: number;
  type: 'action' | 'event' | 'death' | 'ember_collection' | 'titan_defeat' | 'recreation' | 'ai_call';
  agentId?: string;
  message: string;
  location?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  metadata?: any; // 用于存储额外的日志数据，如AI调用的详细信息
}

// === 默认翁法罗斯世界状态 ===
export function createInitialOmphalosWorld(): OmphalosWorldState {
  return {
    day: 0,
    era: 1,
    cyclesSinceCreation: 0,
    timeOfDay: 'dawn',
    season: 'spring',
    
    cityStates: {
      // === 主要城邦 ===
      '奥赫玛': {
        id: '奥赫玛',
        name: '奥赫玛',
        type: 'capital',
        population: 10000,
        prosperity: 85,
        defenses: { walls: 5, watchtowers: 3, guardPosts: 8, magicalWards: 10, totalDefenseRating: 95 },
        resources: { food: 1000, materials: 800, wealth: 5000, mana: 200, rareElements: {} },
        specialFeatures: ['世界中枢', '再创世祭坛', '火种圣殿', '刻法勒广场', '云石市集', '云石天宫', '生命花园'],
        connectedCities: ['city-of-dawn', 'fortress-of-dusk', '雅努萨波利斯', '黎明云崖'],
        darkTideInfluence: 5,
        guardianTitan: '刻法勒',
        currentState: 'thriving',
        goldenHeirsPresent: ['阿格莱雅', '缇宝', '风堇', '刻律德菈'],
        versionStates: {
          '3.0': {
            version: '3.0',
            name: '永恒圣城',
            description: '追随「负世之泰坦」的城邦，供奉庇护世间的刻法勒。在黑潮肆虐的永夜下，唯有此处安享黎明笼罩的安逸。',
            population: 10000,
            prosperity: 85,
            specialFeatures: ['离怀之路', '刻法勒广场', '云石市集', '云石天宫', '生命花园'],
            accessibleDistricts: ['plaza', 'market', 'bath-palace', 'garden']
          },
          '3.3': {
            version: '3.3',
            name: '沉沦暮城',
            description: '在黎明机器熄灭后，曾受刻法勒庇佑、安享永昼的圣城也沉入黑夜。燃烧的天空之下，世界亦迎来垂暮之时。',
            population: 8000,
            prosperity: 45,
            specialFeatures: ['夕照之路', '庇卫广场', '寂夜市集', '冷照浴宫', '夜色庭园'],
            accessibleDistricts: ['refuge-plaza', 'silent-market', 'cold-palace', 'night-garden']
          }
        },
        districts: [
          {
            id: 'plaza',
            name: '刻法勒广场',
            type: 'religious',
            description: '为纪念刻法勒的神迹而建立的广场，可见到许多在此祷告的信徒',
            accessibility: 'open',
            notableFeatures: ['刻法勒神像', '祷告台', '信徒聚集地']
          },
          {
            id: 'market',
            name: '云石市集',
            type: 'commercial',
            description: '奥赫玛居民日常生活的主要区域，百货杂陈，精工器物，雅俗书卷，琳琅满目',
            accessibility: 'open',
            notableFeatures: ['岁月遗珍', '藏书所', '哈托努斯铁匠铺', '云石餐厅']
          },
          {
            id: 'bath-palace',
            name: '云石天宫',
            type: 'special',
            description: '法吉娜赐福的巨大浴池，人们聚集在此处，享受着宴会与蜜酿的喜乐',
            accessibility: 'open',
            notableFeatures: ['满溢主池', '三季海庭', '流憩大厅', '英雄浴池', '黎明池与星辉池']
          },
          {
            id: 'garden',
            name: '生命花园',
            type: 'special',
            description: '由「理性」赠予圣城的种子长成的花园，为这破碎的世代延续智慧，孕育生机',
            accessibility: 'open',
            notableFeatures: ['阿格莱雅的金丝茧房', '智慧之树', '生机源泉']
          }
        ]
      },
      
      '黎明云崖': {
        id: '黎明云崖',
        name: '黎明云崖',
        type: 'religious',
        population: 2000,
        prosperity: 75,
        defenses: { walls: 3, watchtowers: 2, guardPosts: 5, magicalWards: 12, totalDefenseRating: 80 },
        resources: { food: 400, materials: 300, wealth: 2000, mana: 300, rareElements: {} },
        specialFeatures: ['半神议院', '泰坦断崖', '负世泰坦觐见处'],
        connectedCities: ['奥赫玛'],
        darkTideInfluence: 8,
        guardianTitan: '刻法勒',
        currentState: 'thriving',
        versionStates: {
          '3.2': {
            version: '3.2',
            name: '半神议院',
            description: '奥赫玛的信仰中心和政治枢纽，祭司们凝望着负世泰坦，元老们在圆形会场中辩论不休',
            population: 2000,
            prosperity: 75,
            specialFeatures: ['云崖圣道', '半神议院', '泰坦断崖', '负世泰坦觐见处'],
            accessibleDistricts: ['council', 'titan-cliff']
          },
          '3.3': {
            version: '3.3',
            name: '无晖祈堂',
            description: '失去黎明的人们聚集于狭窄的避难所，在末日的夕照之下，向再也无法回应的神明祈求着未来',
            population: 1500,
            prosperity: 35,
            specialFeatures: ['昏曦圣道', '无晖祈堂', '悼神断崖', '末世祭坛'],
            accessibleDistricts: ['prayer-hall', 'altar']
          }
        }
      },

      '悬锋城': {
        id: '悬锋城',
        name: '悬锋城',
        type: 'titan_realm',
        population: 8000,
        prosperity: 60,
        defenses: { walls: 10, watchtowers: 8, guardPosts: 15, magicalWards: 5, totalDefenseRating: 95 },
        resources: { food: 600, materials: 1500, wealth: 3000, mana: 100, rareElements: { 'battle_steel': 80 } },
        specialFeatures: ['悬锋斗技场', '征伐正殿', '铸魂区', '巨剑雕像'],
        connectedCities: ['fortress-of-dusk', '奥赫玛'],
        darkTideInfluence: 25,
        guardianTitan: '尼卡多利',
        currentState: 'declining',
        goldenHeirsPresent: ['万敌'],
        versionStates: {
          '3.0': {
            version: '3.0',
            name: '纷争荒墟',
            description: '崇尚「纷争之泰坦」的城邦，供奉令人胆寒的尼卡多利。已成为黑潮泰坦的破败堡垒，延续征服与纷争的意志',
            population: 3000,
            prosperity: 30,
            specialFeatures: ['逐魂隘口', '止戈残间', '征伐陌地', '悬锋斗技场', '采石旧址'],
            accessibleDistricts: ['ruins', 'arena', 'quarry']
          },
          '浴血战端': {
            version: '浴血战端',
            name: '浴血战端',
            description: '崇尚「纷争之泰坦」的城邦，供奉令人胆寒的尼卡多利。为世间带来恐惧的矛，亦是抵御灾厄的盾',
            population: 8000,
            prosperity: 60,
            specialFeatures: ['征伐行道', '纷争正殿', '掘石场', '琢石区', '铸魂仪门'],
            accessibleDistricts: ['main-hall', 'forge', 'stone-works']
          }
        }
      },

      '雅努萨波利斯': {
        id: '雅努萨波利斯',
        name: '雅努萨波利斯',
        type: 'ruins',
        population: 500,
        prosperity: 20,
        defenses: { walls: 2, watchtowers: 1, guardPosts: 2, magicalWards: 8, totalDefenseRating: 40 },
        resources: { food: 100, materials: 200, wealth: 500, mana: 250, rareElements: { 'fate_crystal': 15 } },
        specialFeatures: ['万径之门', '命运三相殿', '神谕书库', '门径终处'],
        connectedCities: ['奥赫玛'],
        darkTideInfluence: 35,
        guardianTitan: '雅努斯',
        currentState: 'ruined',
        goldenHeirsPresent: ['缇宝'],
        versionStates: {
          '3.0': {
            version: '3.0',
            name: '命运重渊',
            description: '信仰「门径之泰坦」的城邦，供奉指引前路的雅努斯与执掌命运的泰坦们。灾厄过后，只剩神殿屹立的废墟',
            population: 500,
            prosperity: 20,
            specialFeatures: ['命运荒途', '扰梦石陵', '噤语黯地', '长梦宸扉', '觐神狭室'],
            accessibleDistricts: ['ruins', 'temple-ruins']
          },
          '3.1': {
            version: '3.1',
            name: '神谕圣地',
            description: '信仰「门径之泰坦」的城邦，供奉指引前路的雅努斯与执掌命运的泰坦们。朝圣者的终点，神迹彰显之处',
            population: 3000,
            prosperity: 70,
            specialFeatures: ['觐神祭台', '预言书库', '秘思暗廊', '命运宸扉', '拜谒步道', '门径终处'],
            accessibleDistricts: ['altar', 'library', 'gates']
          }
        }
      },

      '神悟树庭': {
        id: '神悟树庭',
        name: '神悟树庭',
        type: 'academy',
        population: 4000,
        prosperity: 65,
        defenses: { walls: 1, watchtowers: 3, guardPosts: 4, magicalWards: 15, totalDefenseRating: 85 },
        resources: { food: 500, materials: 400, wealth: 2500, mana: 400, rareElements: { 'wisdom_sap': 30 } },
        specialFeatures: ['理性巨树', '友爱之馆', '启蒙王座', '献身拱心'],
        connectedCities: ['奥赫玛'],
        darkTideInfluence: 20,
        guardianTitan: '瑟希斯',
        currentState: 'corrupted',
        goldenHeirsPresent: ['那刻夏'],
        versionStates: {
          '3.1': {
            version: '3.1',
            name: '呓语密林',
            description: '尊崇「理性之泰坦」的城邦，供奉司掌智慧的瑟希斯。学识的星火终遭吞没，仅余空虚躯壳在枝叶间游荡',
            population: 2000,
            prosperity: 35,
            specialFeatures: ['经纬小径', '求知静庭', '友爱之馆', '献身拱心', '启蒙王座'],
            accessibleDistricts: ['tree-paths', 'library', 'throne']
          }
        }
      },

      '斯缇科西亚': {
        id: '斯缇科西亚',
        name: '斯缇科西亚',
        type: 'necropolis',
        population: 2000,
        prosperity: 25,
        defenses: { walls: 4, watchtowers: 2, guardPosts: 3, magicalWards: 6, totalDefenseRating: 55 },
        resources: { food: 200, materials: 600, wealth: 1000, mana: 150, rareElements: { 'death_essence': 25, 'dragon_bone': 10 } },
        specialFeatures: ['冥河环绕', '巨龙遗骸', '王宫废庭', '岁月神殿', '双月高塔'],
        connectedCities: ['creation-vortex'],
        darkTideInfluence: 50,
        guardianTitan: '法吉娜',
        currentState: 'corrupted',
        controllingFaction: 'undead',
        goldenHeirsPresent: ['海瑟音'],
        versionStates: {
          '3.2': {
            version: '3.2',
            name: '龙骸古城',
            description: '这个亡灵国度，曾是「巨龙与海浪的城邦」斯缇科西亚。法吉娜终究无法为冥河赐福，人们也渐渐将其遗忘',
            population: 2000,
            prosperity: 25,
            specialFeatures: ['古城正门', '王宫废庭', '岁月神殿', '宝库秘道', '双月高塔'],
            accessibleDistricts: ['gates', 'palace-ruins', 'temple', 'tower']
          }
        }
      },

      '晨昏之眼': {
        id: '晨昏之眼',
        name: '晨昏之眼',
        type: 'floating',
        population: 3000,
        prosperity: 55,
        defenses: { walls: 6, watchtowers: 4, guardPosts: 8, magicalWards: 10, totalDefenseRating: 85 },
        resources: { food: 400, materials: 800, wealth: 3000, mana: 350, rareElements: { 'sky_crystal': 20 } },
        specialFeatures: ['浮空要塞', '天空文明遗迹', '预言之眼'],
        connectedCities: [],
        darkTideInfluence: 30,
        guardianTitan: '艾格勒',
        currentState: 'floating',
        controllingFaction: 'sky_dwellers',
        versionStates: {
          '3.3': {
            version: '3.3',
            name: '穹顶关塞',
            description: '在纷争世，许多浮空堡垒都已沉没，唯有这座栖居着艾格勒神体的的宏伟要塞留存，成为天空之子的聚居地',
            population: 3000,
            prosperity: 55,
            specialFeatures: ['穹顶关塞', '天空神殿', '预言之眼'],
            accessibleDistricts: ['fortress', 'temple']
          },
          '云端遗堡': {
            version: '云端遗堡',
            name: '云端遗堡',
            description: '在阳雷骑士讨伐并弑杀艾格勒后，残余的天空文明来到大地，将浮空要塞的废墟留藏在漫漫天际一隅',
            population: 1000,
            prosperity: 25,
            specialFeatures: ['要塞废墟', '天空文明遗迹'],
            accessibleDistricts: ['ruins']
          }
        }
      },

      // === 其他重要地区 ===
      '哀地里亚': {
        id: '哀地里亚',
        name: '哀地里亚',
        type: 'village',
        population: 800,
        prosperity: 60,
        defenses: { walls: 1, watchtowers: 1, guardPosts: 2, magicalWards: 4, totalDefenseRating: 30 },
        resources: { food: 300, materials: 150, wealth: 500, mana: 100, rareElements: {} },
        specialFeatures: ['永夜之帷庇护', '世外桃源'],
        connectedCities: [],
        darkTideInfluence: 5,
        currentState: 'sealed',
        goldenHeirsPresent: ['遐蝶']
      },

      '哀丽秘榭': {
        id: '哀丽秘榭',
        name: '哀丽秘榭',
        type: 'village',
        population: 600,
        prosperity: 70,
        defenses: { walls: 1, watchtowers: 1, guardPosts: 1, magicalWards: 5, totalDefenseRating: 35 },
        resources: { food: 400, materials: 100, wealth: 300, mana: 150, rareElements: {} },
        specialFeatures: ['麦田', '风车', '海滨', '宁静时光'],
        connectedCities: [],
        darkTideInfluence: 3,
        currentState: 'thriving',
        goldenHeirsPresent: ['白厄', '昔涟'],
        versionStates: {
          '3.4': {
            version: '3.4',
            name: '哀丽秘榭',
            description: '翁法罗斯某处偏僻的村庄，受永夜之帷庇护而遗落世外，麦田、风车与海滨共同守望着这隅宁静美好的时光',
            population: 600,
            prosperity: 70,
            specialFeatures: ['麦田', '风车', '海滨', '宁静时光'],
            accessibleDistricts: ['village']
          }
        }
      },

      '昏光庭院': {
        id: '昏光庭院',
        name: '昏光庭院',
        type: 'village',
        population: 400,
        prosperity: 55,
        defenses: { walls: 1, watchtowers: 1, guardPosts: 1, magicalWards: 3, totalDefenseRating: 25 },
        resources: { food: 200, materials: 80, wealth: 200, mana: 80, rareElements: {} },
        specialFeatures: ['庭院花园', '昏光美景'],
        connectedCities: [],
        darkTideInfluence: 10,
        currentState: 'thriving',
        goldenHeirsPresent: ['风堇']
      },

      '多洛斯': {
        id: '多洛斯',
        name: '多洛斯',
        type: 'village',
        population: 1200,
        prosperity: 50,
        defenses: { walls: 2, watchtowers: 2, guardPosts: 3, magicalWards: 2, totalDefenseRating: 40 },
        resources: { food: 350, materials: 200, wealth: 800, mana: 60, rareElements: {} },
        specialFeatures: ['诡计之城', '机巧设施'],
        connectedCities: ['奥赫玛'],
        darkTideInfluence: 15,
        currentState: 'thriving',
        goldenHeirsPresent: ['赛飞儿']
      },

      '创世涡心': {
        id: '创世涡心',
        name: '创世涡心',
        type: 'sacred_site',
        population: 100,
        prosperity: 90,
        defenses: { walls: 0, watchtowers: 0, guardPosts: 0, magicalWards: 20, totalDefenseRating: 100 },
        resources: { food: 0, materials: 0, wealth: 0, mana: 1000, rareElements: { 'creation_essence': 100 } },
        specialFeatures: ['世界起点', '十二泰坦神性圣所', '孕界心脉', '潮汐的馈赠', '星宿之声'],
        connectedCities: ['斯缇科西亚'],
        darkTideInfluence: 0,
        currentState: 'sealed',
        versionStates: {
          '3.0': {
            version: '3.0',
            name: '创世涡心',
            description: '被波涛藏匿的世界起点，寄宿十二泰坦原初神性的伟大圣所，亦是神谕中，创世奇迹降临的应允之地',
            population: 100,
            prosperity: 90,
            specialFeatures: ['孕界心脉', '潮汐的馈赠', '星宿之声'],
            accessibleDistricts: ['vortex-center']
          }
        }
      },
    },
    
    emberSystem: {
      totalEmbers: 12,
      collectedEmbers: 0,
      emberLocations: {
        '通途之火': {
          emberId: '通途之火',
          name: '通途之火',
          guardianTitanId: 'janus',
          isCollected: false,
          location: '雅努萨波利斯',
          power: 100,
          elementType: '空间'
        },
        '正义之火': {
          emberId: '正义之火', 
          name: '正义之火',
          guardianTitanId: 'talanton',
          isCollected: false,
          location: '奥赫玛',
          power: 100,
          elementType: '平衡'
        },
        '安息之火': {
          emberId: '安息之火',
          name: '安息之火',
          guardianTitanId: 'ourolonis',
          isCollected: false,
          location: '哀地里亚',
          power: 100,
          elementType: '阴影'
        },
        '稳固之火': {
          emberId: '稳固之火',
          name: '稳固之火',
          guardianTitanId: 'giorgia',
          isCollected: false,
          location: 'fortress-of-dusk',
          power: 100,
          elementType: '土'
        },
        '繁荣之火': {
          emberId: '繁荣之火',
          name: '繁荣之火', 
          guardianTitanId: 'fagina',
          isCollected: false,
          location: '斯缇科西亚',
          power: 100,
          elementType: '水'
        },
        '时光之火': {
          emberId: '时光之火',
          name: '时光之火',
          guardianTitanId: 'aigle',
          isCollected: false,
          location: '晨昏之眼',
          power: 100,
          elementType: '光'
        },
        '统御之火': {
          emberId: '统御之火',
          name: '统御之火',
          guardianTitanId: 'cephalos',
          isCollected: false,
          location: '奥赫玛',
          power: 100,
          elementType: '威权'
        },
        '分歧之火': {
          emberId: '分歧之火',
          name: '分歧之火',
          guardianTitanId: 'ceresis',
          isCollected: false,
          location: '神悟树庭',
          power: 100,
          elementType: '分歧'
        },
        '蜕变之火': {
          emberId: '蜕变之火',
          name: '蜕变之火',
          guardianTitanId: 'moneta',
          isCollected: false,
          location: '创世涡心',
          power: 100,
          elementType: '变化'
        },
        '征战之火': {
          emberId: '征战之火',
          name: '征战之火',
          guardianTitanId: 'nicatori',
          isCollected: false,
          location: '悬锋城',
          power: 100,
          elementType: '雷电'
        },
        '虚无之火': {
          emberId: '虚无之火',
          name: '虚无之火',
          guardianTitanId: 'senatos',
          isCollected: false,
          location: '哀丽秘榭',
          power: 100,
          elementType: '虚无'
        },
        '机缘之火': {
          emberId: '机缘之火',
          name: '机缘之火',
          guardianTitanId: 'zagreus',
          isCollected: false,
          location: '多洛斯',
          power: 100,
          elementType: '随机'
        }
      },
      emberPower: 0,
      recreationProgress: 0
    },
    
    darkTide: {
      currentIntensity: 0,
      corruptedAreas: {},
      tideEvents: [],
      resistancePoints: {},
      globalCorruption: 0,
      nextSurgeTime: 7
    },
    
    goldenHeirs: {},
    titans: {},
    npcs: {},
    
    activeEvents: [],
    completedQuests: [],
    
    globalResources: {
      totalWealth: 50000,
      rareElements: {},
      ancientKnowledge: {},
      magicalArtifacts: []
    },
    
    tradingPosts: {},
    
    logs: [{
      timestamp: Date.now(),
      day: 0,
      type: 'event',
      message: '翁法罗斯世界初始化完成，逐火之旅即将开始...',
      importance: 'critical',
      tags: ['initialization', 'world_start']
    }],
    
    isRecreationPending: false,
    worldStability: 80,
    magicLevel: 60
  };
}