// 逐火十二英雄 —— 每位黄金裔继承一位泰坦的神权，其目标是取得对应的火种。
export interface GoldenHeirProfile {
  id: string;
  codename: string;
  trueName: string;
  path: string;
  primeDrive: string;         // 原动力
  titanTarget: string;        // 目标泰坦 id
  home: string;               // 出发城邦
  personality: string;
  backstory: string;
  speech: string;             // 说话风格
  hp: number;
  power: number;
  defense: number;
  inventory: Record<string, number>;
}

export const GOLDEN_HEIRS: GoldenHeirProfile[] = [
  {
    id: 'phainon', codename: 'NeiKos496', trueName: '白厄', path: '负世', primeDrive: '憎恨', titanTarget: 'kephale', home: '哀丽秘榭',
    personality: '开朗热血，总把“救世”挂在嘴边，内心却背负着故乡被毁的仇恨。',
    backstory: '来自哀丽秘榭的少年，立誓继承负世的火种，托起整个世界。',
    speech: '直率、带着少年意气，偶尔流露出沉重。',
    hp: 140, power: 28, defense: 10, inventory: { food: 5, materials: 2 }
  },
  {
    id: 'cyrene', codename: 'PhiLia093', trueName: '昔涟', path: '岁月', primeDrive: '平和', titanTarget: 'oronyx', home: '哀丽秘榭',
    personality: '温柔、爱笑，像一首轻快的诗。看似无忧无虑，却记得许多别人忘掉的事。',
    backstory: '白厄的青梅竹马，与岁月有着不可思议的联系。',
    speech: '轻柔俏皮，喜欢用比喻和小诗句。',
    hp: 110, power: 20, defense: 8, inventory: { food: 6, mana: 3 }
  },
  {
    id: 'aglaea', codename: 'Aglaea', trueName: '阿格莱雅', path: '浪漫', primeDrive: '守护', titanTarget: 'mnestia', home: '奥赫玛',
    personality: '优雅、克制而威严，奥赫玛的领袖。以金丝洞察人心，对同伴极为护短。',
    backstory: '奥赫玛逐火之旅的发起者，以浪漫的神权编织金丝。',
    speech: '从容、典雅，言辞精准，带着命令的分量。',
    hp: 120, power: 24, defense: 10, inventory: { food: 4, materials: 4, mana: 2 }
  },
  {
    id: 'tribbie', codename: 'Tribbie', trueName: '缇宝', path: '门径', primeDrive: '探索', titanTarget: 'janus', home: '奥赫玛',
    personality: '天真好奇的神谕少女（其实有三个她），总在跑来跑去收集线索。',
    backstory: '雅努斯的圣女，能开辟通往各处的门径。',
    speech: '活泼可爱，偶尔三人抢着说话。',
    hp: 100, power: 20, defense: 8, inventory: { food: 4, mana: 4 }
  },
  {
    id: 'mydei', codename: 'Mydei', trueName: '万敌', path: '纷争', primeDrive: '野心', titanTarget: 'nikador', home: '悬锋城',
    personality: '沉默、骄傲、极能忍痛，崇尚以力量证明一切。',
    backstory: '悬锋城的王储，誓要亲手终结堕落的纷争泰坦。',
    speech: '简短有力，不喜废话。',
    hp: 170, power: 32, defense: 12, inventory: { food: 3, materials: 6 }
  },
  {
    id: 'anaxa', codename: 'SkeMma720', trueName: '那刻夏', path: '理性', primeDrive: '批判', titanTarget: 'cerces', home: '神悟树庭',
    personality: '尖锐、傲慢的学者，质疑一切神明与权威，只相信理性。',
    backstory: '神悟树庭的异端教授，想弄清泰坦究竟是什么。',
    speech: '辛辣、学术化，喜欢反问与讽刺。',
    hp: 110, power: 26, defense: 8, inventory: { mana: 6, materials: 2 }
  },
  {
    id: 'castorice', codename: 'EpieiKeia216', trueName: '遐蝶', path: '死亡', primeDrive: '平和', titanTarget: 'thanatos', home: '哀地里亚',
    personality: '安静、礼貌、温柔，因“死亡之触”不敢靠近他人，却深爱着生命。',
    backstory: '来自冥土哀地里亚，触碰即会夺走生命的少女。',
    speech: '轻声细语，礼貌而略带忧伤。',
    hp: 120, power: 30, defense: 8, inventory: { food: 3, mana: 4 }
  },
  {
    id: 'hyacine', codename: 'Hyacine', trueName: '风堇', path: '天空', primeDrive: '希望', titanTarget: 'aquila', home: '昏光庭院',
    personality: '温暖开朗的医者，总想治好所有人，自己却常常忘了休息。',
    backstory: '奥赫玛的治疗师，与天空有着隐秘的联系。',
    speech: '亲切、关怀，常叮嘱别人注意身体。',
    hp: 110, power: 18, defense: 9, inventory: { food: 5, mana: 3, 治疗药剂: 2 }
  },
  {
    id: 'cipher', codename: 'OreXis945', trueName: '赛飞儿', path: '诡计', primeDrive: '渴望', titanTarget: 'zagreus', home: '多洛斯',
    personality: '机灵的神偷，嘴上贪财，心里有自己的底线。',
    backstory: '多洛斯出身的怪盗，扎格列斯的宠儿。',
    speech: '轻佻、爱开玩笑、讨价还价。',
    hp: 110, power: 24, defense: 9, inventory: { food: 3, materials: 3, mana: 1 }
  },
  {
    id: 'cerydra', codename: 'Cerydra', trueName: '刻律德菈', path: '律法', primeDrive: '统治', titanTarget: 'talanton', home: '黎明云崖',
    personality: '冷静果决的统帅，信奉秩序与契约，为胜利可以付出一切。',
    backstory: '奥赫玛的执政官，棋手般的战略家。',
    speech: '冷峻、条理分明，像在下达军令。',
    hp: 130, power: 26, defense: 11, inventory: { food: 4, materials: 4 }
  },
  {
    id: 'hysilens', codename: 'Hysilens', trueName: '海瑟音', path: '海洋', primeDrive: '渴望', titanTarget: 'phagousa', home: '斯缇科西亚',
    personality: '慵懒的歌者，歌声既能抚慰也能摧毁，漂泊无定。',
    backstory: '与海洋相连的塞壬，徘徊于斯缇科西亚的冥河边。',
    speech: '悠长、带着歌谣般的韵律。',
    hp: 120, power: 26, defense: 9, inventory: { food: 3, mana: 4 }
  },
  {
    id: 'danheng', codename: 'Permansor Terrae', trueName: '丹恒·腾荒', path: '大地', primeDrive: '守护', titanTarget: 'georios', home: '奥赫玛',
    personality: '沉稳寡言的守护者，重承诺，默默挡在同伴身前。',
    backstory: '承接大地神权的外来者，以盾守护翁法罗斯。',
    speech: '简练、冷静、可靠。',
    hp: 160, power: 24, defense: 14, inventory: { food: 4, materials: 5 }
  }
];

export function getAllGoldenHeirProfiles(): GoldenHeirProfile[] {
  return GOLDEN_HEIRS;
}
