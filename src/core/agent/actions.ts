import type { AgentKind } from '../omphalosWorldState';

export type Action =
  | { type: 'MOVE'; targetCity: string }
  | { type: 'CHAT'; targetId: string; content: string }
  | { type: 'INSPECT'; targetId: string }
  | { type: 'FORM_ALLIANCE'; targetId: string }
  | { type: 'ATTACK'; targetId: string }
  | { type: 'DEFEND' }
  | { type: 'REST' }
  | { type: 'GATHER'; resource: 'food' | 'materials' | 'mana' }
  | { type: 'CRAFT'; itemName: string }
  | { type: 'USE_ITEM'; itemName: string }
  | { type: 'TRADE'; targetId: string; offer: Record<string, number>; request: Record<string, number> }
  | { type: 'GIFT'; targetId: string; items: Record<string, number> }
  | { type: 'BUILD_DEFENSE'; defenseType: 'WALL' | 'WATCHTOWER' }
  | { type: 'CLEANSE' }
  | { type: 'BESTOW_EMBER'; targetId: string }
  | { type: 'RETURN_EMBER' }
  | { type: 'HAND_EMBER'; targetId: string }
  | { type: 'SUPPORT_FRONT' };

export type ActionType = Action['type'];

export interface Decision {
  thought: string;
  actions: Action[];
}

export const ACTION_DOCS: Record<ActionType, string> = {
  MOVE: 'MOVE {targetCity}: 前往某城邦。每天只能移动一次、走到相邻城邦，给出远方目的地会自动沿最短路径前进一步',
  CHAT: 'CHAT {targetId, content}: 对同城的某人说话（对方会在之后回应）',
  INSPECT: 'INSPECT {targetId}: 观察同城某人的状态',
  FORM_ALLIANCE: 'FORM_ALLIANCE {targetId}: 与同城某人结盟；盟友同城时会协同作战',
  ATTACK: 'ATTACK {targetId}: 攻击同城目标。攻击泰坦即为“挑战泰坦”，泰坦会反击；击败泰坦可夺取火种',
  DEFEND: 'DEFEND: 当日进入防御姿态，受到伤害减半',
  REST: 'REST: 休息，回复约20%生命',
  GATHER: 'GATHER {resource: food|materials|mana}: 从所在城邦采集资源',
  CRAFT: 'CRAFT {itemName}: 用背包材料制作物品',
  USE_ITEM: 'USE_ITEM {itemName}: 使用消耗品（治疗药剂 / 净化香炉）',
  TRADE: 'TRADE {targetId, offer, request}: 与同城某人交换物品，如 offer:{"food":3}, request:{"mana":2}',
  GIFT: 'GIFT {targetId, items}: 赠送物品给同城某人，如 items:{"治疗药剂":1}',
  BUILD_DEFENSE: 'BUILD_DEFENSE {defenseType: WALL|WATCHTOWER}: 消耗5材料为所在城邦修筑城防，减缓黑潮',
  CLEANSE: 'CLEANSE: 净化所在城邦的黑潮（消耗少量生命）',
  BESTOW_EMBER: 'BESTOW_EMBER {targetId}: 将你守护的火种授予同城、对应路径的黄金裔（认可须达到门槛：仍记神谕的泰坦40，火种试炼的泰坦70；每天认可最多增长12）',
  RETURN_EMBER: 'RETURN_EMBER: 在创世涡心归还身上的火种。火种只认对应路径的黄金裔：归还自己路径的火种会成为半神；替别人归还则由对应的黄金裔成为半神',
  HAND_EMBER: 'HAND_EMBER {targetId}: 把你携带的全部火种交给同城的一位黄金裔（例如交给火种对应路径的主人，或托付给护送者）',
  SUPPORT_FRONT: 'SUPPORT_FRONT: 最终之战期间，消耗5份物资（泰坦消耗20生命）为创世涡心的前线提升士气；士气会治疗前线战士并提高其攻击'
};

export const ALLOWED_ACTIONS: Record<AgentKind, ActionType[]> = {
  heir: ['MOVE', 'CHAT', 'INSPECT', 'FORM_ALLIANCE', 'ATTACK', 'DEFEND', 'REST', 'GATHER', 'CRAFT', 'USE_ITEM', 'TRADE', 'GIFT', 'BUILD_DEFENSE', 'CLEANSE', 'RETURN_EMBER', 'HAND_EMBER', 'SUPPORT_FRONT'],
  titan: ['MOVE', 'CHAT', 'INSPECT', 'ATTACK', 'DEFEND', 'REST', 'GIFT', 'CLEANSE', 'BESTOW_EMBER', 'SUPPORT_FRONT'],
  npc: ['MOVE', 'CHAT', 'INSPECT', 'FORM_ALLIANCE', 'ATTACK', 'DEFEND', 'REST', 'GATHER', 'CRAFT', 'USE_ITEM', 'TRADE', 'GIFT', 'BUILD_DEFENSE', 'CLEANSE', 'SUPPORT_FRONT'],
  enemy: []
};

