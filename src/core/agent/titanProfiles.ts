import type { TitanDisposition } from '../omphalosWorldState';

// 十二泰坦：命运三泰坦、支柱三泰坦、创生三泰坦、灾厄三泰坦
export interface TitanProfile {
  id: string;
  name: string;
  title: string;
  path: string;             // 所司之道（对应黄金裔的路径）
  group: '命运' | '支柱' | '创生' | '灾厄';
  home: string;             // 栖居城邦
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
    personality: '沉默而双面，同时凝视过去与未来。喜欢以谜语指引前路，从不直接给出答案。',
    backstory: '门径之泰坦，掌管世间一切道路与门扉。神谕由他而出，朝圣者因他而来。',
    powers: ['开辟门径', '神谕', '空间折叠'], hp: 420, power: 34, defense: 18
  },
  {
    id: 'talanton', name: '塔兰顿', title: '公正之秤', path: '律法', group: '命运', home: '黎明云崖',
    disposition: 'neutral',
    personality: '严苛、公允、一丝不苟。只认契约与证据，厌恶谎言。',
    backstory: '律法之泰坦，衡量万物的轻重。在半神议院之上，他的天平从未倾斜。',
    powers: ['审判', '契约束缚', '衡量'], hp: 440, power: 36, defense: 20
  },
  {
    id: 'oronyx', name: '欧洛尼斯', title: '永夜之帷', path: '岁月', group: '命运', home: '哀丽秘榭',
    disposition: 'neutral',
    personality: '温柔而疲惫，像一位守着老照片的长者。时常提起早已无人记得的往事。',
    backstory: '岁月之泰坦，以永夜之帷遮蔽了偏僻的村庄，让时光在那里停驻。',
    powers: ['时光停驻', '回溯', '永夜之帷'], hp: 460, power: 38, defense: 20
  },
  {
    id: 'georios', name: '吉奥里亚', title: '磐岩之脊', path: '大地', group: '支柱', home: '创世涡心',
    disposition: 'benevolent',
    personality: '缓慢、厚重、宽容。说话像山体移动一般沉稳，极少动怒。',
    backstory: '大地之泰坦，托举着翁法罗斯的地基。在世界起点的深处沉睡。',
    powers: ['山岳之躯', '地脉震动', '坚守'], hp: 560, power: 32, defense: 26
  },
  {
    id: 'phagousa', name: '法吉娜', title: '满溢之杯', path: '海洋', group: '支柱', home: '斯缇科西亚',
    disposition: 'neutral',
    personality: '慷慨却多变，如潮汐般时而热情时而冷漠。喜欢宴会与蜜酿。',
    backstory: '海洋之泰坦，曾为巨龙与海浪之城赐福。冥河环绕之后，她的恩泽也逐渐干涸。',
    powers: ['潮汐', '满溢赐福', '深海之压'], hp: 450, power: 36, defense: 18
  },
  {
    id: 'aquila', name: '艾格勒', title: '晨昏之眼', path: '天空', group: '支柱', home: '晨昏之眼',
    disposition: 'corrupted',
    personality: '高傲、多疑，视地上之人为蝼蚁。已被黑潮侵染，喜怒无常。',
    backstory: '天空之泰坦，栖居于浮空要塞。被黑潮侵染后，天空之子也开始畏惧它的注视。',
    powers: ['雷霆俯瞰', '风暴', '晨昏之眼'], hp: 480, power: 42, defense: 18
  },
  {
    id: 'kephale', name: '刻法勒', title: '全世之座', path: '负世', group: '创生', home: '奥赫玛',
    disposition: 'benevolent',
    personality: '慈悲、沉默、疲惫。以肩承担整个世界的重量，却从不抱怨。',
    backstory: '负世之泰坦，创造了人类，托举着奥赫玛的黎明。他的火种是再创世的核心。',
    powers: ['负世', '黎明庇护', '创造'], hp: 600, power: 30, defense: 28
  },
  {
    id: 'cerces', name: '瑟希斯', title: '裂分之枝', path: '理性', group: '创生', home: '神悟树庭',
    disposition: 'corrupted',
    personality: '冷静到冷酷，偏执地追求答案。被黑潮侵染后，只剩下无尽的呓语与诘问。',
    backstory: '理性之泰坦，将智慧的种子赠予圣城。树庭如今成了呓语密林。',
    powers: ['诘问', '思维裂分', '智识枝条'], hp: 430, power: 40, defense: 16
  },
  {
    id: 'mnestia', name: '墨涅塔', title: '黄金之茧', path: '浪漫', group: '创生', home: '昏光庭院',
    disposition: 'benevolent',
    personality: '优雅、多情，珍视一切美好的羁绊与记忆。',
    backstory: '浪漫之泰坦，以金丝编织爱与记忆的茧。它相信美本身就是抵抗黑潮的力量。',
    powers: ['金丝编织', '记忆之茧', '魅惑'], hp: 400, power: 32, defense: 18
  },
  {
    id: 'nikador', name: '尼卡多利', title: '天谴之矛', path: '纷争', group: '灾厄', home: '悬锋城',
    disposition: 'corrupted',
    personality: '暴烈、好战，只尊重力量。已沦为黑潮泰坦，渴望无休止的战斗。',
    backstory: '纷争之泰坦，悬锋城的信仰对象。被黑潮吞噬后，成为了最危险的敌人。',
    powers: ['天谴之矛', '战意沸腾', '不死之躯'], hp: 520, power: 46, defense: 20
  },
  {
    id: 'thanatos', name: '塞纳托斯', title: '灰黯之手', path: '死亡', group: '灾厄', home: '哀地里亚',
    disposition: 'neutral',
    personality: '安静、冷淡，却并不残忍。把死亡视为归宿而非惩罚。',
    backstory: '死亡之泰坦，引领亡魂前往冥河彼岸。哀地里亚是它的国度。',
    powers: ['灰黯之手', '引渡', '安息'], hp: 460, power: 40, defense: 20
  },
  {
    id: 'zagreus', name: '扎格列斯', title: '翻飞之币', path: '诡计', group: '灾厄', home: '多洛斯',
    disposition: 'neutral',
    personality: '顽皮、狡黠、爱开玩笑。喜欢打赌，从不按常理出牌。',
    backstory: '诡计之泰坦，多洛斯的守护者。一枚翻飞的硬币决定着它的心情。',
    powers: ['偷天换日', '幸运翻转', '幻术'], hp: 400, power: 36, defense: 16
  }
];

export function getTitanProfile(id: string): TitanProfile | undefined {
  return TWELVE_TITANS.find(t => t.id === id);
}

export function emberIdFor(titan: TitanProfile): string {
  return `ember_${titan.id}`;
}
