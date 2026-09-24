import { describe, expect, it } from 'vitest';
import { OmphalosSimulation } from '../llmSimulation';
import { adaptPlay, buildAdaptPrompt, collectMaterial, playToHtml, playToMarkdown, recordPlay } from '../theater';
import type { ProviderAdapter } from '../providers';

function worldWithStory() {
  const sim = new OmphalosSimulation({ npcCount: 2 });
  const e = sim.engine;
  const s = sim.state;
  const a = s.agents.phainon, b = s.agents.cyrene ?? Object.values(s.agents).find(x => x.kind === 'heir' && x.id !== 'phainon')!;
  b.location = a.location;
  s.day = 1;
  e.pushMessage(a, b, '明天一起去悬锋城吧');
  e.pushMessage(b, a, '好，<b>不见不散</b>');
  s.day = 2;
  e.log('combat', `${a.name} 击退了一群黑潮造物`, 'high', { agentId: a.id, location: a.location });
  e.log('economy', '无关的交易', 'low');
  return { sim, a, b };
}

describe('小剧场', () => {
  it('收集素材：按天数与主角筛选，未指定主角时自动选角', () => {
    const { sim, a, b } = worldWithStory();
    const all = collectMaterial(sim.state, sim.engine.chronicle, { era: 1, dayFrom: 1, dayTo: 2, castIds: [] });
    expect(all.cast.map(c => c.id)).toEqual(expect.arrayContaining([a.id, b.id]));
    expect(all.chats).toBe(2);
    expect(all.logs.some(l => l.message === '无关的交易')).toBe(false);
    const day2 = collectMaterial(sim.state, sim.engine.chronicle, { era: 1, dayFrom: 2, dayTo: 2, castIds: [a.id] });
    expect(day2.chats).toBe(0);
    expect(day2.logs).toHaveLength(1);
  });

  it('实录：真实对话成为台词，按天分幕；导出时转义 HTML', () => {
    const { sim, a, b } = worldWithStory();
    const m = collectMaterial(sim.state, sim.engine.chronicle, { era: 1, dayFrom: 1, dayTo: 2, castIds: [] });
    const play = recordPlay(sim.state, m);
    expect(play.scenes).toHaveLength(2);
    expect(play.scenes[0].lines[0]).toMatchObject({ kind: 'dialogue', speaker: a.name, to: b.name, text: '明天一起去悬锋城吧' });
    const html = playToHtml(play);
    expect(html).toContain('&lt;b&gt;不见不散&lt;/b&gt;');
    expect(html).not.toContain('<b>不见不散</b>');
    expect(playToMarkdown(play)).toContain(`**${a.name}**（对${b.name}）：明天一起去悬锋城吧`);
  });

  it('改编：把素材交给模型，并规范化返回的剧本', async () => {
    const { sim, a } = worldWithStory();
    const m = collectMaterial(sim.state, sim.engine.chronicle, { era: 1, dayFrom: 1, dayTo: 2, castIds: [] });
    let seen = '';
    const adapter: ProviderAdapter = {
      kind: 'anthropic', model: 'scripted',
      listModels: async () => [],
      complete: async req => {
        seen = req.user;
        expect(req.tool?.name).toBe('write_play');
        expect(req.maxTokens).toBeGreaterThanOrEqual(8000);
        return {
          toolArgs: JSON.stringify({
            title: '约定', logline: '一句约定',
            scenes: [
              { heading: '第一幕', setting: '黄昏', lines: [{ kind: 'dialogue', speaker: a.name, text: '走吧' }, { kind: 'dialogue', text: '缺了说话者' }, { kind: 'bogus', text: '动作' }] },
              { heading: '空幕', lines: [] }
            ]
          }),
          text: '', reasoning: '', inputTokens: 1, outputTokens: 1
        };
      }
    };
    const play = await adaptPlay(adapter, sim.state, m, 'comedy', 'short');
    expect(seen).toContain('明天一起去悬锋城吧');
    expect(play.mode).toBe('adapt');
    expect(play.scenes).toHaveLength(1);
    expect(play.scenes[0].lines.map(l => l.kind)).toEqual(['dialogue', 'action', 'action']);
    expect(buildAdaptPrompt(sim.state, m, 'comedy', 'short').system).toContain('喜剧');
  });

  it('端点不支持工具时退回纯文本 JSON', async () => {
    const { sim } = worldWithStory();
    const m = collectMaterial(sim.state, sim.engine.chronicle, { era: 1, dayFrom: 1, dayTo: 2, castIds: [] });
    let calls = 0;
    const adapter: ProviderAdapter = {
      kind: 'openai-chat', model: 'plain',
      listModels: async () => [],
      complete: async req => {
        calls++;
        if (req.tool) throw Object.assign(new Error('tools not supported'), { status: 400 });
        return { text: '```json\n{"title":"纯文本","scenes":[{"heading":"一","lines":[{"kind":"narration","text":"风起"}]}]}\n```', reasoning: '', inputTokens: 1, outputTokens: 1 };
      }
    };
    const play = await adaptPlay(adapter, sim.state, m, 'drama', 'short');
    expect(calls).toBe(2);
    expect(play.title).toBe('纯文本');
  });
});
