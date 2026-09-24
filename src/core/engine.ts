// 世界引擎：动作结算、世界演化（黑潮、事件、敌对单位、最终之战、纪元轮回）。不包含任何模型调用。
import {
  type AgentStatus, type CityState, type EnemyStatus, type EnemyType, type HeirStatus, type LogType,
  type OmphalosWorldState, type TitanStatus, type WorldLog,
  LOG_LIMIT, MESSAGE_LIMIT, cityDistance, collectedEmberCount, returnedEmberCount,
  isEnemy, isHeir, isNpc, isTitan, nextHop
} from './omphalosWorldState';
import type { Action } from './agent/actions';
import { getItem } from './recipes';
import { RECREATION_SITE, SAFE_HAVEN } from './config/cities';
import { DEMIGOD_POWERS } from './config/demigods';

export interface ActionResult {
  ok: boolean;
  message: string;          // 反馈给行动者本人的结果
}

export type EraOutcome = 'collapse' | 'liberation';

type Listener = () => void;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export const FLAMETHIEF_ID = 'flamethief';
export const IRONTOMB_ID = 'irontomb';
const FINALE_DAY_LIMIT = 40;

export class WorldEngine {
  private logSeq = 0;
  private msgSeq = 0;
  // 本日收到消息的代理 -> 发信人列表（用于当日回应阶段）
  readonly inbox = new Map<string, string[]>();
  onEraEnd?: (outcome: EraOutcome, reason: string) => void;

  constructor(public state: OmphalosWorldState, private notify: Listener = () => {}) {}

  // ---------- 查询 ----------
  agent(id: string): AgentStatus | undefined {
    return this.state.agents[id];
  }

  // 模型常用名字代替ID，这里做宽松匹配
  resolveAgent(ref: string): AgentStatus | undefined {
    if (!ref) return undefined;
    const agents = this.state.agents;
    if (agents[ref]) return agents[ref];
    const clean = ref.replace(/[（(].*?[)）]/g, '').trim();
    const list = Object.values(agents);
    return list.find(a => a.name === clean)
      ?? list.find(a => a.id.toLowerCase() === clean.toLowerCase())
      ?? list.find(a => clean.includes(a.name) || a.name.includes(clean));
  }

  resolveCity(ref: string): CityState | undefined {
    const cities = this.state.cities;
    if (cities[ref]) return cities[ref];
    return Object.values(cities).find(c => ref.includes(c.name) || c.name.includes(ref));
  }

  agentsIn(city: string, exceptId?: string): AgentStatus[] {
    return Object.values(this.state.agents).filter(a => a.location === city && a.id !== exceptId && a.condition === 'active');
  }

  heirs(): HeirStatus[] {
    return Object.values(this.state.agents).filter(isHeir);
  }

  // 路径对应的黄金裔（火种的主人）
  heirOfPath(path: string): HeirStatus | undefined {
    return this.heirs().find(h => h.path === path);
  }

  // 某项神职是否生效：对应半神在世；给定城邦时还要求同城
  demigodActive(path: string, city?: string): HeirStatus | undefined {
    return this.heirs().find(h => h.condition === 'active' && h.demigod.includes(path) && (!city || h.location === city));
  }

  enemy(type: EnemyType): EnemyStatus | undefined {
    const e = this.state.agents[type === 'flamethief' ? FLAMETHIEF_ID : IRONTOMB_ID];
    return isEnemy(e) ? e : undefined;
  }

  private fallenCityCount(): number {
    return Object.values(this.state.cities).filter(c => c.fallen).length;
  }

  attackPower(a: AgentStatus): number {
    const w = a.weapon ? getItem(a.weapon)?.power ?? 0 : 0;
    let power = a.power + w;
    if (isHeir(a)) {
      power += (a.level - 1) * 2 + a.embers.length * 3;
      if (this.demigodActive('理性')) power += 3;
      if (a.demigod.includes('纷争')) power = Math.round(power * 1.5);
    }
    // 最终之战：前线士气提升创世涡心友方的攻击
    const finale = this.state.finale;
    if (finale && !isEnemy(a) && a.location === RECREATION_SITE) power += Math.min(10, Math.floor(finale.morale / 10));
    return power;
  }

  defensePower(a: AgentStatus): number {
    const arm = a.armor ? getItem(a.armor)?.defense ?? 0 : 0;
    let def = a.defense + arm;
    if (isHeir(a)) def += a.level - 1;
    if (!isEnemy(a) && this.demigodActive('律法', a.location)) def += 5;
    // 每座沦陷的城邦都让铁墓更坚固
    if (isEnemy(a) && a.enemyType === 'irontomb') def += this.fallenCityCount() * 3;
    return def;
  }

  // 伤害修正：负世庇护、防御姿态
  private mitigate(target: AgentStatus, dmg: number): number {
    if (!isEnemy(target) && this.demigodActive('负世', target.location)) dmg *= 0.7;
    if (target.guarding) dmg /= 2;
    return Math.max(1, Math.round(dmg));
  }

  // ---------- 日志 ----------
  log(type: LogType, message: string, importance: WorldLog['importance'] = 'medium', extra: Partial<WorldLog> = {}) {
    const logs = this.state.logs;
    logs.push({ id: ++this.logSeq, day: this.state.day, era: this.state.era, type, message, importance, ...extra });
    if (logs.length > LOG_LIMIT) logs.splice(0, logs.length - LOG_LIMIT);
    this.notify();
  }

  private relate(a: AgentStatus, b: AgentStatus, delta: number) {
    a.relations[b.id] = clamp((a.relations[b.id] ?? 0) + delta, -100, 100);
  }

