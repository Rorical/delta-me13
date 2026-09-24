// 可制作物品。材料只使用世界中真实存在的资源：food / materials / mana
export interface ItemDef {
  name: string;
  kind: 'weapon' | 'armor' | 'consumable';
  materials: Record<string, number>;
  power?: number;       // 武器加成
  defense?: number;     // 护甲加成
  heal?: number;        // 消耗品回复
  cleanse?: number;     // 消耗品净化量
  description: string;
}

export const ITEMS: Record<string, ItemDef> = {
  '铁剑': { name: '铁剑', kind: 'weapon', materials: { materials: 6 }, power: 6, description: '朴素可靠的铁剑' },
  '秘银长枪': { name: '秘银长枪', kind: 'weapon', materials: { materials: 10, mana: 5 }, power: 12, description: '注入魔力的长枪' },
  '弑神之刃': { name: '弑神之刃', kind: 'weapon', materials: { materials: 18, mana: 12 }, power: 20, description: '专为挑战泰坦而锻造' },
  '皮甲': { name: '皮甲', kind: 'armor', materials: { materials: 5 }, defense: 4, description: '轻便的护甲' },
  '符文铠甲': { name: '符文铠甲', kind: 'armor', materials: { materials: 12, mana: 6 }, defense: 10, description: '刻有防护符文的铠甲' },
  '治疗药剂': { name: '治疗药剂', kind: 'consumable', materials: { food: 3, mana: 2 }, heal: 45, description: '回复45点生命' },
  '净化香炉': { name: '净化香炉', kind: 'consumable', materials: { mana: 8 }, cleanse: 12, description: '大幅降低所在城邦的黑潮' }
};

export function getItem(name: string): ItemDef | undefined {
  if (ITEMS[name]) return ITEMS[name];
  const key = Object.keys(ITEMS).find(k => name.includes(k) || k.includes(name));
  return key ? ITEMS[key] : undefined;
}

export function describeRecipes(): string {
  return Object.values(ITEMS)
    .map(i => `${i.name}(${Object.entries(i.materials).map(([m, n]) => `${m}×${n}`).join('+')}${i.power ? `, 攻+${i.power}` : ''}${i.defense ? `, 防+${i.defense}` : ''}${i.heal ? `, 回复${i.heal}` : ''}${i.cleanse ? `, 净化${i.cleanse}` : ''})`)
    .join('；');
}
