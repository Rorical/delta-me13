// NPC种子库 - 用于随机生成多样化的NPC
export interface NPCSeed {
  namePool: string[];
  roleType: 'MERCHANT' | 'GUARD' | 'SCHOLAR' | 'CRAFTSMAN';
  personalityTraits: string[];
  backgroundStories: string[];
  motivations: string[];
  specialties?: string[];
}

export const NPC_SEED_LIBRARY: NPCSeed[] = [
  // 商人种子
  {
    namePool: ["Elara", "Marcus Goldhand", "Vera Coinweaver", "Dorian Tradewing", "Lysa Fairmarket", "Thane Silverbarter"],
    roleType: 'MERCHANT',
    personalityTraits: [
      "精明的商人，总是在寻找有利可图的交易",
      "友善但务实，相信互惠互利的原则", 
      "谨慎的风险评估者，从不做没有把握的生意",
      "乐观的冒险家，愿意尝试新的贸易路线",
      "严格的质量控制者，只出售最好的商品"
    ],
    backgroundStories: [
      "曾经是一名失败的冒险者，现在专注于为其他冒险者提供装备",
      "来自商人世家，继承了祖辈的贸易智慧和人脉关系",
      "从小摊贩做起，通过诚信经营逐渐建立起自己的商业帝国",
      "前军需官，对装备和资源的需求有深刻的理解",
      "意外发现了一条利润丰厚的贸易路线，从此改变了命运"
    ],
    motivations: [
      "积累财富为家族未来做准备",
      "建立覆盖多个城市的贸易网络", 
      "成为最受信赖的装备供应商",
      "发现并开发新的贸易商品",
      "在动荡时代维持经济稳定"
    ],
    specialties: ["金属工艺", "宝石鉴定", "远程贸易", "库存管理", "价格分析"]
  },
  
  // 守卫种子
  {
    namePool: ["Marcus Ironshield", "Sera Vigilant", "Gareth Steadfast", "Luna Nightwatch", "Bram Defender", "Kira Stalwart"],
    roleType: 'GUARD',
    personalityTraits: [
      "忠诚尽职，将保护平民视为神圣使命",
      "经验丰富的战士，在无数战斗中幸存下来",
      "严厉但公正，绝不容忍任何形式的犯罪",
      "机警的侦察者，善于发现潜在的威胁",
      "沉默寡言但行动力强，用行动而非言语证明自己"
    ],
    backgroundStories: [
      "曾是精锐军团的一员，退役后选择守护家乡",
      "年轻时家园被黑潮摧毁，发誓要保护其他人不受同样命运",
      "出身守卫世家，从小就接受战斗训练",
      "前佣兵团长，厌倦了为金钱而战，现在为正义而战",
      "曾经的罪犯，通过守护他人来赎回自己的过去"
    ],
    motivations: [
      "确保城市居民的安全",
      "阻止黑潮向城市蔓延",
      "培训下一代守卫",
      "维护法律和秩序",
      "为过去的错误赎罪"
    ],
    specialties: ["城防战术", "巡逻路线", "威胁评估", "武器训练", "紧急应对"]
  },

  // 学者种子
  {
    namePool: ["Aldric Bookworm", "Sage Moonsight", "Scholar Inkwell", "Wise Stargazer", "Learned Quillheart", "Master Lorekeeper"],
    roleType: 'SCHOLAR',
    personalityTraits: [
      "求知若渴的研究者，对古老知识有着无尽的好奇心",
      "理论家，相信知识是解决一切问题的钥匙",
      "谨慎的记录者，将保存知识视为神圣职责",
      "哲学思辨者，喜欢探讨生命和宇宙的奥秘",
      "实用主义者，致力于将理论知识转化为实际应用"
    ],
    backgroundStories: [
      "古老图书馆的守护者，研究失落的魔法和历史",
      "曾经的宫廷法师，因为政治动荡而选择隐居学术",
      "来自学者家族，继承了数代人积累的知识宝库",
      "自学成才的民间智者，通过实践获得了深刻见解",
      "前冒险者，在探索中收集知识，现在专注于研究"
    ],
    motivations: [
      "解开古老魔法的秘密",
      "记录并保存当代的历史",
      "培养新一代的学者",
      "寻找对抗黑潮的方法",
      "建立知识共享网络"
    ],
    specialties: ["古代历史", "魔法理论", "天文学", "炼金术", "语言学"]
  },

  // 工匠种子  
  {
    namePool: ["Thorin Hammerfall", "Craft Gearwright", "Smith Ironbend", "Artisan Goldforge", "Master Toolmaker", "Builder Stonehand"],
    roleType: 'CRAFTSMAN',
    personalityTraits: [
      "完美主义者，对每一件作品都精益求精",
      "创新者，不断尝试新的工艺和材料",
      "务实的解决者，善于用简单的方法解决复杂问题",
      "传统主义者，坚持使用祖传的工艺技巧",
      "合作者，相信团队合作能创造更好的作品"
    ],
    backgroundStories: [
      "家族工坊的第三代传人，继承了精湛的手艺",
      "自学成才的发明家，创造了许多实用的工具",
      "前军械师，专门为军队制造武器和装备",
      "流浪工匠，走遍各地学习不同的制作技艺",
      "曾经的贵族工艺师，现在为普通民众服务"
    ],
    motivations: [
      "创造出前所未有的精品",
      "传承古老的工艺技巧",
      "为社区提供实用的工具",
      "发明能够对抗黑潮的装备",
      "建立工匠行会"
    ],
    specialties: ["金属锻造", "木工雕刻", "宝石镶嵌", "机械制造", "建筑设计"]
  }
];

// 随机生成NPC的函数
export function generateRandomNPC(seed?: NPCSeed): { name: string; role: string; personality: string; backstory: string; motivation: string; specialty?: string } {
  // 如果没有指定种子，随机选择一个
  const selectedSeed = seed || NPC_SEED_LIBRARY[Math.floor(Math.random() * NPC_SEED_LIBRARY.length)];
  
  return {
    name: selectedSeed.namePool[Math.floor(Math.random() * selectedSeed.namePool.length)],
    role: selectedSeed.roleType,
    personality: selectedSeed.personalityTraits[Math.floor(Math.random() * selectedSeed.personalityTraits.length)],
    backstory: selectedSeed.backgroundStories[Math.floor(Math.random() * selectedSeed.backgroundStories.length)],
    motivation: selectedSeed.motivations[Math.floor(Math.random() * selectedSeed.motivations.length)],
    specialty: selectedSeed.specialties ? selectedSeed.specialties[Math.floor(Math.random() * selectedSeed.specialties.length)] : undefined
  };
}

// 生成指定数量的随机NPC
export function generateRandomNPCs(count: number): Array<{ name: string; role: string; personality: string; backstory: string; motivation: string; specialty?: string }> {
  const npcs = [];
  for (let i = 0; i < count; i++) {
    npcs.push(generateRandomNPC());
  }
  return npcs;
}

// 按角色类型生成NPC
export function generateNPCsByRole(roleType: 'MERCHANT' | 'GUARD' | 'SCHOLAR' | 'CRAFTSMAN', count: number) {
  const roleSeed = NPC_SEED_LIBRARY.find(seed => seed.roleType === roleType);
  const npcs = [];
  for (let i = 0; i < count; i++) {
    npcs.push(generateRandomNPC(roleSeed));
  }
  return npcs;
}