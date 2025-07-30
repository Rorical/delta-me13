// 翁法罗斯世界初始化辅助函数
import type { OmphalosWorldState, CorruptedArea, DarkTideEvent } from '../omphalosWorldState';

// 初始化黑潮区域
export function initializeCorruptedAreas(): Record<string, CorruptedArea> {
  return {
    'corrupted-plains': {
      areaId: 'corrupted-plains',
      name: '黑潮平原',
      corruptionLevel: 0,
      corruptionType: 'shadow',
      affectedCities: [],
      monsters: [
        {
          id: 'shadow_beast_1',
          name: '暗影野兽',
          type: 'shadow_beast',
          power: 45,
          location: 'corrupted-plains',
          abilities: ['暗影攻击', '隐身']
        }
      ],
      isExpanding: true
    },
    'void-rift': {
      areaId: 'void-rift',
      name: '虚空裂隙',
      corruptionLevel: 0,
      corruptionType: 'void',
      affectedCities: [],
      monsters: [
        {
          id: 'void_wraith_1',
          name: '虚空怨灵',
          type: 'void_wraith',
          power: 60,
          location: 'void-rift',
          abilities: ['虚空吞噬', '精神攻击']
        }
      ],
      isExpanding: false
    },
    'crimson-wastes': {
      areaId: 'crimson-wastes',
      name: '血色荒原',
      corruptionLevel: 0,
      corruptionType: 'blood',
      affectedCities: [],
      monsters: [
        {
          id: 'blood_crawler_1',
          name: '血蛛',
          type: 'blood_crawler',
          power: 40,
          location: 'crimson-wastes',
          abilities: ['毒液喷射', '血液汲取']
        },
        {
          id: 'crimson_berserker_1',
          name: '猩红狂战士',
          type: 'corrupted_warrior',
          power: 55,
          location: 'crimson-wastes',
          abilities: ['狂暴冲击', '血怒']
        }
      ],
      isExpanding: true
    },
    'withered-forest': {
      areaId: 'withered-forest',
      name: '枯萎林海',
      corruptionLevel: 0,
      corruptionType: 'decay',
      affectedCities: ['mystic-grove'],
      monsters: [
        {
          id: 'withered_treant_1',
          name: '枯萎树人',
          type: 'corrupted_treant',
          power: 50,
          location: 'withered-forest',
          abilities: ['根须缠绕', '孢子毒雾']
        },
        {
          id: 'plague_sprite_1',
          name: '疫病精灵',
          type: 'plague_sprite',
          power: 30,
          location: 'withered-forest',
          abilities: ['疾病传播', '腐蚀触碰']
        }
      ],
      isExpanding: false
    },
    'frozen-abyss': {
      areaId: 'frozen-abyss',
      name: '冰霜深渊',
      corruptionLevel: 88,
      corruptionType: 'ice',
      affectedCities: [],
      monsters: [
        {
          id: 'frost_lich_1',
          name: '霜冻巫妖',
          type: 'frost_lich',
          power: 70,
          location: 'frozen-abyss',
          abilities: ['冰霜领域', '亡灵召唤', '生命冰封']
        },
        {
          id: 'ice_golem_1',
          name: '寒冰魔像',
          type: 'ice_golem',
          power: 65,
          location: 'frozen-abyss',
          abilities: ['冰锥突刺', '寒霜护盾']
        }
      ],
      isExpanding: false
    },
    'mirage-desert': {
      areaId: 'mirage-desert',
      name: '幻象沙漠',
      corruptionLevel: 0,
      corruptionType: 'illusion',
      affectedCities: [],
      monsters: [
        {
          id: 'mirage_serpent_1',
          name: '幻影巨蛇',
          type: 'mirage_serpent',
          power: 48,
          location: 'mirage-desert',
          abilities: ['幻象分身', '精神迷惑']
        },
        {
          id: 'sand_wraith_1',
          name: '沙尘怨灵',
          type: 'sand_wraith',
          power: 42,
          location: 'mirage-desert',
          abilities: ['沙暴召唤', '虚体穿透']
        }
      ],
      isExpanding: false
    },
    'twisted-mountain': {
      areaId: 'twisted-mountain',
      name: '扭曲山脉',
      corruptionLevel: 0,
      corruptionType: 'chaos',
      affectedCities: [],
      monsters: [
        {
          id: 'chaos_dragon_1',
          name: '混沌幼龙',
          type: 'chaos_dragon',
          power: 80,
          location: 'twisted-mountain',
          abilities: ['混沌吐息', '现实扭曲', '时空裂隙']
        },
        {
          id: 'stone_gargoyle_1',
          name: '石质夜叉',
          type: 'corrupted_gargoyle',
          power: 52,
          location: 'twisted-mountain',
          abilities: ['石化凝视', '岩石投掷']
        }
      ],
      isExpanding: false
    },
    'bone-graveyard': {
      areaId: 'bone-graveyard',
      name: '白骨墓园',
      corruptionLevel: 92,
      corruptionType: 'necromancy',
      affectedCities: [],
      monsters: [
        {
          id: 'skeleton_lord_1',
          name: '骷髅领主',
          type: 'skeleton_lord',
          power: 75,
          location: 'bone-graveyard',
          abilities: ['亡灵军团', '骨矛风暴', '死亡诅咒']
        },
        {
          id: 'bone_drake_1',
          name: '骨龙',
          type: 'bone_drake',
          power: 68,
          location: 'bone-graveyard',
          abilities: ['死亡吐息', '骨刺飞行']
        },
        {
          id: 'ghoul_swarm_1',
          name: '食尸鬼群',
          type: 'ghoul_swarm',
          power: 35,
          location: 'bone-graveyard',
          abilities: ['群体撕咬', '感染伤口']
        }
      ],
      isExpanding: false
    },
    'cursed-lake': {
      areaId: 'cursed-lake',
      name: '诅咒之湖',
      corruptionLevel: 78,
      corruptionType: 'curse',
      affectedCities: [],
      monsters: [
        {
          id: 'cursed_siren_1',
          name: '诅咒海妖',
          type: 'cursed_siren',
          power: 58,
          location: 'cursed-lake',
          abilities: ['魅惑之歌', '诅咒触碰', '水元素操控']
        },
        {
          id: 'lake_leviathan_1',
          name: '湖底巨兽',
          type: 'water_leviathan',
          power: 72,
          location: 'cursed-lake',
          abilities: ['巨浪冲击', '深渊吞噬']
        }
      ],
      isExpanding: false
    }
  };
}

