# 山海异兽录 - 前端整合版

本目录是「山海异兽录」网站的完整版静态前端源码，不包含后端、数据库或部署服务。当前包含 26 个网站页面及 1 个结构图辅助页面。

## 共同开发

本仓库用于共享现有完整版源码；新的全站设计优化目前暂停，尚未实施。

- `main` 为共享基线分支，建议每次修改新建分支并提交 Pull Request。
- 私有仓库的协作者需要先接受仓库所有者的邀请。
- 克隆、预览、提交和验证步骤见 [CONTRIBUTING.md](CONTRIBUTING.md)。
- 不需要 npm 安装或构建，直接打开 `index.html` 即可浏览。

## 页面清单

- `index.html`：首页
- `beasts.html`：神兽图鉴二级栏目页
- `map.html`：栖息地地图二级栏目页
- `culture.html`：文化延伸二级栏目页
- `beast-detail.html`：九尾狐详情页（详情页视觉基准）
- `habitat-detail.html`：地域详情内容页
- `culture-detail.html`：文化典故内容页
- classics.html：原典摘读列表页（按经篇编排的摘读目录，含关键词检字与经篇筛选，数据见 `data/classics.js`）
- `article.html`：原典摘读条目页（经文对读、原书注释、名物考与义疏，正文见 `data/articles.js`，地址形如 `article.html?id=N`）
- `beast-baize.html`：白泽神兽详情页
- `beast-fenghuang.html`：凤凰神兽详情页
- `beast-qilin.html`：麒麟神兽详情页
- `beast-taotie.html`：饕餮神兽详情页
- `beast-xuanwu.html`：玄武神兽详情页
- `beast-qiongqi.html`：穷奇神兽详情页
- `beast-tiangou.html`：天狗神兽详情页
- `beast-zheng.html`：狰神兽详情页
- `beast-xuangui.html`：旋龟神兽详情页
- `beast-yinglong.html`：应龙神兽详情页
- `beast-jingwei.html`：精卫神兽详情页
- `beast-chongming.html`：重明鸟神兽详情页
- `beast-luoyu.html`：蠃鱼神兽详情页
- `beast-huashe.html`：化蛇神兽详情页
- `beast-gudiao.html`：蛊雕神兽详情页
- `poster.html`：山海主题展览海报页
- `about.html`：关于我们与资料来源说明页
- `structure-diagram.html`：站点结构图辅助页

## 打开方式

直接双击 `index.html` 即可浏览整站。各页面均为本地静态页面，导航链接已导通。

## 文件结构

- `css/`：页面样式
- `js/`：地图和基础交互脚本
- `data/`：神兽数据、地图点位数据、原典摘读目录与条目正文数据
- `images/`：页面图片素材
- `docs/`：资料来源说明
- `CONTRIBUTING.md`：多人协作和验证说明
- `AGENTS.md`：AI 编码助手接手约定

浏览器检查缓存和临时截图已通过 `.gitignore` 排除。原有开发版本与完整文献 PDF / DOCX 不包含在此仓库中。

## 内容说明

页面内容参考《山海经》原文、图解资料、古本插图资料、异兽图谱与相关的论文、书籍目录。地图页采用“山川名物考察路线”表达，不宣称对应现代经纬度。

## 神兽详情维护

图鉴中的 16 只神兽各有对应详情页。其余 15 页延续九尾狐的暗青灰背景、淡山水与宣纸纹理、金框目录、原文阅读区与文化主题切换；顶部仅保留返回图鉴。插画可放大，有真实备用素材的饕餮、应龙、玄武另提供换图。禁用 JavaScript 时仍能阅读全部正文和文化主题。

- 九尾狐保留 `beast-detail.html`、`css/jiuweihu-detail.css` 和 `js/jiuweihu-detail.js`。
- 其他详情正文维护于 `data/beast-details.mjs`，共用 `css/jiuweihu-detail.css`、`css/beast-detail-shared.css` 和 `js/beast-detail-interactions.js`。
- 编辑数据后可运行 `node scripts/build-beast-details.mjs`，更新 15 个静态详情页、图鉴链接和共享数据链接。日常浏览无需 Node 或构建。
- 白泽、重明鸟、玄武等后世传统使用明确标注的文化概述；麒麟引用《礼记》，饕餮与狍鸮分开说明，不伪作《山海经》原文。
