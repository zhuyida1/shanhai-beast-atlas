# 山海异兽录 - 前端整合版

本目录是课程作业网站的完整版静态前端源码，不包含后端、数据库或部署服务。当前包含 15 个网站页面，满足课程对多页面网站数量的要求。旧版首页、重复图鉴页及结构图辅助页已清理，页面清单以下列实际文件为准。

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
- `beast-detail.html`：神兽详情内容页
- `habitat-detail.html`：地域详情内容页
- `culture-detail.html`：文化典故内容页
- `classics.html`：山海原典摘读内容页
- `beast-baize.html`：白泽神兽详情页
- `beast-fenghuang.html`：凤凰神兽详情页
- `beast-qilin.html`：麒麟神兽详情页
- `beast-taotie.html`：饕餮神兽详情页
- `beast-xuanwu.html`：玄武神兽详情页
- `poster.html`：山海主题展览海报页
- `about.html`：关于我们与资料来源说明页

## 打开方式

直接双击 `index.html` 即可浏览整站。各页面均为本地静态页面，导航链接已导通。

## 文件结构

- `css/`：页面样式
- `js/`：地图和基础交互脚本
- `data/`：神兽数据和地图点位数据
- `images/`：页面图片素材
- `docs/`：资料来源说明
- `CONTRIBUTING.md`：多人协作和验证说明
- `AGENTS.md`：AI 编码助手接手约定

浏览器检查缓存和临时截图已通过 `.gitignore` 排除。原有开发版本、完整文献 PDF / DOCX 与课程要求目录不包含在此仓库中。

## 内容说明

页面内容参考《山海经》原文、图解资料、古本插图资料、异兽图谱和课程要求中整理的论文/书籍目录。地图页采用“山川名物考察路线”表达，不宣称对应现代经纬度。