// 初始化黑潮事件
export function initializeDarkTideEvents(): DarkTideEvent[] {
  return [
    {
      eventId: 'initial_corruption',
      type: 'corruption_spread',
      severity: 'minor',
      affectedAreas: ['corrupted-plains'],
      startTime: 0,
      duration: 999,
      isActive: true
    },
    {
      eventId: 'blood_awakening',
      type: 'corruption_spread',
      severity: 'moderate',
      affectedAreas: ['crimson-wastes'],
      startTime: 50,
      duration: 200,
      isActive: false
    },
    {
      eventId: 'forest_decay',
      type: 'corruption_spread',
      severity: 'major',
      affectedAreas: ['withered-forest'],
      startTime: 100,
      duration: 300,
      isActive: false
    },
    {
      eventId: 'necromantic_surge',
      type: 'corruption_spread',
      severity: 'severe',
      affectedAreas: ['bone-graveyard'],
      startTime: 150,
      duration: 400,
      isActive: false
    },
    {
      eventId: 'chaos_storm',
      type: 'corruption_spread',
      severity: 'critical',
      affectedAreas: ['twisted-mountain'],
      startTime: 200,
      duration: 150,
      isActive: false
    },
    {
      eventId: 'cursed_flood',
      type: 'corruption_spread',
      severity: 'moderate',
      affectedAreas: ['cursed-lake'],
      startTime: 180,
      duration: 250,
      isActive: false
    }
  ];
}

// 更新世界状态为完整的翁法罗斯状态
export function enhanceOmphalosWorld(worldState: OmphalosWorldState): OmphalosWorldState {
  // 添加黑潮区域
  worldState.darkTide.corruptedAreas = initializeCorruptedAreas();
  
  // 添加黑潮事件
  worldState.darkTide.tideEvents = initializeDarkTideEvents();
  
  // 添加更多城邦
  worldState.cityStates['mystic-grove'] = {
    id: 'mystic-grove',
    name: '神秘树林',
    type: 'mystical',
    population: 2000,
    prosperity: 55,
    defenses: { walls: 2, watchtowers: 3, guardPosts: 4, magicalWards: 8, totalDefenseRating: 70 },
    resources: { food: 600, materials: 300, wealth: 1500, mana: 150, rareElements: { 'nature_essence': 20 } },
    specialFeatures: ['古老图书馆', '德鲁伊圣地', '魔法研究院'],
    connectedCities: ['omphalos-heart'],
    darkTideInfluence: 8
  };
  
  worldState.cityStates['crystal-caverns'] = {
    id: 'crystal-caverns',
    name: '水晶洞穴',
    type: 'mystical',
    population: 1500,
    prosperity: 45,
    defenses: { walls: 1, watchtowers: 2, guardPosts: 3, magicalWards: 9, totalDefenseRating: 60 },
    resources: { food: 300, materials: 200, wealth: 800, mana: 300, rareElements: { 'mana_crystal': 50, 'time_crystal': 5 } },
    specialFeatures: ['时间水晶矿', '法师工坊'],
    connectedCities: ['mystic-grove'],
    darkTideInfluence: 12
  };
  
  // 添加交易站点
  worldState.tradingPosts['central-market'] = {
    id: 'central-market',
    name: '中央市场',
    location: 'city-of-dawn',
    availableGoods: {
      'basic_weapon': 10,
      'food_ration': 50,
      'mana_potion': 20,
      'travel_gear': 15
    },
    priceModifiers: {
      'basic_weapon': 1.0,
      'food_ration': 0.8,
      'mana_potion': 1.2,
      'travel_gear': 1.1
    },
    reputation: {},
    isActive: true
  };
  
  // 添加初始任务
  worldState.activeEvents.push({
    eventId: 'journey_begins',
    name: '逐火之旅开始',
    type: 'ember_discovery',
    severity: 'world_changing',
    description: '十二位黄金裔觉醒，开始他们的逐火之旅，寻找十二火种以完成再创世。',
    participants: Object.keys(worldState.goldenHeirs),
    location: 'omphalos-heart',
    startTime: 0,
    duration: 365,  // 一年时间
    effects: [
      {
        type: 'new_ability',
        target: 'all_golden_heirs',
        magnitude: 1,
        description: '所有黄金裔获得火种感知能力'
      }
    ],
    isOngoing: true
  });
  
  return worldState;
}