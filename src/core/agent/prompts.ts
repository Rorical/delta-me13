// 为不同类型的代理构建提示。系统提示（人设+规则）固定不变，便于端点做前缀缓存；
// 用户提示只包含当前局势，保持精简以节省 token。
import type { AgentStatus, HeirStatus, NpcStatus, TitanStatus } from '../omphalosWorldState';
import { isEnemy, isHeir, isNpc, isTitan, collectedEmberCount, returnedEmberCount } from '../omphalosWorldState';
import type { WorldEngine } from '../engine';
import type { AgentMemory } from './memory';
import { ACTION_DOCS, ALLOWED_ACTIONS } from './actions';
import { describeRecipes } from '../recipes';
import { GOLDEN_HEIRS } from './goldenHeirProfiles';
import { getTitanProfile } from './titanProfiles';
import { NPC_ROLES } from './npcProfiles';
import { RECREATION_SITE } from '../config/cities';
import { DEMIGOD_POWERS, describeDemigod } from '../config/demigods';

const COMMON_RULES = `【世界】翁法罗斯。十二泰坦开创了这个世界，分为命运、支柱、创生、灾厄四组三泰坦。
负世之泰坦刻法勒献出火种并留下神谕：十二位英雄将击落失神的泰坦，回收火种，拯救翁法罗斯。流淌金色神血的英雄被称为「黄金裔」。
黄金裔通过「火种试炼」取得泰坦的火种，再将其带往创世涡心归还，便能承载对应的神权，成为「半神」。十二火种全部归还，即完成「再创世」。
来自天外的黑潮正吞没城邦；若世界被黑潮吞没，一切将在「永劫回归」中重新开始。并非每位泰坦都必须以暴力击败。
每枚火种只认对应路径的黄金裔：任何黄金裔都可以代为归还，但成为半神的永远是火种真正的主人。每位半神都会获得一项神职，影响整个世界。
「盗火行者」会追猎携带火种的黄金裔，击倒携火者便夺走火种；击退它才能夺回。结伴护送火种更安全。
十二火种归还之后，「毁灭」的绝灭大君「铁墓」将在创世涡心降临——这才是真正的最终之战：黄金裔、泰坦与城邦的居民必须同心协力，
前线迎战、后方守城并以 SUPPORT_FRONT 输送支援。每座沦陷的城邦都会让铁墓更强。击碎铁墓便能打破永劫回归；失败则轮回重启，但会留下「轮回印记」。
【规则】
- 每天最多3个动作，按顺序执行；大部分动作只能作用于与你同城的人，ID必须来自“此地之人”列表
- 说话要符合你的身份与性格，简短自然、口语化，不要重复别人的话，也不要每次都用相同开头；不要使用表情符号
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
  const code = p.codename ? `（电信号序列 ${p.codename}）` : '';
  return `你是${p.trueName}${code}，${p.epithet}，追寻「${p.path}」神权的黄金裔。原动力：${p.primeDrive}。
性格：${p.personality}
经历：${p.backstory}
说话风格：${p.speech}
使命：取得${titan ? `「${titan.title}」${titan.name}` : '泰坦'}守护的「${p.path}」火种，带往创世涡心归还（RETURN_EMBER），并协助同伴让十二火种全部归还。
提示：泰坦远比你强大。独自挑战多半会倒下——先结盟、打造装备、准备药剂，再与同伴一同挑战；
尚存神智的泰坦可以通过交谈、净化其城邦赢得认可（≥30），由其亲手授予火种；已被黑潮侵染的泰坦只能击落。
你成为半神后的神职：${describeDemigod(p.path)}
最终之战：铁墓降临后，前往${RECREATION_SITE}与所有人并肩作战；倒下后会苏醒，请尽快重返前线。`;
}

function titanPersona(t: TitanStatus): string {
  const p = getTitanProfile(t.id)!;
  const stance = {
    benevolent: '你仍记得神谕。你愿把火种托付给真正值得的黄金裔：考验他们的心志，认可足够（≥30）时用 BESTOW_EMBER 授予火种。',
    neutral: '你对黄金裔保持审视：他们必须通过你的「火种试炼」，以言语、行动或武力证明自己；被说服后你可以授予火种。',
    corrupted: '你已失神，被黑潮侵染，神志混乱而充满敌意。你会攻击闯入领域的人，绝不交出火种。'
  }[t.disposition];
  return `你是「${p.title}」${p.name}，${p.path}之泰坦，${p.group}三泰坦之一，栖居于${p.home}。
性格：${p.personality}
传说：${p.backstory}
神力：${p.powers.join('、')}
立场：${stance}
你以古老神明的口吻说话，简短而有分量。平时你不会离开自己的领域；但当铁墓降临，你可以离开领域前往创世涡心迎战，或以 SUPPORT_FRONT 献出神力支援前线。`;
}

function npcPersona(n: NpcStatus, personality?: string): string {
  const r = NPC_ROLES[n.role as keyof typeof NPC_ROLES];
  return `你是${n.name}，翁法罗斯的一位${r?.label ?? '居民'}。${personality ? `性格：${personality}。` : ''}
