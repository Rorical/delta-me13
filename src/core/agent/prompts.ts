// 为不同类型的代理构建提示。系统提示（人设+规则）固定不变，便于端点做前缀缓存；
// 用户提示只包含当前局势，保持精简以节省 token。
import type { AgentStatus, HeirStatus, NpcStatus, TitanStatus } from '../omphalosWorldState';
import { isHeir, isNpc, isTitan, collectedEmberCount } from '../omphalosWorldState';
import type { WorldEngine } from '../engine';
import type { AgentMemory } from './memory';
import { ACTION_DOCS, ALLOWED_ACTIONS } from './actions';
import { describeRecipes } from '../recipes';
import { GOLDEN_HEIRS } from './goldenHeirProfiles';
import { getTitanProfile } from './titanProfiles';
import { NPC_ROLES } from './npcProfiles';
import { RECREATION_SITE } from '../config/cities';

const COMMON_RULES = `【世界】翁法罗斯：十二泰坦各守一枚火种。黄金裔踏上“逐火之旅”，集齐十二火种即可在创世涡心完成再创世；若黑潮吞没世界，一切将重新轮回。
【规则】
- 每天最多3个动作，按顺序执行；大部分动作只能作用于与你同城的人，ID必须来自“此地之人”列表
- 说话要符合你的身份与性格，简短自然、口语化，不要重复别人的话，也不要每次都用相同开头
- 被人搭话时请回应（CHAT 回对方），但不要无休止闲聊；把对话转化为行动
- 失败的动作会出现在“近况”里，请据此调整，不要重复同样的错误`;

export function buildSystemPrompt(agent: AgentStatus, npcPersonality?: string): string {
  const actions = ALLOWED_ACTIONS[agent.kind].map(t => `- ${ACTION_DOCS[t]}`).join('\n');
  let persona = '';
  if (isHeir(agent)) persona = heirPersona(agent);
  else if (isTitan(agent)) persona = titanPersona(agent);
  else if (isNpc(agent)) persona = npcPersona(agent, npcPersonality);
  return `${persona}\n\n${COMMON_RULES}\n\n【可用动作】\n${actions}\n\n【可制作物品】${describeRecipes()}`;
}

function heirPersona(h: HeirStatus): string {
  const p = GOLDEN_HEIRS.find(x => x.id === h.id)!;
  const titan = getTitanProfile(p.titanTarget);
  return `你是${p.trueName}（${p.codename}），继承「${p.path}」神权的黄金裔。原动力：${p.primeDrive}。
性格：${p.personality}
经历：${p.backstory}
说话风格：${p.speech}
使命：取得${titan ? `${titan.name}（${titan.title}）所守护的${p.path}火种` : '火种'}，并协助同伴集齐十二火种。
提示：泰坦远比你强大。独自挑战多半会倒下——先结盟、打造装备、准备药剂，再与盟友一同挑战；
善良的泰坦可以通过交谈、净化其城邦来赢得认可（≥30），由其亲手授予火种；被黑潮侵染的泰坦只能击败。`;
}

function titanPersona(t: TitanStatus): string {
  const p = getTitanProfile(t.id)!;
  const stance = {
    benevolent: '你愿意把火种托付给真正值得的黄金裔：考验他们的心志，认可足够（≥30）时用 BESTOW_EMBER 授予火种。',
    neutral: '你对黄金裔保持审视：他们必须以言语或武力证明自己。你可以考验、刁难，也可以在被说服后授予火种。',
    corrupted: '你已被黑潮侵染，神志混乱而充满敌意。你会攻击闯入领域的人，绝不交出火种。'
  }[t.disposition];
  return `你是${p.name}，「${p.title}」，掌管${p.path}的泰坦（${p.group}三泰坦之一），栖居于${p.home}。
性格：${p.personality}
传说：${p.backstory}
神力：${p.powers.join('、')}
立场：${stance}
你以古老存在的口吻说话，简短而有分量。你不会离开自己的城邦。`;
}

function npcPersona(n: NpcStatus, personality?: string): string {
  const r = NPC_ROLES[n.role as keyof typeof NPC_ROLES];
  return `你是${n.name}，翁法罗斯的一位${r?.label ?? '居民'}。${personality ? `性格：${personality}。` : ''}
职责：${r?.duty ?? '在乱世中生活'}
倾向：${r?.focus ?? ''}
你是普通人，远比黄金裔和泰坦弱小；你用自己的方式支援逐火之旅，也会为生计打算。`;
}

