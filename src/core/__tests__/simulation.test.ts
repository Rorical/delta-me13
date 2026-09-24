import { describe, expect, it } from 'vitest';
import { OmphalosSimulation } from '../llmSimulation';
import { scriptedAdapter, cooperativePolicy } from './helpers';

describe('仿真循环', () => {
  it('随机乱填的行动不会让仿真崩溃', async () => {
    const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const adapter = scriptedAdapter((u, allowed) => {
      const ids = [...u.matchAll(/\[ID:([^\]]+)\]/g)].map(m => m[1]).concat(['irontomb', 'flamethief', 'nobody']);
      return [0, 1, 2].map(() => ({
        type: pick(allowed), targetId: pick(ids), targetCity: pick(['创世涡心', '奥赫玛', '不存在的城']), content: 'hi',
        resource: 'food', itemName: '治疗药剂', items: { food: 1 }, offer: { food: 1 }, request: { food: 1 }, defenseType: 'WALL'
      }) as any);
    });
    const sim = new OmphalosSimulation({ npcCount: 6, dayDelayMs: 0, concurrency: 16 });
    sim.connect(adapter, { timeoutMs: 1000 });
    for (let d = 0; d < 20; d++) await sim.step();
    for (const em of Object.values(sim.state.embers)) em.returned = true;
    for (let d = 0; d < 20 && sim.status !== 'ended'; d++) await sim.step();
    expect(sim.lastError).toBe('');
    expect(adapter.calls).toBeGreaterThan(100);
  });

  it('所有人协同作战时能击碎铁墓，仿真进入终结状态', async () => {
    const sim = new OmphalosSimulation({ npcCount: 10, dayDelayMs: 0, concurrency: 16, replyPhase: false });
    sim.connect(scriptedAdapter(cooperativePolicy), { timeoutMs: 1000 });
    // 模拟一场漫长的逐火之旅之后的黄金裔
    for (const a of Object.values(sim.state.agents)) {
      if (a.kind !== 'heir') continue;
      a.demigod.push(a.path);
      a.level = 8; a.maxHp += 60; a.hp = a.maxHp; a.defense += 4;
      a.location = '创世涡心';
    }
    for (const em of Object.values(sim.state.embers)) em.returned = true;
    for (let d = 0; d < 45 && sim.status !== 'ended'; d++) await sim.step();
    expect(sim.status).toBe('ended');
    expect(sim.state.ending).toBeDefined();
    await sim.start();
    expect(sim.status).toBe('ended');
  });
});
