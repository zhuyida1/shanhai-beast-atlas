/* 原典摘读列表数据：列表页只读取本文件渲染目录，新增条目追加对象即可。
 * 字段：id 编号 / title 标题 / summary 一句话摘要 / category 分类标签（经篇归属） /
 *       cover 配图路径 / link 条目地址
 * 说明：
 *   1. link 指向 article.html?id=N，正文存放在 data/articles.js，两处的 id 必须对应。
 *   2. cover 留空时页面会渲染统一的「插图待补」图版占位；以后换成插图时，
 *      只需把路径填进 cover（如 'images/hero/hero-jiuweihu-integrated.png'）。
 *   3. 分类标签按《山海经》五藏山经与海荒经的篇目组织，条目顺序即阅读顺序。
 *   4. 这是首发的一批条目，不是全站总量：条目番号、卷序和篇目筛选项
 *      都由 js/classics.js 自动生成，页面文案里不写死条数。
 */
const SHANHAI_CLASSICS = [
  {
    id: 1,
    title: '青丘九尾狐：其状如狐而九尾',
    summary: '青丘之山的四句记载：九尾、婴儿之音、食人、食者不蛊，形貌与后果一句话说清。',
    category: '南山经',
    cover: '',
    link: 'article.html?id=1'
  },
  {
    id: 2,
    title: '丹穴凤凰：五采而文，见则安宁',
    summary: '从「状如鸡」到五处羽毛花纹，一条记载如何把羽色写成天下安宁的征兆。',
    category: '南山经',
    cover: '',
    link: 'article.html?id=2'
  },
  {
    id: 3,
    title: '杻阳旋龟：龟身鸟首而虺尾',
    summary: '怪水里的异形之龟：鸟首蛇尾、声如判木，原文还记了佩之不聋、可以为底。',
    category: '南山经',
    cover: '',
    link: 'article.html?id=3'
  },
  {
    id: 4,
    title: '鹿吴蛊雕：如雕而有角，其音如婴儿',
    summary: '鹿吴之山无草木多金石，泽更之水里住着一只带角的食人雕兽。',
    category: '南山经',
    cover: '',
    link: 'article.html?id=4'
  },
  {
    id: 5,
    title: '章莪之狰：赤豹五尾而一角',
    summary: '章莪之山「所为甚怪」，赤豹五尾而一角，其音如击石，怪异先从山气里来。',
    category: '西山经',
    cover: '',
    link: 'article.html?id=5'
  },
  {
    id: 6,
    title: '阴山天狗：状如狸而白首，可以御凶',
    summary: '阴山白首之狸，其音如榴榴；与同卷凶兽相反，它是可以御凶的一只。',
    category: '西山经',
    cover: '',
    link: 'article.html?id=6'
  },
  {
    id: 7,
    title: '邽山穷奇：状如牛而猬毛，是食人',
    summary: '邽山之上，状如牛而猬毛，音如嗥狗而食人；四凶的名号另有后世来历。',
    category: '西山经',
    cover: '',
    link: 'article.html?id=7'
  },
  {
    id: 8,
    title: '钩吾狍鸮：羊身人面而食人',
    summary: '钩吾之山的食人兽：羊身人面、目在腋下、虎齿人爪，原典只作狍鸮。',
    category: '北山经',
    cover: '',
    link: 'article.html?id=8'
  },
  {
    id: 9,
    title: '大荒应龙：杀蚩尤与夸父',
    summary: '凶犁土丘的应龙：杀蚩尤与夸父而不得复上，故下界数旱；旱时作应龙之状求雨。',
    category: '海荒经',
    cover: '',
    link: 'article.html?id=9'
  },
  {
    id: 10,
    title: '流波山夔：一足苍身而声如雷',
    summary: '流波山的夔：一足苍身，光如日月声如雷，其皮为鼓，声闻五百里。',
    category: '海荒经',
    cover: '',
    link: 'article.html?id=10'
  }
];
