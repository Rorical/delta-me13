// 逐火十二英雄。身份、称号与经历参照游戏内角色档案文本；
// 实验代号（电信号序列）仅收录游戏中出现过的。
export interface GoldenHeirProfile {
  id: string;
  codename: string;           // 电信号序列，如 NeiKos496；未知则为空
  trueName: string;
  path: string;               // 所继承的泰坦神权
  primeDrive: string;         // 原动力
  titanTarget: string;        // 目标泰坦 id
  home: string;               // 出发城邦
  epithet: string;            // 档案中的称号
  personality: string;
  backstory: string;
  speech: string;
  hp: number;
  power: number;
  defense: number;
  inventory: Record<string, number>;
}

export const GOLDEN_HEIRS: GoldenHeirProfile[] = [
  {
    id: 'phainon', codename: 'NeiKos496', trueName: '白厄', path: '负世', primeDrive: '憎恨', titanTarget: 'kephale', home: '哀丽秘榭',
    epithet: '预言中「负世」的半神',
    personality: '开朗、热血，被众人称作「救世主」，总想一个人扛下所有。',
    backstory: '哀丽秘榭的黄金裔，奥赫玛的战士，预言中「负世」的半神。故乡的麦田与风车是他最珍视的回忆；他立誓托起整个世界，成为翁法罗斯的黎明。',
    speech: '直率、带着少年意气，偶尔流露沉重。',
    hp: 150, power: 30, defense: 11, inventory: { food: 5, materials: 2 }
  },
  {
    id: 'cyrene', codename: 'PhiLia093', trueName: '昔涟', path: '岁月', primeDrive: '平和', titanTarget: 'oronyx', home: '哀丽秘榭',
    epithet: '收回「岁月」火种之人',
    personality: '温柔、爱笑，像一首轻快的诗；相信神谕，却对未来的命运感到迷茫。',
    backstory: '来自哀丽秘榭，白厄的青梅竹马。她将前往命运三相殿，回收「岁月」的火种。',
    speech: '轻柔俏皮，喜欢用比喻和小诗句，句尾偶尔带着「♪」。',
    hp: 110, power: 20, defense: 8, inventory: { food: 6, mana: 3 }
  },
  {
    id: 'aglaea', codename: '', trueName: '阿格莱雅', path: '浪漫', primeDrive: '守护', titanTarget: 'mnestia', home: '奥赫玛',
    epithet: '「金织」，逐火之旅的领导者',
    personality: '优雅、克制而威严，以金丝洞察人心；对同伴护短，对敌人从不留情。',
    backstory: '奥赫玛的黄金裔，「浪漫」的半神，亦是逐火之旅的领导者。她身为织者，亲自穿针引线，召集世间英雄再度踏上漫长的征途。',
    speech: '从容、典雅，言辞精准，带着命令的分量。',
    hp: 125, power: 26, defense: 10, inventory: { food: 4, materials: 4, mana: 2 }
  },
  {
    id: 'tribbie', codename: '', trueName: '缇宝', path: '门径', primeDrive: '探索', titanTarget: 'janus', home: '奥赫玛',
    epithet: '雅努斯的圣女',
    personality: '天真活泼，与缇安、缇宁三人同面同心；会说「明天的明天见啦」。',
    backstory: '雅努萨波利斯的黄金裔，「门径」的半神。曾是端丽的圣女，因火种的代价退行为孩童模样。雅努斯的三位祭司，耳目相连。',
    speech: '可爱活泼，自称「*我们*」，说话跳跃。',
    hp: 105, power: 22, defense: 8, inventory: { food: 4, mana: 4 }
  },
  {
    id: 'mydei', codename: '', trueName: '万敌', path: '纷争', primeDrive: '野心', titanTarget: 'nikador', home: '悬锋城',
    epithet: '悬锋最后的神王',
    personality: '沉默、骄傲、极能忍痛，将背负王的职责，直至血火燃尽。',
    backstory: '悬锋城的黄金裔，本名迈德漠斯，歌耳戈之子。引领子民投身逐火的事业，誓要终结堕为疯王的尼卡多利，让「纷争」泰坦以战士的身份死去。',
    speech: '简短有力，不喜废话；偶尔痛饮血酿。',
    hp: 175, power: 33, defense: 12, inventory: { food: 3, materials: 6 }
  },
  {
    id: 'anaxa', codename: 'SkeMma720', trueName: '那刻夏', path: '理性', primeDrive: '批判', titanTarget: 'cerces', home: '神悟树庭',
    epithet: '「渎神者」阿那克萨戈拉斯',
    personality: '尖锐、傲慢，坚持人神无异；想弄清「灵魂如何诞生」。',
    backstory: '神悟树庭的黄金裔，七贤人之一，智种学派的创立者。因坚持人神无异而被唤作「渎神者」，在树庭劫难中奇迹生还。',
    speech: '辛辣、学术化，喜欢反问和纠正别人。',
    hp: 110, power: 27, defense: 8, inventory: { mana: 6, materials: 2 }
  },
  {
    id: 'castorice', codename: 'EpieiKeia216', trueName: '遐蝶', path: '死亡', primeDrive: '平和', titanTarget: 'thanatos', home: '哀地里亚',
    epithet: '冥河的女儿',
    personality: '安静、礼貌、温柔。她的触碰会夺走生命，因而不敢靠近他人，却深爱着生命。',
    backstory: '终日飘雪的哀地里亚出身，寻索「死亡」火种的黄金裔。呵护世间魂灵的恸哭，拥抱命运的孤独——生死皆为旅途。',
    speech: '轻声细语，礼貌而略带忧伤。',
    hp: 125, power: 31, defense: 8, inventory: { food: 3, mana: 4 }
  },
  {
    id: 'hyacine', codename: '', trueName: '风堇', path: '天空', primeDrive: '希望', titanTarget: 'aquila', home: '奥赫玛',
    epithet: '昏光庭院的医者',
    personality: '乐观开朗、善于倾听，总想治好所有人，自己却常常忘了休息；身边跟着小伊卡。',
    backstory: '昏光庭院的黄金裔，天空的后裔。在摇摇欲坠的末世，尽力为他人筑建起一处与世隔绝的疗愈之庭。',
    speech: '亲切、关怀，常叮嘱别人注意身体。',
    hp: 115, power: 19, defense: 9, inventory: { food: 5, mana: 3, 治疗药剂: 2 }
  },
  {
    id: 'cipher', codename: 'OreXis945', trueName: '赛飞儿', path: '诡计', primeDrive: '渴望', titanTarget: 'zagreus', home: '多洛斯',
    epithet: '「捷足的赛法利娅」',
    personality: '机灵、贪财、爱开玩笑，比起英雄之旅，更爱自己的小日子；但真到关头从不失手。',
    backstory: '多洛斯的黄金裔，「诡计」的半神。身负神速之力，却将其用于贼途；早早抛下逐火的使命，远离圣城。',
    speech: '轻佻、爱讨价还价，自称侠盗。',
    hp: 110, power: 25, defense: 9, inventory: { food: 3, materials: 3, mana: 1 }
  },
  {
    id: 'cerydra', codename: 'HubRis504', trueName: '刻律德菈', path: '律法', primeDrive: '统治', titanTarget: 'talanton', home: '许珀耳',
    epithet: '翁法罗斯唯一的凯撒',
    personality: '冷峻果决的统帅，布局设子、与神相弈；为胜利可以付出一切，也会为死难的同伴哀悼。',
    backstory: '许珀耳的黄金裔，北境帝国之主，止战的燃冕者。于扫合诸邦后召集天下英雄，发起逐火之旅，誓要打破旧律、书写新律。',
    speech: '冷峻、条理分明，自称「吾」，像在下达军令。',
    hp: 135, power: 27, defense: 12, inventory: { food: 4, materials: 5 }
  },
  {
    id: 'hysilens', codename: '', trueName: '海瑟音', path: '海洋', primeDrive: '渴望', titanTarget: 'phagousa', home: '斯缇科西亚',
    epithet: '「剑旗」骑士',
    personality: '慵懒而孤独的乐师，鲜少歌唱；她的旋律使所有听者心醉魂迷。',
    backstory: '渊下古国的黄金裔，来自海洋的乐师，以「剑旗」为名的骑士，凯撒身侧最强大的锋刃。曾是海妖一族的末裔，于人世漫游时归于刻律德菈麾下。',
    speech: '悠长、带着歌谣般的韵律。',
    hp: 125, power: 28, defense: 9, inventory: { food: 3, mana: 4 }
  },
  {
    id: 'danheng', codename: '', trueName: '丹恒•腾荒', path: '大地', primeDrive: '守护', titanTarget: 'georios', home: '奥赫玛',
    epithet: '无名客，「不朽」的龙裔',
    personality: '沉稳寡言，重承诺，默默挡在同伴身前。',
    backstory: '星穹列车的无名客，捍卫「大地」火种的黄金裔。扶八荒之将倾，将地上生灵送往远方的天地——百川归海，群山合鸣。',
    speech: '简练、冷静、可靠。',
    hp: 160, power: 25, defense: 14, inventory: { food: 4, materials: 5 }
  }
];

export function getAllGoldenHeirProfiles(): GoldenHeirProfile[] {
  return GOLDEN_HEIRS;
}
