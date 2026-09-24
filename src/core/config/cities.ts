import type { CityState } from '../omphalosWorldState';

type CitySeed = Omit<CityState, 'neighbors' | 'fallen'>;

// 翁法罗斯的十二处地域。每处栖居一位泰坦，守护其火种。
const CITY_SEEDS: CitySeed[] = [
  {
    id: '奥赫玛', name: '奥赫玛', type: '圣城', titanId: 'kephale',
    description: '追随负世泰坦刻法勒的永恒圣城，黑潮肆虐的永夜下唯一安享黎明的地方。',
    population: 10000, prosperity: 85, walls: 5, watchtowers: 3,
    resources: { food: 900, materials: 700, mana: 200 }, darkTide: 5, map: { x: 48, y: 36 }
  },
  {
    id: '黎明云崖', name: '黎明云崖', type: '圣地', titanId: 'talanton',
    description: '奥赫玛的信仰中心与政治枢纽，元老们在半神议院中辩论不休。',
    population: 2000, prosperity: 75, walls: 3, watchtowers: 2,
    resources: { food: 300, materials: 250, mana: 300 }, darkTide: 8, map: { x: 52, y: 12 }
  },
  {
    id: '悬锋城', name: '悬锋城', type: '战城', titanId: 'nikador',
    description: '崇尚纷争泰坦尼卡多利的城邦，为世间带来恐惧的矛，亦是抵御灾厄的盾。',
    population: 8000, prosperity: 55, walls: 10, watchtowers: 8,
    resources: { food: 500, materials: 1200, mana: 100 }, darkTide: 30, map: { x: 68, y: 48 }
  },
  {
    id: '雅努萨波利斯', name: '雅努萨波利斯', type: '神谕圣地', titanId: 'janus',
    description: '信仰门径泰坦雅努斯的城邦，朝圣者的终点，如今只剩神殿屹立的废墟。',
    population: 800, prosperity: 25, walls: 2, watchtowers: 1,
    resources: { food: 150, materials: 200, mana: 260 }, darkTide: 35, map: { x: 30, y: 14 }
  },
  {
    id: '神悟树庭', name: '神悟树庭', type: '学院', titanId: 'cerces',
    description: '尊崇理性泰坦瑟希斯的学术之城，学识的星火正被呓语吞没。',
    population: 4000, prosperity: 60, walls: 1, watchtowers: 3,
    resources: { food: 400, materials: 350, mana: 400 }, darkTide: 22, map: { x: 74, y: 24 }
  },
  {
    id: '斯缇科西亚', name: '斯缇科西亚', type: '龙骸古城', titanId: 'phagousa',
    description: '曾经的巨龙与海浪之城邦，如今冥河环绕，成为亡灵的国度。',
    population: 2000, prosperity: 25, walls: 4, watchtowers: 2,
    resources: { food: 200, materials: 500, mana: 150 }, darkTide: 50, map: { x: 88, y: 40 }
  },
  {
    id: '晨昏之眼', name: '晨昏之眼', type: '浮空要塞', titanId: 'aquila',
    description: '栖居着天空泰坦艾格勒神体的浮空要塞，天空之子的聚居地。',
    population: 3000, prosperity: 55, walls: 6, watchtowers: 4,
    resources: { food: 350, materials: 600, mana: 350 }, darkTide: 30, map: { x: 12, y: 12 }
  },
  {
    id: '哀地里亚', name: '哀地里亚', type: '冥土', titanId: 'thanatos',
    description: '死亡泰坦塞纳托斯的国度，生者罕至，亡魂在此安息。',
    population: 800, prosperity: 40, walls: 1, watchtowers: 1,
    resources: { food: 200, materials: 150, mana: 180 }, darkTide: 15, map: { x: 76, y: 64 }
  },
  {
    id: '哀丽秘榭', name: '哀丽秘榭', type: '村庄', titanId: 'oronyx',
    description: '受永夜之帷庇护而遗落世外的村庄，麦田、风车与海滨守望着宁静的时光。',
    population: 600, prosperity: 70, walls: 1, watchtowers: 1,
    resources: { food: 400, materials: 100, mana: 150 }, darkTide: 3, map: { x: 52, y: 64 }
  },
  {
    id: '昏光庭院', name: '昏光庭院', type: '庭园', titanId: 'mnestia',
    description: '黄金之茧垂落的庭园，昏光之下爱与记忆被细细编织。',
    population: 400, prosperity: 55, walls: 1, watchtowers: 1,
    resources: { food: 250, materials: 80, mana: 120 }, darkTide: 10, map: { x: 30, y: 56 }
  },
  {
    id: '多洛斯', name: '多洛斯', type: '诡计之城', titanId: 'zagreus',
    description: '诡计泰坦扎格列斯的城邦，机巧与骗局在街巷间流转。',
    population: 1200, prosperity: 50, walls: 2, watchtowers: 2,
    resources: { food: 350, materials: 250, mana: 80 }, darkTide: 15, map: { x: 16, y: 36 }
  },
  {
    id: '创世涡心', name: '创世涡心', type: '世界起点', titanId: 'georios',
    description: '被波涛藏匿的世界起点，寄宿十二泰坦原初神性的圣所，亦是再创世的应允之地。',
    population: 100, prosperity: 90, walls: 0, watchtowers: 0,
    resources: { food: 50, materials: 100, mana: 900 }, darkTide: 0, map: { x: 94, y: 62 }
  }
];

const EDGES: [string, string][] = [
  ['奥赫玛', '黎明云崖'],
  ['奥赫玛', '悬锋城'],
  ['奥赫玛', '雅努萨波利斯'],
  ['奥赫玛', '神悟树庭'],
  ['奥赫玛', '多洛斯'],
  ['奥赫玛', '昏光庭院'],
  ['雅努萨波利斯', '晨昏之眼'],
  ['多洛斯', '晨昏之眼'],
  ['昏光庭院', '哀丽秘榭'],
  ['哀丽秘榭', '哀地里亚'],
  ['悬锋城', '哀地里亚'],
  ['悬锋城', '神悟树庭'],
  ['神悟树庭', '斯缇科西亚'],
  ['斯缇科西亚', '哀地里亚'],
  ['斯缇科西亚', '创世涡心']
];

export const RECREATION_SITE = '创世涡心';
export const SAFE_HAVEN = '奥赫玛';

export function createCities(): Record<string, CityState> {
  const cities: Record<string, CityState> = {};
  for (const seed of CITY_SEEDS) {
    cities[seed.id] = { ...seed, resources: { ...seed.resources }, map: { ...seed.map }, neighbors: [], fallen: false };
  }
  for (const [a, b] of EDGES) {
    cities[a].neighbors.push(b);
    cities[b].neighbors.push(a);
  }
  return cities;
}

export function getCityEdges(): [string, string][] {
  return EDGES;
}
