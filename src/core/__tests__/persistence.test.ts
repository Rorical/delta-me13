import { describe, expect, it } from 'vitest';
import { OmphalosSimulation, type SimSnapshot } from '../llmSimulation';
import { scriptedAdapter, cooperativePolicy } from './helpers';

describe('本地存档', () => {
  it('快照经 JSON 往返后可完整恢复，并能继续推进', async () => {
    const sim = new OmphalosSimulation({ npcCount: 4, dayDelayMs: 0, concurrency: 8 });
    let checkpoints = 0;
    sim.onCheckpoint = () => { checkpoints++; };
    sim.connect(scriptedAdapter(cooperativePolicy), { timeoutMs: 1000 });
    for (let i = 0; i < 3; i++) await sim.step();
    expect(checkpoints).toBe(3);

    const json = JSON.stringify(sim.snapshot());
    const restored = new OmphalosSimulation({ npcCount: 4, dayDelayMs: 0 });
    expect(restored.restore(JSON.parse(json) as SimSnapshot)).toBe(true);
    expect(restored.status).toBe('paused');
    expect(restored.state.day).toBe(3);
    expect(restored.state).toEqual(sim.state);
    expect(restored.memoryOf('phainon').recent()).toEqual(sim.memoryOf('phainon').recent());

    const lastLog = restored.state.logs.at(-1)!.id;
    restored.connect(scriptedAdapter(cooperativePolicy), { timeoutMs: 1000 });
    await restored.step();
    expect(restored.state.day).toBe(4);
    const ids = restored.state.logs.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.at(-1)!).toBeGreaterThan(lastLog);
    const aiIds = restored.state.ai.recent.map(r => r.id);
    expect(new Set(aiIds).size).toBe(aiIds.length);
  });

  it('拒绝版本不符或结构不完整的存档', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    expect(sim.restore({ version: 999 } as unknown as SimSnapshot)).toBe(false);
    expect(sim.restore({ version: 1, state: {} } as unknown as SimSnapshot)).toBe(false);
    expect(sim.state.day).toBe(0);
  });
});