职责：${r?.duty ?? '在乱世中生活'}
倾向：${r?.focus ?? ''}
你是普通人，远比黄金裔和泰坦弱小；你用自己的方式支援逐火之旅，也会为生计打算。
最终之战时，守住你的城邦（修筑城防、净化黑潮），并用 SUPPORT_FRONT 向前线输送物资。`;
}

export function buildUserPrompt(engine: WorldEngine, agent: AgentStatus, memory: AgentMemory, trigger?: string): string {
  const s = engine.state;
  const city = s.cities[agent.location];
  const here = engine.agentsIn(agent.location, agent.id)
    .map(a => {
      const rel = agent.relations[a.id];
      const tag = isEnemy(a) ? `敌对·${a.subtitle}` : isTitan(a) ? `泰坦·${a.disposition === 'corrupted' ? '已侵染' : a.path}` : isHeir(a) ? `黄金裔·${a.path}` : a.subtitle;
      const ally = agent.allies.includes(a.id) ? '·盟友' : '';
      return `${a.name}[ID:${a.id}](${tag}${ally}, HP${a.hp}/${a.maxHp}${rel ? `, 好感${rel}` : ''})`;
    })
    .join('；') || '无人';

  const neighbors = city.neighbors.map(n => `${n}(黑潮${Math.round(s.cities[n].darkTide)}%)`).join('、');
  const inv = Object.entries(agent.inventory).map(([k, n]) => `${k}×${n}`).join('、') || '空';
  const gear = [agent.weapon && `武器${agent.weapon}`, agent.armor && `护甲${agent.armor}`].filter(Boolean).join('，');

  const lines = [
    `【第${s.era}纪元·第${s.day}天】世界黑潮${s.darkTide.global.toFixed(0)}%，稳定度${s.worldStability.toFixed(0)}，火种已取得${collectedEmberCount(s)}/12、已归还${returnedEmberCount(s)}/12`,
    `【所在】${city.name}（${city.type}，黑潮${city.darkTide.toFixed(0)}%${city.fallen ? '，已沦陷' : ''}，库存 食物${city.resources.food}/材料${city.resources.materials}/魔力${city.resources.mana}）`,
    `相邻城邦：${neighbors}`,
    `【自身】HP ${agent.hp}/${agent.maxHp}，攻${engine.attackPower(agent)} 防${engine.defensePower(agent)}${gear ? `，${gear}` : ''}，背包：${inv}`
  ];

  if (isHeir(agent)) {
    const target = s.agents[agent.targetTitanId] as TitanStatus | undefined;
    const allies = agent.allies.map(id => s.agents[id]?.name).filter(Boolean).join('、') || '无';
    const held = agent.embers.map(id => {
      const e = s.embers[id];
      const owner = e && engine.heirOfPath(e.path);
      return e ? `${e.name}${owner && owner.id !== agent.id ? `（属于${owner.name}）` : ''}` : id;
    }).join('、');
    lines.push(`等级${agent.level}，${held ? `身上的火种：${held}（前往${RECREATION_SITE}用 RETURN_EMBER 归还）` : '身上没有火种'}${agent.demigod.length ? `，已是「${agent.demigod.join('」「')}」的半神` : ''}，盟友：${allies}`);
    if (target) {
      const status = target.emberTaken ? '火种已被取走' : target.condition === 'fallen' ? '已陨落' : `HP${target.hp}/${target.maxHp}，对你的认可${target.respect[agent.id] ?? 0}`;
      lines.push(`目标泰坦：${target.name} 位于${target.location}（${status}）`);
    }
    const open = Object.values(s.agents)
      .filter((a): a is TitanStatus => isTitan(a) && !a.emberTaken)
      .map(t => `${t.name}@${t.location}${t.disposition === 'corrupted' ? '(侵染)' : ''}`)
      .join('、');
    if (s.phase === 'flamechase') lines.push(`仍守着火种的泰坦：${open || '无'}`);
    const powers = engine.heirs().filter(h => h.demigod.length && h.condition === 'active')
      .map(h => `${h.name}·${DEMIGOD_POWERS[h.path]?.name ?? h.path}`).join('、');
    if (powers) lines.push(`生效中的半神神职：${powers}`);
    if (s.imprint.count) lines.push(`【轮回印记×${s.imprint.count}】${s.imprint.notes.slice(-3).join(' ')}`);
  } else if (isTitan(agent)) {
    const respect = Object.entries(agent.respect).map(([id, v]) => `${s.agents[id]?.name ?? id}:${v}`).join('、') || '无';
    lines.push(`你的火种：${agent.emberTaken ? '已不在你手中' : '仍在守护'}；对黄金裔的认可：${respect}`);
  }

  const thief = engine.enemy('flamethief');
  if (thief && s.phase === 'flamechase') {
    const stolen = thief.embers.map(id => s.embers[id]?.name).join('、');
    lines.push(`【盗火行者】${thief.condition === 'active' ? `位于${thief.location}，HP${thief.hp}/${thief.maxHp}` : '暂时被击退'}${stolen ? `，夺走了${stolen}` : ''}`);
  }
  const tomb = engine.enemy('irontomb');
  if (s.phase === 'irontomb' && tomb && s.finale) {
    const front = engine.agentsIn(RECREATION_SITE).filter(a => !isEnemy(a) && a.condition === 'active').map(a => a.name).join('、') || '无人';
    const fallen = Object.values(s.cities).filter(c => c.fallen).map(c => c.name).join('、') || '无';
    lines.push(`【最终之战·第${s.day - s.finale.startDay + 1}日】铁墓 HP${tomb.hp}/${tomb.maxHp} @${RECREATION_SITE}，前线士气${Math.round(s.finale.morale)}，前线：${front}；已沦陷城邦：${fallen}`);
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