  private addItem(a: AgentStatus, item: string, n: number) {
    a.inventory[item] = (a.inventory[item] ?? 0) + n;
    if (a.inventory[item] <= 0) delete a.inventory[item];
  }

  private hasItems(a: AgentStatus, items: Record<string, number>) {
    return Object.entries(items).every(([k, n]) => (a.inventory[k] ?? 0) >= n);
  }

  private describeItems(items: Record<string, number>) {
    return Object.entries(items).map(([k, n]) => `${k}×${n}`).join('、') || '无';
  }

  // ---------- 动作结算 ----------
  execute(actor: AgentStatus, action: Action): ActionResult {
    if (actor.condition !== 'active') return { ok: false, message: '你已倒下，无法行动' };
    actor.counters.actions++;
    const res = this.dispatch(actor, action);
    if (!res.ok) {
      actor.counters.failures++;
      this.log('failure', `${actor.name} 的 ${action.type} 失败：${res.message}`, 'low', { agentId: actor.id, location: actor.location });
    }
    return res;
  }

  private sameCityTarget(actor: AgentStatus, ref: string): AgentStatus | string {
    const target = this.resolveAgent(ref);
    if (!target) return `找不到“${ref}”`;
    if (target.id === actor.id) return '不能以自己为目标';
    if (target.location !== actor.location) return `${target.name} 不在${actor.location}（在${target.location}）`;
    if (target.condition !== 'active') return `${target.name} 已经倒下`;
    return target;
  }

  private dispatch(actor: AgentStatus, action: Action): ActionResult {
    const city = this.state.cities[actor.location];
    switch (action.type) {
      case 'MOVE': {
        if (isTitan(actor) && this.state.phase !== 'irontomb') return { ok: false, message: '泰坦不会离开自己的领域（最终之战时除外）' };
        const dest = this.resolveCity(action.targetCity);
        if (!dest) return { ok: false, message: `没有名为“${action.targetCity}”的城邦` };
        if (dest.id === actor.location) return { ok: false, message: `你已经在${dest.name}` };
        const from = actor.location;
        let hop = nextHop(this.state.cities, actor.location, dest.id);
        if (!hop) return { ok: false, message: `无法从${actor.location}抵达${dest.name}` };
        let via = '';
        if (isHeir(actor) && actor.demigod.includes('门径')) {
          hop = dest.id;
          via = '（穿过万径之门）';
        } else if (isHeir(actor) && this.demigodActive('天空') && hop !== dest.id) {
          hop = nextHop(this.state.cities, hop, dest.id) ?? hop;
          via = '（经天空桥梁）';
        }
        actor.location = hop;
        const tail = hop === dest.id ? '' : `（前往${dest.name}途中）`;
        this.log('move', `${actor.name} 从${from}来到${hop}${via}${tail}`, isTitan(actor) ? 'high' : 'low', { agentId: actor.id, location: hop });
        return { ok: true, message: `抵达${hop}${via}${tail}` };
      }

      case 'CHAT': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (isEnemy(t)) return { ok: false, message: `${t.name}不会回应任何言语` };
        this.pushMessage(actor, t, action.content);
        return { ok: true, message: `对${t.name}说了话` };
      }

      case 'INSPECT': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        const extra = isHeir(t) ? `携带火种${t.embers.length}枚，等级${t.level}`
          : isTitan(t) ? `火种${t.emberTaken ? '已失' : '仍在'}，对你的认可${t.respect[actor.id] ?? 0}`
          : isEnemy(t) ? `敌对单位${t.embers.length ? `，夺走了${t.embers.length}枚火种` : ''}`
          : `身份${t.subtitle}`;
        return { ok: true, message: `${t.name}: HP ${t.hp}/${t.maxHp}，攻${this.attackPower(t)} 防${this.defensePower(t)}，${extra}，物品 ${this.describeItems(t.inventory)}` };
      }

