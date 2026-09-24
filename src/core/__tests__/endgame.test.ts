import { describe, expect, it } from 'vitest';
import { OmphalosSimulation } from '../llmSimulation';
import { isHeir, type EnemyStatus, type HeirStatus, type TitanStatus } from '../omphalosWorldState';
import { RECREATION_SITE } from '../config/cities';

const heir = (sim: OmphalosSimulation, id: string) => sim.state.agents[id] as HeirStatus;
const otherHeir = (sim: OmphalosSimulation, not: string[]) =>
  Object.values(sim.state.agents).find(a => isHeir(a) && !not.includes(a.id)) as HeirStatus;

describe('火种归属与代为归还', () => {
  it('泰坦只把火种授予对应路径的黄金裔；代为归还时由主人成为半神', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const phainon = heir(sim, 'phainon');
    const kephale = sim.state.agents.kephale as TitanStatus;
    const other = otherHeir(sim, ['phainon']);

    other.location = kephale.location;
    kephale.respect[other.id] = 50;
    expect(e.execute(kephale, { type: 'BESTOW_EMBER', targetId: other.id }).ok).toBe(false);

    phainon.location = kephale.location;
    kephale.respect.phainon = 50;
    expect(e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' }).ok).toBe(true);
    expect(sim.state.agents.flamethief).toBeDefined();

    other.location = phainon.location;
    expect(e.execute(phainon, { type: 'HAND_EMBER', targetId: other.id }).ok).toBe(true);
    expect(other.embers).toHaveLength(1);

    other.location = RECREATION_SITE;
    expect(e.execute(other, { type: 'RETURN_EMBER' }).ok).toBe(true);
    expect(phainon.demigod).toContain(phainon.path);
    expect(other.demigod).not.toContain(phainon.path);
  });
});

describe('盗火行者', () => {
  it('击倒携火者夺走火种，被击退后交出火种', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const kephale = sim.state.agents.kephale as TitanStatus;
    const phainon = heir(sim, 'phainon');
    phainon.location = kephale.location;
    kephale.respect.phainon = 50;
    e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' });
    const thief = sim.state.agents.flamethief as EnemyStatus;
    const emberId = phainon.embers[0];

    phainon.location = thief.location;
    phainon.hp = 1;
    (e as any).tickFlamethief();
    expect(phainon.condition).toBe('down');
    expect(thief.embers).toContain(emberId);
    expect(sim.state.embers[emberId].holderId).toBe('flamethief');

    const hunter = otherHeir(sim, ['phainon']);
    hunter.location = thief.location;
    hunter.power = 999;
    for (let i = 0; i < 20 && thief.condition === 'active'; i++) e.execute(hunter, { type: 'ATTACK', targetId: 'flamethief' });
    expect(thief.condition).toBe('down');
    expect(hunter.embers).toContain(emberId);
    expect(sim.state.embers[emberId].holderId).toBe(hunter.id);
  });
});

describe('最终之战', () => {
  const finaleSim = () => {
    const sim = new OmphalosSimulation({ npcCount: 3 });
    for (const em of Object.values(sim.state.embers)) { em.returned = true; em.holderId = 'phainon'; }
    for (const h of Object.values(sim.state.agents)) if (isHeir(h)) h.demigod.push(h.path);
    sim.engine.endDay();
    return sim;
  };

  it('十二火种归还后铁墓降临，泰坦可以移动并支援前线', () => {
    const sim = finaleSim();
    const s = sim.state;
    expect(s.phase).toBe('irontomb');
    expect(s.agents.irontomb).toBeDefined();
    expect(s.agents.flamethief).toBeUndefined();

    const allowed = (sim as any).allowedFor(s.agents.kephale);
    expect(allowed).toContain('MOVE');
    expect(allowed).toContain('SUPPORT_FRONT');

    const npc = Object.values(s.agents).find(a => a.kind === 'npc')!;
    npc.inventory.food = 10;
    expect(sim.engine.execute(npc, { type: 'SUPPORT_FRONT' }).ok).toBe(true);
    expect(s.finale!.morale).toBeGreaterThan(0);
    expect(sim.engine.execute(s.agents.kephale, { type: 'MOVE', targetCity: RECREATION_SITE }).ok).toBe(true);
  });

  it('击碎铁墓即打破轮回', () => {
    const sim = finaleSim();
    const s = sim.state;
    const hero = heir(sim, 'phainon');
    hero.location = RECREATION_SITE;
    hero.power = 50_000;
    sim.engine.execute(hero, { type: 'ATTACK', targetId: 'irontomb' });
    expect(s.agents.irontomb.condition).toBe('fallen');
    expect(s.phase).toBe('ended');
    (sim as any).liberate('测试');
    expect(s.ending).toBeDefined();
    expect(s.eraHistory.at(-1)!.outcome).toBe('liberation');
  });

  it('逐火阶段不能使用 SUPPORT_FRONT，泰坦不能离开领域', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const allowed = (sim as any).allowedFor(sim.state.agents.kephale);
    expect(allowed).not.toContain('MOVE');
    expect(allowed).not.toContain('SUPPORT_FRONT');
  });
});

describe('永劫回归与轮回印记', () => {
  it('黑潮吞没世界后进入新纪元，黄金裔带着印记变强', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const basePower = heir(sim, 'phainon').power;
    for (const c of Object.values(sim.state.cities)) c.darkTide = 99;
    let reason = '';
    const orig = sim.engine.onEraEnd!;
    sim.engine.onEraEnd = (o, r) => { reason = r; orig(o, r); };
    sim.engine.endDay();
    expect(reason).not.toBe('');
    (sim as any).startNewEra(reason);
    const s = sim.state;
    expect(s.era).toBe(2);
    expect(s.phase).toBe('flamechase');
    expect(s.imprint.count).toBe(1);
    expect(s.eraHistory[0].outcome).toBe('collapse');
    expect(heir(sim, 'phainon').power).toBe(basePower + 2);
  });
});
