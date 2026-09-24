// 半神神职：归还火种的黄金裔成为对应的半神，「代行泰坦责任，填补神职空缺」。
// 每项神职只要该半神仍在世（未倒下）即生效，由世界引擎结算。
export interface DemigodPower {
  name: string;
  effect: string;       // 给玩家与模型看的效果说明
}

export const DEMIGOD_POWERS: Record<string, DemigodPower> = {
  负世: { name: '负世庇护', effect: '与该半神同城的友方受到的伤害降低30%' },
  岁月: { name: '岁月留痕', effect: '若本轮失败，永劫回归时多留下一层轮回印记' },
  门径: { name: '万径通途', effect: '该半神移动时可一步直达任意可抵达的城邦' },
  律法: { name: '律法之盾', effect: '与该半神同城的友方防御+5' },
  大地: { name: '磐岩镇潮', effect: '全世界黑潮增长降低15%' },
  海洋: { name: '满溢之杯', effect: '全世界城邦的资源再生翻倍' },
  天空: { name: '天空桥梁', effect: '所有黄金裔每次移动可前进两站' },
  理性: { name: '理性之光', effect: '所有黄金裔攻击+3' },
  浪漫: { name: '金丝羁绊', effect: '盟友协同作战的助攻由五成提升到八成' },
  纷争: { name: '天谴之锋', effect: '该半神自身攻击提升50%' },
  死亡: { name: '冥河引渡', effect: '倒下者一日后即苏醒，并恢复七成生命' },
  诡计: { name: '翻飞之币', effect: '盗火行者的夺火有一半概率只抢到陶罐' }
};

export function describeDemigod(path: string): string {
  const p = DEMIGOD_POWERS[path];
  return p ? `${p.name}：${p.effect}` : '';
}