      case 'FORM_ALLIANCE': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (isEnemy(t)) return { ok: false, message: `${t.name}是敌人` };
        if (isTitan(t) && t.disposition === 'corrupted') return { ok: false, message: `${t.name} 已被黑潮侵染，不会与你结盟` };
        if (!actor.allies.includes(t.id)) actor.allies.push(t.id);
        if (!t.allies.includes(actor.id)) t.allies.push(actor.id);
        this.relate(actor, t, 20); this.relate(t, actor, 20);
        this.log('social', `${actor.name} 与 ${t.name} 结为同盟`, 'medium', { agentId: actor.id, targetId: t.id, location: actor.location });
        return { ok: true, message: `与${t.name}结盟` };
      }

      case 'ATTACK': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        return this.combat(actor, t);
      }

      case 'DEFEND':
        actor.guarding = true;
        return { ok: true, message: '进入防御姿态' };

      case 'REST': {
        const heal = Math.round(actor.maxHp * (city?.fallen ? 0.1 : 0.2));
        const before = actor.hp;
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        return { ok: true, message: `休息，生命 ${before}→${actor.hp}` };
      }

      case 'GATHER': {
        if (!city) return { ok: false, message: '无处采集' };
        const stock = city.resources[action.resource];
        if (stock <= 0) return { ok: false, message: `${city.name}的${action.resource}已经枯竭` };
        const amount = Math.min(stock, 3 + Math.floor(Math.random() * 4));
        city.resources[action.resource] -= amount;
        this.addItem(actor, action.resource, amount);
        return { ok: true, message: `采集了${action.resource}×${amount}` };
      }

      case 'CRAFT': {
        const item = getItem(action.itemName);
        if (!item) return { ok: false, message: `不知道如何制作“${action.itemName}”` };
        if (!this.hasItems(actor, item.materials)) return { ok: false, message: `材料不足，需要${this.describeItems(item.materials)}` };
        for (const [k, n] of Object.entries(item.materials)) this.addItem(actor, k, -n);
        let note = '';
        if (item.kind === 'weapon' && (item.power ?? 0) > (getItem(actor.weapon ?? '')?.power ?? 0)) {
          if (actor.weapon) this.addItem(actor, actor.weapon, 1);
          actor.weapon = item.name; note = '并装备';
        } else if (item.kind === 'armor' && (item.defense ?? 0) > (getItem(actor.armor ?? '')?.defense ?? 0)) {
          if (actor.armor) this.addItem(actor, actor.armor, 1);
          actor.armor = item.name; note = '并装备';
        } else {
          this.addItem(actor, item.name, 1);
        }
        this.log('economy', `${actor.name} 制作了${item.name}${note}`, 'low', { agentId: actor.id, location: actor.location });
        return { ok: true, message: `制作了${item.name}${note}` };
      }

      case 'USE_ITEM': {
        const item = getItem(action.itemName);
        if (!item || item.kind !== 'consumable') {
          // 允许直接装备背包中的武器/护甲
          if (item && (actor.inventory[item.name] ?? 0) > 0) {
            const slot = item.kind === 'weapon' ? 'weapon' : 'armor';
            const prev = actor[slot];
            this.addItem(actor, item.name, -1);
            if (prev) this.addItem(actor, prev, 1);
            actor[slot] = item.name;
            return { ok: true, message: `装备了${item.name}` };
          }
          return { ok: false, message: `“${action.itemName}”不是可用的物品` };
        }
        if ((actor.inventory[item.name] ?? 0) <= 0) return { ok: false, message: `背包里没有${item.name}` };
        this.addItem(actor, item.name, -1);
        if (item.heal) actor.hp = Math.min(actor.maxHp, actor.hp + item.heal);
        if (item.cleanse && city) city.darkTide = Math.max(0, city.darkTide - item.cleanse);
        return { ok: true, message: `使用了${item.name}` };
      }

      case 'TRADE': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (isEnemy(t)) return { ok: false, message: `${t.name}是敌人` };
        if (!Object.keys(action.offer).length && !Object.keys(action.request).length) return { ok: false, message: '交易内容为空' };
        if (!this.hasItems(actor, action.offer)) return { ok: false, message: `你没有足够的${this.describeItems(action.offer)}` };
        if (!this.hasItems(t, action.request)) return { ok: false, message: `${t.name}没有足够的${this.describeItems(action.request)}` };
        const give = Object.values(action.offer).reduce((a, b) => a + b, 0);
        const take = Object.values(action.request).reduce((a, b) => a + b, 0);
        const goodwill = t.relations[actor.id] ?? 0;
        if (take > give * 1.5 + goodwill / 10 + 1) return { ok: false, message: `${t.name}觉得这笔交易太不公平，拒绝了` };
        for (const [k, n] of Object.entries(action.offer)) { this.addItem(actor, k, -n); this.addItem(t, k, n); }
        for (const [k, n] of Object.entries(action.request)) { this.addItem(t, k, -n); this.addItem(actor, k, n); }
        this.relate(actor, t, 3); this.relate(t, actor, 3);
        this.log('economy', `${actor.name} 与 ${t.name} 交易：以${this.describeItems(action.offer)}换取${this.describeItems(action.request)}`, 'low', { agentId: actor.id, targetId: t.id, location: actor.location });
        return { ok: true, message: `与${t.name}完成交易` };
      }

      case 'GIFT': {
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (isEnemy(t)) return { ok: false, message: `${t.name}是敌人` };
        if (!this.hasItems(actor, action.items)) return { ok: false, message: `你没有足够的${this.describeItems(action.items)}` };
        for (const [k, n] of Object.entries(action.items)) { this.addItem(actor, k, -n); this.addItem(t, k, n); }
        this.relate(t, actor, 8);
        if (isTitan(actor) && isHeir(t)) actor.respect[t.id] = (actor.respect[t.id] ?? 0) + 5;
        this.log('economy', `${actor.name} 赠予 ${t.name} ${this.describeItems(action.items)}`, 'low', { agentId: actor.id, targetId: t.id, location: actor.location });
        return { ok: true, message: `赠予${t.name}${this.describeItems(action.items)}` };
      }

      case 'BUILD_DEFENSE': {
        if (!city) return { ok: false, message: '无处建造' };
        const cost = 5;
        if ((actor.inventory.materials ?? 0) >= cost) this.addItem(actor, 'materials', -cost);
        else if (city.resources.materials >= cost * 2) city.resources.materials -= cost * 2;
        else return { ok: false, message: '材料不足（需要背包materials×5，或城邦库存≥10）' };
        if (action.defenseType === 'WATCHTOWER') city.watchtowers++; else city.walls++;
        this.log('economy', `${actor.name} 为${city.name}修筑了${action.defenseType === 'WALL' ? '城墙' : '瞭望塔'}`, 'low', { agentId: actor.id, location: city.id });
        return { ok: true, message: `${city.name}城防提升（墙${city.walls} 塔${city.watchtowers}）` };
      }

      case 'CLEANSE': {
        if (!city) return { ok: false, message: '无处净化' };
        if (city.darkTide <= 0.5) return { ok: false, message: `${city.name}没有黑潮` };
        const amount = round1(Math.min(city.darkTide, 1 + this.attackPower(actor) / 14 + (isTitan(actor) ? 2 : 0)));
        city.darkTide = round1(city.darkTide - amount);
        const cost = isTitan(actor) ? 0 : Math.ceil(amount);
        actor.hp = Math.max(1, actor.hp - cost);
        if (isHeir(actor)) {
          this.gainXp(actor, 4);
          for (const id of city.titanIds) {
            const titan = this.agent(id);
            if (isTitan(titan)) titan.respect[actor.id] = (titan.respect[actor.id] ?? 0) + 6;
          }
        }
        if (city.fallen && city.darkTide < 60) {
          city.fallen = false;
          this.log('tide', `${city.name} 从黑潮中被夺回！`, 'high', { location: city.id, agentId: actor.id });
        }
        this.log('tide', `${actor.name} 净化了${city.name}的黑潮（-${amount}，现为${city.darkTide.toFixed(1)}%）`, 'low', { agentId: actor.id, location: city.id });
        return { ok: true, message: `净化了${amount}点黑潮${cost ? `，消耗${cost}生命` : ''}` };
      }

      case 'BESTOW_EMBER': {
        if (!isTitan(actor)) return { ok: false, message: '只有泰坦能授予火种' };
        if (actor.emberTaken) return { ok: false, message: '你的火种已经不在了' };
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (!isHeir(t)) return { ok: false, message: '火种只能授予黄金裔' };
        if (t.path !== actor.path) return { ok: false, message: `「${actor.path}」的火种只认「${actor.path}」的黄金裔（${this.heirOfPath(actor.path)?.name ?? '无人'}）` };
        if (actor.disposition === 'corrupted') return { ok: false, message: '被黑潮侵染的你无法放手火种' };
        if ((actor.respect[t.id] ?? 0) < 30) return { ok: false, message: `${t.name}尚未得到足够的认可（${actor.respect[t.id] ?? 0}/30）` };
        this.transferEmber(actor, t, 'bestow');
        return { ok: true, message: `将火种授予了${t.name}` };
      }

      case 'HAND_EMBER': {
        if (!isHeir(actor)) return { ok: false, message: '只有黄金裔能携带火种' };
        if (!actor.embers.length) return { ok: false, message: '你身上没有火种' };
        const t = this.sameCityTarget(actor, action.targetId);
        if (typeof t === 'string') return { ok: false, message: t };
        if (!isHeir(t)) return { ok: false, message: '火种只能交给黄金裔' };
        const names = actor.embers.map(id => this.state.embers[id].name);
        for (const id of actor.embers) this.state.embers[id].holderId = t.id;
        t.embers.push(...actor.embers);
        actor.embers = [];
        this.relate(t, actor, 15);
        this.log('ember', `${actor.name} 将${names.join('、')}托付给了${t.name}`, 'high', { agentId: actor.id, targetId: t.id, location: actor.location });
        return { ok: true, message: `把${names.join('、')}交给了${t.name}` };
      }

      case 'RETURN_EMBER': {
        if (!isHeir(actor)) return { ok: false, message: '只有黄金裔能归还火种' };
        if (actor.location !== RECREATION_SITE) return { ok: false, message: `火种只能在${RECREATION_SITE}归还` };
        if (!actor.embers.length) return { ok: false, message: '你身上没有尚未归还的火种' };
        const parts: string[] = [];
        for (const id of actor.embers) {
          const ember = this.state.embers[id];
          ember.returned = true;
          // 火种只认对应路径的黄金裔：替他人归还时，由主人承载神权
          const owner = this.heirOfPath(ember.path) ?? actor;
          if (!owner.demigod.includes(ember.path)) owner.demigod.push(ember.path);
          owner.maxHp += 30;
          owner.power += 4;
          owner.defense += 2;
          owner.hp = owner.condition === 'active' ? owner.maxHp : owner.hp;
          owner.subtitle = `「${owner.demigod.join('」「')}」的半神`;
          const power = DEMIGOD_POWERS[ember.path];
          parts.push(owner.id === actor.id
            ? `${ember.name}，成为「${ember.path}」的半神${power ? `（神职：${power.name}）` : ''}`
            : `${ember.name}（代${owner.name}归还，${owner.name}成为「${ember.path}」的半神${power ? `，神职：${power.name}` : ''}）`);
        }
        actor.embers = [];
        this.gainXp(actor, 40);
        this.log('ember', `${actor.name} 在创世涡心归还了${parts.join('；')}，星宿亮起（${returnedEmberCount(this.state)}/12）`, 'critical',
          { agentId: actor.id, location: RECREATION_SITE });
        return { ok: true, message: `归还了火种：${parts.join('；')}` };
      }

      case 'SUPPORT_FRONT': {
        const finale = this.state.finale;
        if (this.state.phase !== 'irontomb' || !finale) return { ok: false, message: '铁墓尚未降临，没有需要支援的前线' };
        if (city?.fallen) return { ok: false, message: `${city.name}已被黑潮吞没，无法组织支援` };
        let gain = 6;
        if (isTitan(actor)) {
          if (actor.hp <= 25) return { ok: false, message: '你的神力已不足以支援前线' };
          actor.hp -= 20;
          gain = 10;
        } else {
          const res = (['materials', 'mana', 'food'] as const).find(r => (actor.inventory[r] ?? 0) >= 5);
          if (!res) return { ok: false, message: '背包里没有足够的物资（任意一种×5）' };
          this.addItem(actor, res, -5);
        }
        finale.morale = Math.min(200, finale.morale + gain);
        this.log('economy', `${actor.name} 从${actor.location}向前线输送支援（士气 ${Math.round(finale.morale)}）`, 'low', { agentId: actor.id, location: actor.location });
        return { ok: true, message: `前线士气+${gain}` };
      }
    }
  }

  private combat(attacker: AgentStatus, target: AgentStatus): ActionResult {
    const city = this.state.cities[attacker.location];
    // 同城的盟友协同作战；讨伐敌对单位时，同城的所有友方都会协同
    const pool = isEnemy(target)
      ? this.agentsIn(attacker.location, attacker.id).filter(a => !isEnemy(a))
      : attacker.allies.map(id => this.agent(id)).filter((a): a is AgentStatus => !!a);
    const helpers = pool
      .filter(a => a.location === attacker.location && a.condition === 'active' && a.id !== target.id && !a.allies.includes(target.id))
      .sort((x, y) => this.attackPower(y) - this.attackPower(x))
      .slice(0, 3);
    const assistRate = this.demigodActive('浪漫') ? 0.8 : 0.5;
    const assist = helpers.reduce((sum, h) => sum + this.attackPower(h) * assistRate, 0);
    const roll = 0.85 + Math.random() * 0.3;
    const dmg = this.mitigate(target, (this.attackPower(attacker) + assist) * roll - this.defensePower(target) * 0.5);
    target.hp -= dmg;
    attacker.counters.damageDealt += dmg;
    this.relate(target, attacker, -25);
    const withHelp = helpers.length ? `（与${helpers.map(h => h.name).join('、')}协同）` : '';
    const verb = isTitan(target) ? '挑战' : isEnemy(target) ? '讨伐' : '攻击';
    const important = isTitan(target) || isEnemy(target);
    this.log('combat', `${attacker.name}${withHelp}${verb}${target.name}，造成${dmg}点伤害（剩余${Math.max(0, target.hp)}/${target.maxHp}）`,
      important ? 'high' : 'medium', { agentId: attacker.id, targetId: target.id, location: city?.id });

    if (isHeir(attacker)) this.gainXp(attacker, important ? 6 : 3);

    if (target.hp <= 0) {
      this.defeat(target, attacker);
      return { ok: true, message: `击败了${target.name}` };
    }

    // 泰坦、战士与盗火行者会立即反击；铁墓不反击，而是每日对前线降下毁灭
    const counters = isTitan(target) || isHeir(target) || (isNpc(target) && target.role === 'GUARD')
      || (isEnemy(target) && target.enemyType === 'flamethief');
    if (counters) {
      const back = this.mitigate(attacker, this.attackPower(target) * (0.8 + Math.random() * 0.3) - this.defensePower(attacker) * 0.5);
      attacker.hp -= back;
      this.log('combat', `${target.name}反击，${attacker.name}受到${back}点伤害（剩余${Math.max(0, attacker.hp)}）`, 'medium',
        { agentId: target.id, targetId: attacker.id, location: city?.id });
      if (isTitan(target) && isHeir(attacker)) target.respect[attacker.id] = (target.respect[attacker.id] ?? 0) + 4;
      if (attacker.hp <= 0) {
        this.defeat(attacker, target);
        return { ok: true, message: `造成${dmg}伤害，但被${target.name}的反击击倒` };
      }
      return { ok: true, message: `造成${dmg}伤害，受到反击${back}` };
    }
    return { ok: true, message: `造成${dmg}伤害` };
  }

  private defeat(loser: AgentStatus, winner: AgentStatus) {
    loser.hp = 0;
    if (isTitan(loser)) {
      loser.condition = 'fallen';
      this.log('combat', `泰坦${loser.name}被${winner.name}击败！`, 'critical', { agentId: winner.id, targetId: loser.id, location: loser.location });
      if (!loser.emberTaken && isHeir(winner)) this.transferEmber(loser, winner, 'conquest');
      else if (!loser.emberTaken) {
        // 非黄金裔击败泰坦：火种交给同城的黄金裔；无人则留待第一位抵达的黄金裔拾起
        const heir = this.agentsIn(loser.location).find(isHeir);
        if (heir) this.transferEmber(loser, heir, 'conquest');
      }
      return;
    }

    if (isEnemy(loser)) {
      if (loser.enemyType === 'irontomb') {
        loser.condition = 'fallen';
        this.log('era', `铁墓在${winner.name}的一击下崩解！十二位半神击碎了「毁灭」的劫火。`, 'critical',
          { agentId: winner.id, targetId: loser.id, location: loser.location });
        this.onEraEnd?.('liberation', `${winner.name}给予铁墓最后一击`);
        return;
      }
      // 盗火行者：倒下并交出夺走的火种，数日后在远方重新现身
      loser.condition = 'down';
      loser.reviveDay = this.state.day + 4;
      if (loser.embers.length) {
        const receiver = isHeir(winner) ? winner : this.agentsIn(loser.location).find(isHeir);
        if (receiver) {
          const names = loser.embers.map(id => this.state.embers[id].name);
          for (const id of loser.embers) this.state.embers[id].holderId = receiver.id;
          receiver.embers.push(...loser.embers);
          loser.embers = [];
          this.log('ember', `${receiver.name}从盗火行者手中夺回了${names.join('、')}`, 'critical', { agentId: receiver.id, location: loser.location });
        }
      }
      this.log('combat', `盗火行者被${winner.name}击退，消失在黑潮之中`, 'high', { agentId: winner.id, targetId: loser.id, location: loser.location });
      return;
    }

    loser.condition = 'down';
    const deathMercy = this.demigodActive('死亡');
    loser.reviveDay = this.state.day + (deathMercy ? 1 : 2);
    if (isHeir(loser)) {
      loser.deaths++;
      if (isEnemy(winner) && winner.enemyType === 'flamethief' && loser.embers.length) this.stealEmber(winner, loser);
    }
    this.log('combat', `${loser.name} 被${winner.name}击倒，将在${deathMercy ? '一' : '两'}日后于${SAFE_HAVEN}苏醒`, 'high',
      { agentId: winner.id, targetId: loser.id, location: loser.location });
  }

  private stealEmber(thief: EnemyStatus, heir: HeirStatus) {
    const id = heir.embers[0];
    const ember = this.state.embers[id];
    if (this.demigodActive('诡计') && Math.random() < 0.5) {
      this.log('ember', `盗火行者从${heir.name}身上剥离出火种——却只抓到一个陶罐。翻飞之币的诡计得逞了`, 'high', { agentId: heir.id, location: heir.location });
      return;
    }
    heir.embers = heir.embers.filter(e => e !== id);
    ember.holderId = thief.id;
    thief.embers.push(id);
    this.log('ember', `盗火行者从倒下的${heir.name}身上夺走了${ember.name}！`, 'critical', { agentId: thief.id, targetId: heir.id, location: heir.location });
  }

  private transferEmber(titan: TitanStatus, heir: HeirStatus, how: 'bestow' | 'conquest') {
    const ember = this.state.embers[titan.emberId];
    titan.emberTaken = true;
    ember.holderId = heir.id;
    heir.embers.push(ember.id);
    this.gainXp(heir, 30);
    heir.maxHp += 20;
    heir.hp = Math.min(heir.maxHp, heir.hp + 40);
    const verb = how === 'bestow' ? `将${ember.name}授予了` : `的${ember.name}被夺取，归于`;
    const owner = this.heirOfPath(ember.path);
    const note = owner && owner.id !== heir.id ? `，它属于${owner.name}，可代为归还或交给其本人` : '';
    this.log('ember', `${titan.name}${verb}${heir.name}！（已取得${collectedEmberCount(this.state)}/12，须带往${RECREATION_SITE}归还${note}）`, 'critical',
      { agentId: heir.id, targetId: titan.id, location: titan.location });
    if (!this.enemy('flamethief')) this.spawnFlamethief(heir.location);
  }

  private gainXp(heir: HeirStatus, xp: number) {
    heir.xp += xp;
    const need = heir.level * 40;
    if (heir.xp >= need) {
      heir.xp -= need;
      heir.level++;
      heir.maxHp += 10;
      this.log('system', `${heir.name} 升到了 ${heir.level} 级`, 'medium', { agentId: heir.id });
    }
  }

  pushMessage(from: AgentStatus, to: AgentStatus, content: string) {
    const msgs = this.state.messages;
    msgs.push({ id: ++this.msgSeq, day: this.state.day, era: this.state.era, from: from.id, to: to.id, content, location: from.location });
    if (msgs.length > MESSAGE_LIMIT) msgs.splice(0, msgs.length - MESSAGE_LIMIT);
    from.counters.chats++;
    this.relate(to, from, 2);
    if (isTitan(to) && isHeir(from)) to.respect[from.id] = (to.respect[from.id] ?? 0) + 5;
    const list = this.inbox.get(to.id) ?? [];
    if (!list.includes(from.id)) list.push(from.id);
    this.inbox.set(to.id, list);
    this.log('chat', `${from.name} 对 ${to.name} 说：「${content}」`, 'medium', { agentId: from.id, targetId: to.id, location: from.location });
  }

  // ---------- 敌对单位 ----------
  private newEnemy(id: string, type: EnemyType, name: string, subtitle: string, location: string, hp: number, power: number, defense: number): EnemyStatus {
    const enemy: EnemyStatus = {
      id, name, kind: 'enemy', subtitle, location, hp, maxHp: hp, power, defense,
      inventory: {}, allies: [], relations: {}, condition: 'active',
      counters: { actions: 0, failures: 0, damageDealt: 0, chats: 0 },
      enemyType: type, embers: []
    };
    this.state.agents[id] = enemy;
    return enemy;
  }

  // 盗火行者在第一枚火种被取走后现身，出现在离持有者最远的地方
  private spawnFlamethief(near: string) {
    const location = this.farthestCity(near);
    this.newEnemy(FLAMETHIEF_ID, 'flamethief', '盗火行者', '觊觎众神火种的神秘剑士', location, 520, 42, 18);
    this.log('event', `【盗火行者】一名神秘剑士出现在${location}，开始追猎携带火种的黄金裔。结伴护送才能保住火种。`, 'critical', { location });
  }

  private farthestCity(from: string): string {
    const candidates = Object.keys(this.state.cities).filter(c => c !== RECREATION_SITE);
    return candidates.reduce((best, c) => {
      const d = cityDistance(this.state.cities, from, c);
      return d !== Infinity && d > cityDistance(this.state.cities, from, best) ? c : best;
    }, candidates[0]);
  }

  // 盗火行者：追向最近的火种携带者，同城则发起袭击
  private tickFlamethief() {
    const thief = this.enemy('flamethief');
    if (!thief || thief.condition !== 'active' || this.state.phase === 'ended') return;
    const carriers = this.heirs().filter(h => h.condition === 'active' && h.embers.length > 0);
    if (!carriers.length) return;
    const here = carriers.filter(h => h.location === thief.location).sort((a, b) => b.embers.length - a.embers.length);
    if (here.length) {
      const target = here[0];
      const dmg = this.mitigate(target, this.attackPower(thief) * (0.85 + Math.random() * 0.3) - this.defensePower(target) * 0.5);
      target.hp -= dmg;
      this.log('combat', `盗火行者袭击了${target.name}，造成${dmg}点伤害（剩余${Math.max(0, target.hp)}/${target.maxHp}）`, 'high',
        { agentId: thief.id, targetId: target.id, location: thief.location });
      if (target.hp <= 0) this.defeat(target, thief);
      return;
    }
    const nearest = carriers.reduce((best, h) =>
      cityDistance(this.state.cities, thief.location, h.location) < cityDistance(this.state.cities, thief.location, best.location) ? h : best);
    const hop = nextHop(this.state.cities, thief.location, nearest.location);
    if (hop) {
      thief.location = hop;
      this.log('move', `盗火行者循着火种的气息来到${hop}`, 'medium', { agentId: thief.id, location: hop });
    }
  }

  // 铁墓：每日对创世涡心的所有友方降下毁灭
  private tickIrontomb() {
    const tomb = this.enemy('irontomb');
    if (!tomb || tomb.condition !== 'active') return;
    const fallen = this.fallenCityCount();
    const targets = this.agentsIn(RECREATION_SITE).filter(a => !isEnemy(a));
    if (targets.length) {
      const hits: string[] = [];
      for (const t of targets) {
        const dmg = this.mitigate(t, (this.attackPower(tomb) + fallen * 3) * (0.8 + Math.random() * 0.3) - this.defensePower(t) * 0.5);
        t.hp -= dmg;
        hits.push(`${t.name}-${dmg}`);
        if (t.hp <= 0) this.defeat(t, tomb);
      }
      this.log('combat', `铁墓降下「毁灭」的劫火：${hits.join('，')}`, 'high', { agentId: tomb.id, location: RECREATION_SITE });
      // 毁灭之眼：再对前线最强的战士降下一击
      const standing = targets.filter(t => t.condition === 'active');
      if (standing.length) {
        const focus = standing.reduce((a, b) => this.attackPower(b) > this.attackPower(a) ? b : a);
        const dmg = this.mitigate(focus, (this.attackPower(tomb) + fallen * 3) * 1.2 - this.defensePower(focus) * 0.5);
        focus.hp -= dmg;
        this.log('combat', `铁墓的「毁灭之眼」锁定了${focus.name}，造成${dmg}点伤害（剩余${Math.max(0, focus.hp)}/${focus.maxHp}）`, 'high',
          { agentId: tomb.id, targetId: focus.id, location: RECREATION_SITE });
        if (focus.hp <= 0) this.defeat(focus, tomb);
      }
    }
    // 沦陷的城邦滋养铁墓
    if (fallen) tomb.hp = Math.min(tomb.maxHp, tomb.hp + Math.round(tomb.maxHp * 0.01 * fallen));
  }

  // 前线士气：治疗创世涡心的友方，随后逐日衰减
  private tickMorale() {
    const finale = this.state.finale;
    if (!finale || finale.morale <= 0) return;
    const heal = Math.min(25, Math.round(finale.morale / 4));
    for (const a of this.agentsIn(RECREATION_SITE)) if (!isEnemy(a)) a.hp = Math.min(a.maxHp, a.hp + heal);
    finale.morale = round1(finale.morale * 0.8);
  }

  private startFinale() {
    const s = this.state;
    s.phase = 'irontomb';
    s.finale = { startDay: s.day, morale: 0 };
    // 最终之战中盗火行者不再出现
    const thief = this.enemy('flamethief');
    if (thief) delete s.agents[thief.id];
    this.newEnemy(IRONTOMB_ID, 'irontomb', '铁墓', '「毁灭」的绝灭大君', RECREATION_SITE, 24000, 80, 26);
    this.log('era', '十二火种尽数归还——然而权杖深处，「毁灭」的方程式开始运转。绝灭大君「铁墓」在创世涡心降临！', 'critical', { location: RECREATION_SITE });
    this.log('event', '【最终之战】所有人都被召唤：半神与泰坦前往创世涡心迎战，居民守住城邦并向前线输送支援（SUPPORT_FRONT）。每座沦陷的城邦都会让铁墓更强。', 'critical');
  }

  // ---------- 每日开始 / 结束 ----------
  beginDay() {
    const s = this.state;
    s.day++;
    s.totalDays++;
    s.timeOfDay = (['dawn', 'noon', 'dusk', 'midnight'] as const)[s.day % 4];
    this.inbox.clear();
    const deathMercy = !!this.demigodActive('死亡');
    for (const a of Object.values(s.agents)) {
      a.guarding = false;
      if (a.condition === 'down' && (a.reviveDay ?? 0) <= s.day) {
        a.condition = 'active';
        if (isEnemy(a)) {
          a.hp = a.maxHp;
          a.location = this.farthestCity(a.location);
          this.log('event', `盗火行者在${a.location}重新现身`, 'high', { agentId: a.id, location: a.location });
          continue;
        }
        a.hp = Math.round(a.maxHp * (deathMercy ? 0.7 : 0.5));
        a.location = isTitan(a) ? a.location : SAFE_HAVEN;
        this.log('system', `${a.name} 在${a.location}苏醒`, 'low', { agentId: a.id, location: a.location });
      }
      // 陨落泰坦遗留的火种，由第一位抵达的黄金裔拾起
      if (isTitan(a) && a.condition === 'fallen' && !a.emberTaken) {
        const heir = this.agentsIn(a.location).find(isHeir);
        if (heir) this.transferEmber(a, heir, 'conquest');
      }
    }
    this.log('system', `—— 第${s.era}纪元 · 第${s.day}天${s.phase === 'irontomb' ? ' · 最终之战' : ''} ——`, 'high');
  }

  endDay() {
    if (this.state.phase === 'ended') return;
    this.tickFlamethief();
    this.tickIrontomb();
    if ((this.state.phase as string) === 'ended') { this.notify(); return; }
    this.tickDarkTide();
    this.tickRegen();
    this.tickMorale();
    this.rollWorldEvent();
    this.checkEraEnd();
    this.notify();
  }

  private tickDarkTide() {
    const s = this.state;
    const cities = Object.values(s.cities);
    const embers = returnedEmberCount(s);
    // 纪元越往后黑潮越凶；每枚归还的火种都会压制黑潮；铁墓降临时黑潮狂涌
    let base = s.darkTide.growth * (1 + (s.era - 1) * 0.15) * (1 - embers * 0.05);
    if (this.demigodActive('大地')) base *= 0.85;
    if (s.phase === 'irontomb') base *= 2.2;
    const snapshot = Object.fromEntries(cities.map(c => [c.id, c.darkTide]));
    for (const c of cities) {
      if (c.id === RECREATION_SITE) continue;
      const neighborAvg = c.neighbors.reduce((sum, n) => sum + (snapshot[n] ?? 0), 0) / Math.max(1, c.neighbors.length);
      const spread = Math.max(0, neighborAvg - c.darkTide) * 0.04;
      const mitigation = clamp((c.walls + c.watchtowers * 0.5) / 30, 0, 0.5);
      const titans = c.titanIds.map(id => s.agents[id]).filter((t): t is TitanStatus => isTitan(t) && t.condition === 'active' && t.location === c.id);
      const guard = titans.some(t => t.disposition !== 'corrupted') ? 0.6 : 1;
      const corruptBoost = titans.some(t => t.disposition === 'corrupted') ? 0.6 : 0;
      const delta = (base * (0.5 + Math.random()) + spread + corruptBoost) * (1 - mitigation) * guard;
      c.darkTide = round1(clamp(c.darkTide + delta, 0, 100));
      if (c.darkTide > 60) {
        c.prosperity = clamp(c.prosperity - 1, 0, 100);
        c.population = Math.max(0, Math.round(c.population * 0.995));
      }
      if (!c.fallen && c.darkTide >= 90) {
        c.fallen = true;
        this.log('tide', `${c.name} 被黑潮吞没了！${s.phase === 'irontomb' ? '铁墓的力量随之增长。' : ''}`, 'critical', { location: c.id });
      }
      // 身处重度黑潮中的人会受伤
      if (c.darkTide > 70) {
        for (const a of this.agentsIn(c.id)) if (!isTitan(a) && !isEnemy(a)) a.hp = Math.max(1, a.hp - 3);
      }
    }
    const active = cities.filter(c => c.id !== RECREATION_SITE);
    s.darkTide.global = round1(active.reduce((sum, c) => sum + c.darkTide, 0) / active.length);
    const fallen = active.filter(c => c.fallen).length;
    s.worldStability = round1(clamp(100 - s.darkTide.global * 0.9 - fallen * 4 + embers * 2, 0, 100));
  }

  private tickRegen() {
    const k0 = this.demigodActive('海洋') ? 2 : 1;
    for (const c of Object.values(this.state.cities)) {
      const k = (c.fallen ? 0.2 : 1) * k0;
      c.resources.food = Math.min(1500, c.resources.food + Math.round((5 + c.population / 1000) * k));
      c.resources.materials = Math.min(1500, c.resources.materials + Math.round(4 * k));
      c.resources.mana = Math.min(1000, c.resources.mana + Math.round(3 * k));
    }
    for (const a of Object.values(this.state.agents)) {
      if (a.condition !== 'active' || (isEnemy(a) && a.enemyType === 'irontomb')) continue;
      const rate = isTitan(a) || isEnemy(a) ? 0.02 : 0.03;
      a.hp = Math.min(a.maxHp, a.hp + Math.max(1, Math.round(a.maxHp * rate)));
    }
  }

  private rollWorldEvent() {
    const s = this.state;
    s.activeEvents = s.activeEvents.filter(e => e.endDay >= s.day);
    const cities = Object.values(s.cities).filter(c => c.id !== RECREATION_SITE);
    // 最终之战期间，黑潮每天在两座城邦涌起
    if (s.phase === 'irontomb') {
      for (let i = 0; i < 2; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        city.darkTide = clamp(city.darkTide + 4, 0, 100);
      }
    }
    if (Math.random() > 0.18) return;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const roll = Math.random();
    let name: string, description: string;
    if (roll < 0.4) {
      const surge = 6 + Math.round(Math.random() * 8);
      city.darkTide = clamp(city.darkTide + surge, 0, 100);
      name = '黑潮涌动'; description = `黑潮在${city.name}骤然涌起（+${surge}%）`;
    } else if (roll < 0.65) {
      city.resources.materials += 60; city.resources.mana += 40;
      name = '古代遗藏'; description = `${city.name}发现了一处古代遗藏，物资充盈`;
    } else if (roll < 0.85) {
      city.darkTide = Math.max(0, city.darkTide - 8);
      name = '晨曦之兆'; description = `一道黎明之光掠过${city.name}，黑潮退却`;
    } else {
      for (const a of this.agentsIn(city.id)) if (!isEnemy(a)) a.hp = Math.max(1, a.hp - 10);
      name = '天象异变'; description = `${city.name}上空雷霆翻涌，身处其中者皆受冲击`;
    }
    s.activeEvents.push({ id: `${s.era}-${s.day}-${name}`, name, description, location: city.id, startDay: s.day, endDay: s.day + 2 });
    this.log('event', `【${name}】${description}`, 'high', { location: city.id });
  }

  private checkEraEnd() {
    const s = this.state;
    const fallen = this.fallenCityCount();
    if (s.darkTide.global >= 85 || fallen >= 8) {
      this.onEraEnd?.('collapse', s.phase === 'irontomb' ? '最终之战中，黑潮吞没了翁法罗斯' : '黑潮吞没了翁法罗斯');
      return;
    }
    if (s.phase === 'flamechase') {
      if (returnedEmberCount(s) >= 12) this.startFinale();
      return;
    }
    if (s.phase === 'irontomb' && s.finale) {
      const heirs = this.heirs();
      if (heirs.length && heirs.every(h => h.condition !== 'active')) {
        this.onEraEnd?.('collapse', '所有黄金裔都倒在了铁墓面前');
      } else if (s.day - s.finale.startDay >= FINALE_DAY_LIMIT) {
        this.onEraEnd?.('collapse', `鏖战${FINALE_DAY_LIMIT}日后，铁墓吞噬了权杖`);
      }
    }
  }
}
