import type { ProviderAdapter } from '../providers';
import type { Action } from '../agent/actions';

type Policy = (user: string, allowed: string[]) => Partial<Action>[];

// 测试用的模型适配器：按策略从提示文本中决定行动，不发出任何网络请求
export function scriptedAdapter(policy: Policy): ProviderAdapter & { calls: number } {
  return {
    kind: 'openai-chat',
    model: 'scripted',
    calls: 0,
    async listModels() { return ['scripted']; },
    async complete(req) {
      this.calls++;
      const schema = req.tool?.schema as any;
      const allowed: string[] = schema?.properties?.actions?.items?.properties?.type?.enum ?? [];
      const actions = policy(req.user, allowed).filter(a => a.type && allowed.includes(a.type)).slice(0, 3);
      return { toolArgs: { thought: '……', actions }, text: '', reasoning: '', inputTokens: req.user.length, outputTokens: 10 };
    }
  };
}

// 协同作战的策略：黄金裔取火、归还；最终之战时所有人前往创世涡心或支援前线
export const cooperativePolicy: Policy = (u) => {
  const here = [...u.matchAll(/\[ID:([^\]]+)\]\(([^,)]+)/g)].map(m => ({ id: m[1], tag: m[2] }));
  const loc = u.match(/【所在】([^（]+)/)?.[1];
  const hp = u.match(/【自身】HP (\d+)\/(\d+)/);
  const lowHp = !!hp && +hp[1] < +hp[2] * 0.3;
  const isHeir = /目标泰坦|身上没有火种|身上的火种/.test(u);
  const isTitan = u.includes('你的火种：');
  if (u.includes('【最终之战')) {
    if (loc === '创世涡心') return [lowHp ? { type: 'REST' } : { type: 'ATTACK', targetId: 'irontomb' }, { type: 'SUPPORT_FRONT' }];
    if (isHeir || isTitan) return [{ type: 'MOVE', targetCity: '创世涡心' }];
    return [{ type: 'SUPPORT_FRONT' }, { type: 'GATHER', resource: 'food' }, { type: 'CLEANSE' }];
  }
  if (isHeir) {
    if (here.some(h => h.id === 'flamethief') && !lowHp) return [{ type: 'ATTACK', targetId: 'flamethief' }];
    if (lowHp) return [{ type: 'REST' }];
    if (u.includes('身上的火种')) return [{ type: 'MOVE', targetCity: '创世涡心' }, { type: 'RETURN_EMBER' }];
    const tgt = u.match(/目标泰坦：\S+ 位于(\S+?)（([^）]*)）/);
    if (tgt && !/已被取走|陨落/.test(tgt[2])) {
      const titan = here.find(h => h.tag.startsWith('泰坦'));
      return tgt[1] === loc && titan ? [{ type: 'CLEANSE' }, { type: 'ATTACK', targetId: titan.id }] : [{ type: 'MOVE', targetCity: tgt[1] }];
    }
    return [{ type: 'CLEANSE' }];
  }
  if (isTitan) {
    const heir = here.find(h => h.tag.startsWith('黄金裔'));
    return heir ? [{ type: 'BESTOW_EMBER', targetId: heir.id }] : [];
  }
  return [{ type: 'GATHER', resource: 'materials' }, { type: 'BUILD_DEFENSE', defenseType: 'WALL' }, { type: 'CLEANSE' }];
};
