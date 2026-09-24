import type { CityState } from '../omphalosWorldState';

type CitySeed = Omit<CityState, 'neighbors' | 'fallen'>;

// 翁法罗斯的城邦与圣所。描述文本取自游戏内文本。
const CITY_SEEDS: CitySeed[] = [
  {
    id: '奥赫玛', name: '奥赫玛', type: '永恒圣城', titanIds: ['kephale'],
    description: '追随「负世之泰坦」的城邦，供奉庇护世间的刻法勒。在黑潮肆虐的永夜下，唯有此处安享黎明笼罩的安逸。',
    population: 10000, prosperity: 85, walls: 5, watchtowers: 3,
    resources: { food: 900, materials: 700, mana: 200 }, darkTide: 5, map: { x: 46, y: 38 }
  },
  {
    id: '黎明云崖', name: '黎明云崖', type: '半神议院', titanIds: ['talanton'],
    description: '奥赫玛的信仰中心和政治枢纽，祭司们凝望着负世泰坦，元老们在圆形会场中辩论不休。元老以「刻法勒与塔兰顿在上」起誓。',
    population: 2000, prosperity: 75, walls: 3, watchtowers: 2,
    resources: { food: 300, materials: 250, mana: 300 }, darkTide: 8, map: { x: 50, y: 14 }
  },
  {
    id: '雅努萨波利斯', name: '雅努萨波利斯', type: '神谕圣地', titanIds: ['janus', 'oronyx'],
    description: '信仰「门径之泰坦」的城邦，供奉指引前路的雅努斯与执掌命运的泰坦们。朝圣者的终点，神迹彰显之处；命运三相殿坐落于此。',
    population: 3000, prosperity: 60, walls: 2, watchtowers: 1,
    resources: { food: 250, materials: 200, mana: 300 }, darkTide: 25, map: { x: 26, y: 16 }
  },
  {
    id: '悬锋城', name: '悬锋城', type: '战争城邦', titanIds: ['nikador'],
    description: '崇尚「纷争之泰坦」的城邦，供奉令人胆寒的尼卡多利。为世间带来恐惧的矛，亦是抵御灾厄的盾。',
    population: 8000, prosperity: 55, walls: 10, watchtowers: 8,
    resources: { food: 500, materials: 1200, mana: 100 }, darkTide: 35, map: { x: 70, y: 50 }
  },
  {
    id: '神悟树庭', name: '神悟树庭', type: '学术城邦', titanIds: ['cerces', 'mnestia'],
    description: '尊崇「理性之泰坦」的城邦，瑟希斯的神躯在此沉思，亦是「黄金之茧」墨涅塔显迹之地。「最初的学者」带领众人在林间建立起花园与庭院，树庭由此初诞。',
    population: 4000, prosperity: 60, walls: 1, watchtowers: 3,
    resources: { food: 400, materials: 350, mana: 400 }, darkTide: 22, map: { x: 74, y: 24 }
  },
  {
    id: '斯缇科西亚', name: '斯缇科西亚', type: '酣歌海垠', titanIds: ['phagousa'],
    description: '巨龙与海浪的城邦，受「满溢之杯」法吉娜垂青的海洋明珠，也是第一个转向「死亡」信仰的城邦。',
    population: 2500, prosperity: 40, walls: 4, watchtowers: 2,
    resources: { food: 350, materials: 500, mana: 150 }, darkTide: 45, map: { x: 90, y: 38 }
  },
  {
    id: '哀地里亚', name: '哀地里亚', type: '冥土城邦', titanIds: ['thanatos'],
    description: '那敬爱死亡的国度，终日飘雪。信仰塞纳托斯的城邦，居民们将死亡作为生的幸福归宿。',
    population: 1500, prosperity: 45, walls: 2, watchtowers: 1,
    resources: { food: 200, materials: 150, mana: 180 }, darkTide: 15, map: { x: 80, y: 66 }
  },
  {
    id: '晨昏之眼', name: '晨昏之眼', type: '浮空要塞', titanIds: ['aquila'],
    description: '在纷争世，许多浮空堡垒都已沉没，唯有这座栖居着艾格勒神体的宏伟要塞留存，成为天空之子的聚居地。',
    population: 3000, prosperity: 55, walls: 6, watchtowers: 4,
    resources: { food: 350, materials: 600, mana: 350 }, darkTide: 30, map: { x: 10, y: 10 }
  },
  {
    id: '多洛斯', name: '多洛斯', type: '诡计之城', titanIds: ['zagreus'],
    description: '「诡计」的城邦。多洛斯城的花天锦地，令人心和言语变得纷杂缭乱；这便是多洛斯的瞒神伟业，连扎格列斯也在此城受骗。',
    population: 1500, prosperity: 55, walls: 2, watchtowers: 2,
    resources: { food: 350, materials: 250, mana: 80 }, darkTide: 15, map: { x: 14, y: 40 }
  },
  {
    id: '吉奥里亚神殿', name: '吉奥里亚神殿', type: '山之民圣所', titanIds: ['georios'],
    description: '人们在第一抔小麦种下的地方建起吉奥里亚的神殿，将收获月的第一捆麦子献祭给这位伟大的泰坦。广阔的平原是它的胸膛，巍峨的群山则是它的臂膀。',
    population: 1800, prosperity: 60, walls: 3, watchtowers: 2,
    resources: { food: 700, materials: 400, mana: 60 }, darkTide: 12, map: { x: 30, y: 62 }
  },
  {
    id: '许珀耳', name: '许珀耳', type: '北境帝国', titanIds: [],
    description: '北境帝国，失落的王朝，寒冷的疆土燃烧着征伐的野心。凯撒刻律德菈的故国。',
    population: 6000, prosperity: 50, walls: 8, watchtowers: 5,
    resources: { food: 300, materials: 800, mana: 120 }, darkTide: 20, map: { x: 10, y: 66 }
  },
  {
    id: '哀丽秘榭', name: '哀丽秘榭', type: '世外村庄', titanIds: [],
    description: '翁法罗斯某处偏僻的村庄，受永夜之帷庇护而遗落世外，麦田、风车与海滨共同守望着这隅宁静美好的时光。',
    population: 600, prosperity: 70, walls: 1, watchtowers: 1,
    resources: { food: 400, materials: 100, mana: 150 }, darkTide: 3, map: { x: 52, y: 66 }
  },
  {
    id: '创世涡心', name: '创世涡心', type: '世界起点',  titanIds: [],
    description: '被波涛藏匿的世界起点，寄宿十二泰坦原初神性的伟大圣所，亦是神谕中创世奇迹降临的应允之地。十二座星辰悬浮在虚空中，俯瞰着创世涡心。',
    population: 100, prosperity: 90, walls: 0, watchtowers: 0,
    resources: { food: 50, materials: 100, mana: 900 }, darkTide: 0, map: { x: 96, y: 60 }
  }
];

const EDGES: [string, string][] = [
  ['奥赫玛', '黎明云崖'],
  ['奥赫玛', '雅努萨波利斯'],
  ['奥赫玛', '悬锋城'],
  ['奥赫玛', '神悟树庭'],
  ['奥赫玛', '多洛斯'],
  ['奥赫玛', '吉奥里亚神殿'],
  ['奥赫玛', '哀丽秘榭'],
  ['雅努萨波利斯', '晨昏之眼'],
  ['晨昏之眼', '多洛斯'],
  ['多洛斯', '许珀耳'],
  ['许珀耳', '吉奥里亚神殿'],
  ['吉奥里亚神殿', '哀丽秘榭'],
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
    cities[seed.id] = {
      ...seed, titanIds: [...seed.titanIds], resources: { ...seed.resources }, map: { ...seed.map }, neighbors: [], fallen: false
    };
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
