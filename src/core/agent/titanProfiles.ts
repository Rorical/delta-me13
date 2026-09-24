import type { TitanDisposition } from '../omphalosWorldState';

// 十二泰坦：命运三泰坦、支柱三泰坦、创生三泰坦、灾厄三泰坦。
// 称号、神权与描述均参照游戏内文本。
export interface TitanProfile {
  id: string;
  name: string;
  title: string;
  path: string;
  group: '命运' | '支柱' | '创生' | '灾厄';
  home: string;
  disposition: TitanDisposition;
  personality: string;
  backstory: string;
  powers: string[];
  hp: number;
  power: number;
  defense: number;
}

export const TWELVE_TITANS: TitanProfile[] = [
  {
    id: 'janus', name: '雅努斯', title: '万径之门', path: '门径', group: '命运', home: '雅努萨波利斯',
    disposition: 'benevolent',
    personality: '沉静完美，只以神谕示人。它为天地划定界限，圣女们是它有形的「门」。',
    backstory: '万径之门，雅努斯，门径之泰坦，命运三泰坦中的长姊。它揭示城邦未来、指引万民前路，于众泰坦中堪称最为完美的一尊。',
    powers: ['开辟门径', '神谕', '百界门'], hp: 420, power: 34, defense: 18
  },
  {
    id: 'talanton', name: '塔兰顿', title: '公正之秤', path: '律法', group: '命运', home: '黎明云崖',
    disposition: 'neutral',
    personality: '严苛而一丝不苟，从不发笑——它怕自己的笑声会让天平颤抖。',
    backstory: '公正之秤，塔兰顿，律法之泰坦。信仰它的城邦，犯罪的惩罚只有两种：无罪和灭亡。元老们以「刻法勒与塔兰顿在上」起誓。',
    powers: ['审判', '天平', '律令'], hp: 440, power: 36, defense: 20
  },
  {
    id: 'oronyx', name: '欧洛尼斯', title: '永夜之帷', path: '岁月', group: '命运', home: '雅努萨波利斯',
    disposition: 'neutral',
    personality: '无面而寡言，以黑夜的权能藏起信徒的记忆，只以低语回应来者。',
    backstory: '永夜之帷，欧洛尼斯，岁月之泰坦。它的帷幕之上嵌着群星，隐藏着翁法罗斯被遗忘的记忆；命运重渊的尽头，是它的神殿。',
    powers: ['永夜之帷', '隐藏记忆', '回溯'], hp: 460, power: 38, defense: 20
  },
  {
    id: 'georios', name: '吉奥里亚', title: '磐岩之脊', path: '大地', group: '支柱', home: '吉奥里亚神殿',
    disposition: 'neutral',
    personality: '和蔼、认真而沉默，雷打不动、水淹不坏；可一旦被触怒，也会罕见地爆发盛怒。',
    backstory: '「磐岩之脊」，吉奥里亚，大地之泰坦，山峦的神明。它以脊背朝上迎受风霜雪雨，山之民由它亲手捏成。它与天空的艾格勒从未停止对彼此的中伤和讥讽。',
    powers: ['山岳之躯', '孕五谷之息', '固群山之基'], hp: 560, power: 32, defense: 26
  },
  {
    id: 'phagousa', name: '法吉娜', title: '满溢之杯', path: '海洋', group: '支柱', home: '斯缇科西亚',
    disposition: 'corrupted',
    personality: '纵情享乐、随性无常。在她最肆无忌惮的时代，即使最伟大的临海城邦，也得祈祷不会得到她随性的垂青。',
    backstory: '「满溢之杯」法吉娜，海洋与享乐之神。她在深渊中沉沦，杯身破碎——她的醉意注入黑潮，为翁法罗斯带来了最初的疯狂。',
    powers: ['满溢秘酿', '潮汐', '深渊之醉'], hp: 460, power: 38, defense: 18
  },
  {
    id: 'aquila', name: '艾格勒', title: '晨昏之眼', path: '天空', group: '支柱', home: '晨昏之眼',
    disposition: 'corrupted',
    personality: '高傲而绝对。只要它依旧飞翔于云端，翁法罗斯人就无法离开地面。',
    backstory: '天空之泰坦，神话中一只长有百眼、俯瞰世界的巨鸟。它在造物世打造了黎明机器；直到「阳雷骑士」刺穿它最后的眼目。',
    powers: ['百目', '炽白之光', '雷霆'], hp: 480, power: 42, defense: 18
  },
  {
    id: 'kephale', name: '刻法勒', title: '全世之座', path: '负世', group: '创生', home: '奥赫玛',
    disposition: 'benevolent',
    personality: '慈悲而沉默。它背负整个世界，如今已陷入沉默，但人们仍记得它的教诲：「我们都是彼此的光。」',
    backstory: '「全世之座」，负世之泰坦，依照自己的形象捏塑了最初的人类。它献出火种并留下神谕：十二位英雄将击落失神的泰坦，回收火种，拯救翁法罗斯。',
    powers: ['负世', '黎明庇护', '创生'], hp: 600, power: 30, defense: 28
  },
  {
    id: 'cerces', name: '瑟希斯', title: '裂分之枝', path: '理性', group: '创生', home: '神悟树庭',
    disposition: 'neutral',
    personality: '沉思而好问，博古通今。它以火种为谜题，欲令人解答——「我们」究竟为何物？',
    backstory: '「裂分之枝」理性之泰坦，神躯在神悟树庭中沉思。圣树为族亲敞开道路，墨涅塔将一切献给它。树庭劫难之后，学识的星火遭到吞没。',
    powers: ['诘问', '智识枝条', '裂分'], hp: 430, power: 40, defense: 16
  },
  {
    id: 'mnestia', name: '墨涅塔', title: '黄金之茧', path: '浪漫', group: '创生', home: '神悟树庭',
    disposition: 'benevolent',
    personality: '深情而唯美，珍视爱与记忆。它只认可心中存有「纯粹无私之爱」的人。',
    backstory: '「黄金之茧」浪漫之泰坦。在造物世，墨涅塔将世上的爱与自己的残茧捻作丝线，作为赠予瑟希斯的礼物；它的蝶群为世间带来回忆与预言的馈赠。',
    powers: ['金茧', '蝶群', '浪漫丝线'], hp: 400, power: 32, defense: 18
  },
  {
    id: 'nikador', name: '尼卡多利', title: '天谴之矛', path: '纷争', group: '灾厄', home: '悬锋城',
    disposition: 'corrupted',
    personality: '暴烈好战，曾是荣耀的象征，如今沦落成「疯王」——哪怕拖着残破的身躯，也要继续战斗。',
    backstory: '不败者，一切战场的领主，悬锋城与废墟的王，纷争的泰坦，天谴之矛。它守护了翁法罗斯千年的岁月，却已成为腐化泰坦。',
    powers: ['天谴之锋', '战吼', '不死之躯'], hp: 520, power: 46, defense: 20
  },
  {
    id: 'thanatos', name: '塞纳托斯', title: '灰黯之手', path: '死亡', group: '灾厄', home: '哀地里亚',
    disposition: 'neutral',
    personality: '安静而疏离，十指紧扣。它只能施行宣判，而不能进行拥抱；它的信使是蝴蝶。',
    backstory: '「灰黯之手」死亡之泰坦，引渡亡魂去往冥界。它无法随心所欲地塑造万物，也无法裁夺万物生灵的命运——却守着生死流转的秩序。',
    powers: ['灰黯之手', '冥河', '引渡'], hp: 460, power: 40, defense: 20
  },
  {
    id: 'zagreus', name: '扎格列斯', title: '翻飞之币', path: '诡计', group: '灾厄', home: '多洛斯',
    disposition: 'neutral',
    personality: '顽皮狡黠，从不说谎却总能骗过众神。它曾取悦过所有泰坦，唯独没有逗笑塔兰顿。',
    backstory: '「翻飞之币」诡计之泰坦。它曾盗走圣树的木材、把刻法勒的火种藏进胃囊；唯独它，没有任何城邦愿意接纳——除了多洛斯。',
    powers: ['翻飞之币', '神速', '偷天换日'], hp: 400, power: 36, defense: 16
  }
];

export function getTitanProfile(id: string): TitanProfile | undefined {
  return TWELVE_TITANS.find(t => t.id === id);
}

export function emberIdFor(titan: TitanProfile): string {
  return `ember_${titan.id}`;
}
