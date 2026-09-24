import { describe, expect, it } from 'vitest';
import { OmphalosSimulation } from '../llmSimulation';
import { respectThreshold } from '../engine';
import { buildUserPrompt } from '../agent/prompts';
import type { EnemyStatus, HeirStatus, TitanStatus } from '../omphalosWorldState';

describe('逐火阶段的节奏', () => {
  it('认可每天最多增长12，达到门槛前泰坦无法授予火种', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const kephale = sim.state.agents.kephale as TitanStatus;
    const phainon = sim.state.agents.phainon as HeirStatus;
    phainon.location = kephale.location;
    for (let i = 0; i < 6; i++) e.execute(phainon, { type: 'CHAT', targetId: 'kephale', content: '请认可我' });
    expect(kephale.respect.phainon).toBe(12);
    expect(e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' }).ok).toBe(false);
    for (let d = 0; d < 3; d++) {
      e.beginDay();
      for (let i = 0; i < 3; i++) e.execute(phainon, { type: 'CHAT', targetId: 'kephale', content: '请认可我' });
    }
    expect(kephale.respect.phainon).toBeGreaterThanOrEqual(respectThreshold(kephale.disposition));
    expect(e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' }).ok).toBe(true);
  });

  it('每天只能移动一次', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const heir = sim.state.agents.phainon;
    const start = heir.location;
    const [a] = sim.state.cities[start].neighbors;
    expect(e.execute(heir, { type: 'MOVE', targetCity: a }).ok).toBe(true);
    expect(e.execute(heir, { type: 'MOVE', targetCity: start }).ok).toBe(false);
    e.beginDay();
    expect(e.execute(heir, { type: 'MOVE', targetCity: start }).ok).toBe(true);
  });

  it('同一城邦一天内的净化收益递减', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const heir = sim.state.agents.phainon;
    const city = sim.state.cities[heir.location];
    city.darkTide = 50;
    const amounts: number[] = [];
    for (let i = 0; i < 3; i++) {
      const before = city.darkTide;
      e.execute(heir, { type: 'CLEANSE' });
      amounts.push(before - city.darkTide);
    }
    expect(amounts[1]).toBeLessThan(amounts[0]);
    expect(amounts[2]).toBeLessThan(amounts[1]);
  });

  it('盗火行者随火种变强，每次现身只遁走一次', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const e = sim.engine;
    const kephale = sim.state.agents.kephale as TitanStatus;
    const phainon = sim.state.agents.phainon as HeirStatus;
    phainon.location = kephale.location;
    kephale.respect.phainon = 99;
    e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' });
    const thief = sim.state.agents.flamethief as EnemyStatus;
    expect(thief.maxHp).toBe(670);
    thief.hp = 100;
    (e as any).tickFlamethief();
    expect(thief.fled).toBe(true);
    const where = thief.location;
    thief.hp = 100;
    (e as any).tickFlamethief();
    expect(thief.location === where || thief.hp < thief.maxHp * 0.35).toBe(true);
  });
});

describe('提示中的共享情报', () => {
  it('所有人都能看到未归还火种的去向，携火者能看到归途', () => {
    const sim = new OmphalosSimulation({ npcCount: 1 });
    const e = sim.engine;
    const kephale = sim.state.agents.kephale as TitanStatus;
    const phainon = sim.state.agents.phainon as HeirStatus;
    phainon.location = kephale.location;
    kephale.respect.phainon = 99;
    e.execute(kephale, { type: 'BESTOW_EMBER', targetId: 'phainon' });
    const npc = Object.values(sim.state.agents).find(a => a.kind === 'npc')!;
    const npcPrompt = buildUserPrompt(e, npc, sim.memoryOf(npc.id));
    expect(npcPrompt).toContain('【未归还的火种】');
    expect(npcPrompt).toContain(`负世(${phainon.name}携带@${phainon.location})`);
    const heirPrompt = buildUserPrompt(e, phainon, sim.memoryOf('phainon'));
    expect(heirPrompt).toMatch(/距此\d+天：/);
    const titanPrompt = buildUserPrompt(e, sim.state.agents.janus, sim.memoryOf('janus'));
    expect(titanPrompt).toContain('火种的主人：');
  });
});
