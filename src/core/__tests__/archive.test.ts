import { describe, expect, it } from 'vitest';
import { OmphalosSimulation } from '../llmSimulation';
import { LOG_LIMIT } from '../omphalosWorldState';
import { buildArchive, chronicleToMarkdown, parseArchive } from '../archive';
import { scriptedAdapter, cooperativePolicy } from './helpers';

describe('编年史与世界档案', () => {
  it('编年史不随界面日志截断，并随档案完整往返', async () => {
    const sim = new OmphalosSimulation({ npcCount: 4, dayDelayMs: 0, concurrency: 8 });
    sim.connect(scriptedAdapter(cooperativePolicy), { timeoutMs: 1000 });
    for (let i = 0; i < 3; i++) await sim.step();
    for (let i = 0; i < LOG_LIMIT + 50; i++) sim.engine.log('event', `填充${i}`, 'low');
    expect(sim.state.logs.length).toBe(LOG_LIMIT);
    const total = sim.engine.chronicle.logs.length;
    expect(total).toBeGreaterThan(LOG_LIMIT + 50);

    const text = JSON.stringify(buildArchive(sim, [{ id: 'p1', mode: 'record', title: '测试剧', logline: '', createdAt: 1, era: 1, dayFrom: 1, dayTo: 2, cast: [], scenes: [{ heading: 'a', lines: [{ kind: 'action', text: 'x' }] }] }]));
    const { snapshot, theaters } = parseArchive(text);
    expect(theaters).toHaveLength(1);

    const restored = new OmphalosSimulation({ npcCount: 4 });
    expect(restored.restore(snapshot)).toBe(true);
    expect(restored.engine.chronicle.logs.length).toBe(total);
    restored.engine.log('event', '恢复后的新记录', 'low');
    const ids = restored.engine.chronicle.logs.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);

    const md = chronicleToMarkdown(restored.engine.chronicle, restored.state);
    expect(md).toContain('## 第1纪元');
    expect(md).toContain('### 第3天');
  });

  it('旧版快照（无编年史）以界面日志作为编年史恢复', () => {
    const sim = new OmphalosSimulation({ npcCount: 0 });
    const snap: any = JSON.parse(JSON.stringify(sim.snapshot()));
    snap.version = 1;
    delete snap.chronicle;
    const other = new OmphalosSimulation({ npcCount: 0 });
    expect(other.restore(snap)).toBe(true);
    expect(other.engine.chronicle.logs.length).toBe(sim.state.logs.length);
  });

  it('拒绝无关文件', () => {
    expect(() => parseArchive('not json')).toThrow('JSON');
    expect(() => parseArchive('{"hello":1}')).toThrow('档案');
    expect(() => parseArchive('{"format":"omphalos-world","version":99}')).toThrow('更新的版本');
  });
});