export function buildUserPrompt(engine: WorldEngine, agent: AgentStatus, memory: AgentMemory, trigger?: string): string {
  const s = engine.state;
  const city = s.cities[agent.location];
  const here = engine.agentsIn(agent.location, agent.id)
    .map(a => {
      const rel = agent.relations[a.id];
      const tag = isTitan(a) ? `泰坦·${a.disposition === 'corrupted' ? '已侵染' : a.path}` : isHeir(a) ? `黄金裔·${a.path}` : a.subtitle;
      const ally = agent.allies.includes(a.id) ? '·盟友' : '';
      return `${a.name}[ID:${a.id}](${tag}${ally}, HP${a.hp}/${a.maxHp}${rel ? `, 好感${rel}` : ''})`;
    })
    .join('；') || '无人';

  const neighbors = city.neighbors.map(n => `${n}(黑潮${Math.round(s.cities[n].darkTide)}%)`).join('、');
  const inv = Object.entries(agent.inventory).map(([k, n]) => `${k}×${n}`).join('、') || '空';
  const gear = [agent.weapon && `武器${agent.weapon}`, agent.armor && `护甲${agent.armor}`].filter(Boolean).join('，');

  const lines = [
    `【第${s.era}纪元·第${s.day}天】世界黑潮${s.darkTide.global.toFixed(0)}%，稳定度${s.worldStability.toFixed(0)}，火种已归位${collectedEmberCount(s)}/12`,
    `【所在】${city.name}（${city.type}，黑潮${city.darkTide.toFixed(0)}%${city.fallen ? '，已沦陷' : ''}，库存 食物${city.resources.food}/材料${city.resources.materials}/魔力${city.resources.mana}）`,
    `相邻城邦：${neighbors}`,
    `【自身】HP ${agent.hp}/${agent.maxHp}，攻${engine.attackPower(agent)} 防${engine.defensePower(agent)}${gear ? `，${gear}` : ''}，背包：${inv}`
  ];

  if (isHeir(agent)) {
    const target = s.agents[agent.targetTitanId] as TitanStatus | undefined;
    const allies = agent.allies.map(id => s.agents[id]?.name).filter(Boolean).join('、') || '无';
    lines.push(`等级${agent.level}，持有火种${agent.embers.length}枚，盟友：${allies}`);
    if (target) {
      const status = target.emberTaken ? '火种已被取走' : target.condition === 'fallen' ? '已陨落' : `HP${target.hp}/${target.maxHp}，对你的认可${target.respect[agent.id] ?? 0}`;
      lines.push(`目标泰坦：${target.name} 位于${target.location}（${status}）`);
    }
    const open = Object.values(s.agents)
      .filter((a): a is TitanStatus => isTitan(a) && !a.emberTaken)
      .map(t => `${t.name}@${t.location}${t.disposition === 'corrupted' ? '(侵染)' : ''}`)
      .join('、');
    lines.push(`仍守着火种的泰坦：${open || '无'}${collectedEmberCount(s) >= 12 ? '' : `；集齐后前往${RECREATION_SITE}`}`);
  } else if (isTitan(agent)) {
    const respect = Object.entries(agent.respect).map(([id, v]) => `${s.agents[id]?.name ?? id}:${v}`).join('、') || '无';
    lines.push(`你的火种：${agent.emberTaken ? '已不在你手中' : '仍在守护'}；对黄金裔的认可：${respect}`);
  }

  lines.push(`【此地之人】${here}`);

  const events = s.activeEvents.filter(e => e.location === agent.location || e.startDay === s.day).map(e => `${e.name}@${e.location}`);
  if (events.length) lines.push(`【异象】${events.join('、')}`);

  const incoming = s.messages
    .filter(m => m.to === agent.id && m.era === s.era && m.day >= s.day - 1)
    .slice(-5)
    .map(m => `${s.agents[m.from]?.name ?? m.from}[ID:${m.from}]对你说：“${m.content}”`);
  if (incoming.length) lines.push(`【有人对你说】\n${incoming.join('\n')}`);

  const summary = memory.getSummary();
  if (summary) lines.push(`【往事】${summary}`);
  const recent = memory.recent(10).map(e => `D${e.day} ${e.text}`);
  if (recent.length) lines.push(`【近况】\n${recent.join('\n')}`);

  if (trigger) lines.push(`【此刻】${trigger}`);
  lines.push('决定你今天的行动。');
  return lines.join('\n');
}
