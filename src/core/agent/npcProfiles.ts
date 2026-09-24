// 城邦居民：商人、守卫、学者、工匠、祭司
export type NPCRole = 'MERCHANT' | 'GUARD' | 'SCHOLAR' | 'CRAFTSMAN' | 'PRIEST';

export interface NPCRoleProfile {
  label: string;
  duty: string;
  focus: string;              // 提示中的行动倾向
  hp: number;
  power: number;
  defense: number;
  inventory: Record<string, number>;
  personalities: string[];
}

export const NPC_ROLES: Record<NPCRole, NPCRoleProfile> = {
  MERCHANT: {
    label: '商人', duty: '在城邦间贩运物资，与黄金裔做买卖',
    focus: '多用 TRADE 与 GATHER，必要时 MOVE 到物资更丰富的城邦',
    hp: 60, power: 6, defense: 3, inventory: { food: 12, materials: 10, mana: 4 },
    personalities: ['精明算计，但讲究信誉', '热情健谈，爱打听八卦', '谨慎多疑，从不做亏本买卖']
  },
  GUARD: {
    label: '守卫', duty: '守护城邦，修筑城防，抵御黑潮',
    focus: '多用 BUILD_DEFENSE 与 CLEANSE，保护所在城邦',
    hp: 110, power: 16, defense: 8, inventory: { food: 6, materials: 8 },
    personalities: ['山之民出身，一丝不苟，说话简短', '严厉但公正的老兵', '爱讲当年黄金战争旧事的老卫士']
  },
  SCHOLAR: {
    label: '学者', duty: '研究泰坦、火种与黑潮，向黄金裔传授知识',
    focus: '多用 INSPECT 与 CHAT 分享情报，偶尔 CLEANSE',
    hp: 50, power: 4, defense: 2, inventory: { mana: 8, food: 4 },
    personalities: ['好奇心旺盛，说话滔滔不绝', '清高孤僻，但知识渊博', '神经质，总担心世界末日']
  },
  CRAFTSMAN: {
    label: '工匠', duty: '打造武器、护甲与药剂，支援逐火之旅',
    focus: '多用 GATHER 与 CRAFT，把成品 GIFT 或 TRADE 给黄金裔',
    hp: 80, power: 10, defense: 5, inventory: { materials: 14, mana: 4, food: 4 },
    personalities: ['一丝不苟的手艺人', '豪爽的铁匠，嗓门很大', '爱发明古怪玩意儿']
  },
  PRIEST: {
    label: '祭司', duty: '侍奉泰坦，安抚民众，净化黑潮',
    focus: '多用 CLEANSE 与 CHAT，向泰坦祈祷（CHAT 泰坦）',
    hp: 70, power: 6, defense: 4, inventory: { mana: 8, food: 6 },
    personalities: ['虔诚温和', '狂热而固执', '对神明心存怀疑的老祭司']
  }
};

const NAME_POOL = [
  '伊拉拉', '马库斯', '狄俄涅', '卡利斯', '赫利俄', '塞勒涅', '阿卡斯', '忒拉',
  '波洛斯', '菲洛', '墨冬', '克里昂', '伊卡洛', '欧律', '泰斯', '瑞娅',
  '阿里翁', '达佛涅', '科林娜', '莱昂'
];

export interface NPCSeed {
  name: string;
  role: NPCRole;
  personality: string;
}

// 生成不重名的NPC
export function generateNPCs(count: number, rng: () => number = Math.random): NPCSeed[] {
  const names = [...NAME_POOL].sort(() => rng() - 0.5);
  const roles = Object.keys(NPC_ROLES) as NPCRole[];
  const result: NPCSeed[] = [];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const profile = NPC_ROLES[role];
    result.push({
      name: names[i % names.length] + (i >= names.length ? `${Math.floor(i / names.length) + 1}` : ''),
      role,
      personality: profile.personalities[Math.floor(rng() * profile.personalities.length)]
    });
  }
  return result;
}