// 函数调用的参数Schema：刻意保持扁平，兼容更多 OpenAI 兼容端点
export function buildDecisionSchema(allowed: ActionType[]) {
  const counts = { type: 'object', additionalProperties: { type: 'number' } };
  return {
    type: 'object',
    properties: {
      thought: { type: 'string', description: '一句简短的内心独白（第一人称）' },
      actions: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: allowed },
            targetId: { type: 'string', description: '目标的ID' },
            targetCity: { type: 'string' },
            content: { type: 'string' },
            resource: { type: 'string', enum: ['food', 'materials', 'mana'] },
            itemName: { type: 'string' },
            defenseType: { type: 'string', enum: ['WALL', 'WATCHTOWER'] },
            offer: counts,
            request: counts,
            items: counts
          },
          required: ['type']
        }
      }
    },
    required: ['thought', 'actions']
  };
}

const TYPE_ALIASES: Record<string, ActionType> = {
  GATHER_RESOURCES: 'GATHER',
  CLEANSE_CORRUPTION: 'CLEANSE',
  CRAFT_ITEM: 'CRAFT',
  USE_CONSUMABLE: 'USE_ITEM',
  CHALLENGE: 'ATTACK',
  CHALLENGE_TITAN: 'ATTACK',
  TALK: 'CHAT',
  SAY: 'CHAT',
  TRAVEL: 'MOVE',
  RETURN: 'RETURN_EMBER',
  SUPPORT: 'SUPPORT_FRONT',
  GIVE_EMBER: 'HAND_EMBER'
};

function toCounts(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(v)) {
    for (const item of v) if (typeof item === 'string') out[item] = (out[item] || 0) + 1;
    return out;
  }
  if (v && typeof v === 'object') {
    for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
      const num = Math.floor(Number(n));
      if (Number.isFinite(num) && num > 0) out[k] = Math.min(num, 999);
    }
  }
  return out;
}

// 把模型输出清洗为合法动作，丢弃无法识别的部分
export function normalizeActions(raw: unknown, allowed: ActionType[]): Action[] {
  if (!Array.isArray(raw)) return [];
  const result: Action[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const a = r as Record<string, any>;
    const params = a.parameters && typeof a.parameters === 'object' ? a.parameters : {};
    const src = { ...params, ...a };
    let type = String(src.type || '').toUpperCase().trim() as ActionType;
    type = TYPE_ALIASES[type] ?? type;
    if (!allowed.includes(type)) continue;
    const targetId = String(src.targetId ?? src.target ?? '').trim();
    switch (type) {
      case 'MOVE': {
        const targetCity = String(src.targetCity ?? src.cityId ?? src.target ?? '').trim();
        if (targetCity) result.push({ type, targetCity });
        break;
      }
      case 'CHAT': {
        const content = String(src.content ?? src.message ?? '').trim();
        if (targetId && content) result.push({ type, targetId, content: content.slice(0, 200) });
        break;
      }
      case 'INSPECT': case 'FORM_ALLIANCE': case 'ATTACK': case 'BESTOW_EMBER': case 'HAND_EMBER':
        if (targetId) result.push({ type, targetId } as Action);
        break;
      case 'GATHER': {
        const res = String(src.resource || '').toLowerCase();
        const resource = res.includes('mana') || res.includes('crystal') ? 'mana'
          : res.includes('food') ? 'food' : 'materials';
        result.push({ type, resource });
        break;
      }
      case 'CRAFT': case 'USE_ITEM': {
        const itemName = String(src.itemName ?? src.item ?? '').trim();
        if (itemName) result.push({ type, itemName });
        break;
      }
      case 'TRADE':
        if (targetId) result.push({ type, targetId, offer: toCounts(src.offer), request: toCounts(src.request) });
        break;
      case 'GIFT': {
        const items = { ...toCounts(src.items), ...toCounts(src.resources) };
        if (targetId && Object.keys(items).length) result.push({ type, targetId, items });
        break;
      }
      case 'BUILD_DEFENSE':
        result.push({ type, defenseType: String(src.defenseType).toUpperCase() === 'WATCHTOWER' ? 'WATCHTOWER' : 'WALL' });
        break;
      default:
        result.push({ type } as Action);
    }
  }
  return result.slice(0, 3);
}
