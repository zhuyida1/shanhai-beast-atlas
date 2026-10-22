import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { beastDetails } from '../data/beast-details.mjs';
import { readingConnections } from './reading-connections.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const image = beast => `images/demo/thumb-${beast.slug}.jpg`;
const url = beast => beast.slug === 'jiuweihu' ? 'beast-detail.html' : `beast-${beast.slug}.html`;
const all = [...beastDetails, { slug: 'jiuweihu', name: '九尾狐', form: '狐形九尾' }];
const lookup = new Map(all.map(beast => [beast.slug, beast]));
if (lookup.size !== 16) throw new Error('详情数据应包含 15 个不重复的扩展条目');
for (const beast of beastDetails) {
  if (beast.traits.length !== 4 || beast.culture.length !== 4 || beast.related.length !== 3) throw new Error(`章节数据不完整：${beast.name}`);
  await access(resolve(root, image(beast)));
  for (const slug of beast.related) if (!lookup.has(slug) || slug === beast.slug) throw new Error(`相关推荐无效：${beast.name}/${slug}`);
}

function render(beast) {
  const { name, slug } = beast;
  const artwork = image(beast);
  const artAlt = `${name}国风插画，形貌与配色为艺术演绎`;
  const variant = ['taotie', 'yinglong', 'xuanwu'].includes(slug) ? `images/demo/thumb-${slug}-v2.jpg` : null;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(name)} · ${esc(beast.form)}｜山海异兽录</title>
  <meta name="description" content="${esc(beast.intro)}欣赏${esc(name)}插画，阅读来源、核心特征与文化延伸。">
  <link rel="stylesheet" href="css/jiuweihu-detail.css">
  <link rel="stylesheet" href="css/beast-detail-shared.css">
  <script src="js/beast-detail-interactions.js" defer></script>
  <link rel="icon" type="image/png" href="images/demo/山海经1logo.png">
  <meta name="theme-color" content="#171c1b">
  <link rel="stylesheet" href="css/site-experience.css">
  <script src="js/site-experience.js" defer></script>
</head>
<body class="beast-reading-page" data-beast="${slug}">
  <a class="skip-link" href="#origin">跳到正文</a>
  <main>
    <section class="fox-hero" aria-labelledby="beast-title">
      <div class="hero-top page-width"><nav aria-label="返回上一级"><a class="back-link" href="beasts.html"><span aria-hidden="true">←</span> 返回神兽图鉴</a></nav></div>
      <div class="hero-layout page-width">
        <div class="hero-copy">
          <h1 id="beast-title" data-reveal>${esc(name)}</h1>
          <p class="hero-subtitle" data-reveal>${esc(beast.subtitle)}</p>
          <p class="hero-intro" data-reveal>${esc(beast.intro)}</p>
          <a class="primary-link" href="#origin" data-reveal>探读神兽本源 <span aria-hidden="true">↓</span></a>
          <dl class="hero-facts" data-reveal><div><dt>出典</dt><dd>${esc(beast.source)}</dd></div><div><dt>${beast.summary || slug === 'qilin' ? '语境' : '所在'}</dt><dd>${esc(beast.place)}</dd></div><div><dt>特征</dt><dd>${esc(beast.form)}</dd></div></dl>
        </div>
        <figure class="hero-art" data-reveal>
          <a href="${artwork}" class="art-open" data-lightbox aria-label="放大欣赏${esc(name)}插画"><img id="beast-art" src="${artwork}" alt="${artAlt}" width="768" height="768" fetchpriority="high"><span class="enlarge-label">放大赏图 <span aria-hidden="true">↗</span></span></a>
          <figcaption><span id="art-caption">${esc(name)} · 神兽绘像</span><span>插画为艺术演绎</span></figcaption>
        </figure>
      </div>
      <div class="art-selection page-width">
        <p>${esc(beast.form)}，循图入卷。</p>
        ${variant ? `<div class="art-options" aria-label="${esc(name)}插画切换"><a href="${artwork}" class="art-option is-selected" data-art data-caption="${esc(name)} · 神兽绘像" data-alt="${artAlt}" aria-current="true"><img src="${artwork}" alt="" width="120" height="80"><span>神兽绘像</span></a><a href="${variant}" class="art-option" data-art data-caption="${esc(name)} · 另一种演绎" data-alt="${name}的另一幅国风插画，形貌为艺术演绎"><img src="${variant}" alt="" width="120" height="80"><span>另一种演绎</span></a></div>` : `<a class="text-link" href="${artwork}" download="${slug}-illustration.jpg">保存神兽插画 <span aria-hidden="true">↓</span></a>`}
      </div>
    </section>
    ${readingConnections(beast)}
    <div class="reading-layout page-width">
      <aside class="reading-sidebar" aria-label="本页阅读目录"><div class="reading-sticky">
        <p class="toc-title">循卷而读</p>
        <nav class="reading-nav"><a href="#origin" aria-current="location">神兽本源</a><a href="#traits">核心特征</a><a href="#culture">文化延伸</a><a href="#related">相关图鉴</a></nav>
        <p class="reading-note">以文献为起点，<br>看见传说的不同层次。</p>
        <a class="download-link" href="${artwork}" download="${slug}-illustration.jpg">保存神兽插画 <span aria-hidden="true">↓</span></a>
      </div></aside>
      <article class="reading-content">
        <section class="chapter origin-chapter" id="origin" aria-labelledby="origin-title">
          <div class="chapter-heading" data-reveal><h2 id="origin-title">神兽本源</h2><span>${beast.summary ? '从文化记述中认识它' : '从一段古老的记载开始'}</span></div>
          <div class="original-text" data-reveal>${beast.summary ? `<p class="source-title">文化概述</p><p class="source-summary">${esc(beast.original)}</p>` : `<blockquote>${esc(beast.original)}</blockquote>`}<p class="quote-note">${esc(beast.sourceNote)}</p></div>
          <div class="origin-reading" data-reveal><h3>${beast.summary ? '理解这段文化记述' : '读懂这段原文'}</h3>${beast.reading.map(p => `<p>${esc(p)}</p>`).join('')}${beast.article ? `<a class="text-link" href="article.html?id=${beast.article}">对照${slug === 'taotie' ? '狍鸮' : esc(name)}原典摘读 <span aria-hidden="true">↗</span></a>` : ''}</div>
        </section>
        <section class="chapter" id="traits" aria-labelledby="traits-title">
          <div class="chapter-heading" data-reveal><h2 id="traits-title">核心特征</h2><span>循着文字，辨认${esc(name)}</span></div>
          <div class="traits-layout"><figure class="trait-art" data-reveal><img src="${artwork}" alt="${artAlt}" width="768" height="768" loading="lazy"><figcaption>${esc(name)}形态的插画演绎</figcaption></figure><dl class="trait-list">${beast.traits.map(([term, description]) => `<div data-reveal><dt>${esc(term)}</dt><dd>${esc(description)}</dd></div>`).join('')}</dl></div>
        </section>
        <section class="chapter" id="culture" aria-labelledby="culture-title">
          <div class="chapter-heading" data-reveal><h2 id="culture-title">文化延伸</h2><span>从${esc(name)}，读向更远的想象</span></div>
          <div class="culture-tabs" aria-label="文化阅读主题" data-reveal>${beast.culture.map(([label], i) => `<button type="button" id="tab-topic${i}" data-tab="topic${i}">${esc(label)}</button>`).join('')}</div>
          <div class="culture-panels" data-reveal>${beast.culture.map(([, title, text], i) => `<section id="panel-topic${i}" data-panel="topic${i}" aria-labelledby="tab-topic${i}"><h3>${esc(title)}</h3><p>${esc(text)}</p></section>`).join('')}</div>
          <a class="culture-more text-link" href="culture.html">沿着传说，继续文化寻踪 <span aria-hidden="true">↗</span></a>
        </section>
      </article>
    </div>
    <section class="related-section page-width" id="related" aria-labelledby="related-title">
      <div class="related-heading" data-reveal><div><h2 id="related-title">山海之中，再遇灵奇。</h2><p>翻过这一页，还有更多神兽等待相逢。</p></div><a class="text-link" href="beasts.html">浏览全部图鉴 <span aria-hidden="true">↗</span></a></div>
      <div class="related-grid">${beast.related.map(slug => {
        const related = lookup.get(slug);
        return `<a class="related-beast" href="${url(related)}" data-reveal><div class="related-image"><img src="${image(related)}" alt="${esc(related.name)}神兽插画" width="768" height="768" loading="lazy"></div><div class="related-copy"><h3>${esc(related.name)}</h3><span>${esc(related.form)}</span><span aria-hidden="true">↗</span></div></a>`;
      }).join('')}</div>
    </section>
  </main>
  <footer class="detail-footer"><div class="page-width footer-content"><a class="footer-brand" href="index.html"><img src="images/demo/山海经1logo.png" alt="" width="44" height="52"><span>山海异兽录</span></a><a class="back-link" href="beasts.html">返回神兽图鉴 <span aria-hidden="true">↗</span></a><p>山海异兽录·山海经神兽图鉴科普网站</p></div></footer>
  <dialog class="art-dialog" aria-label="${esc(name)}插画大图欣赏"><button class="dialog-close" type="button" autofocus>关闭大图 <span aria-hidden="true">×</span></button><img src="${artwork}" alt="${artAlt}" width="768" height="768"><p>${esc(name)} · 插画为艺术演绎</p></dialog>
</body>
</html>
`;
}

for (const beast of beastDetails) await writeFile(resolve(root, url(beast)), render(beast));

// 同步静态目录与共享数据；每项依据名称匹配，不依赖卡片排列顺序。
const byName = new Map(all.map(beast => [beast.name, beast]));
const catalogPath = resolve(root, 'beasts.html');
const catalog = await readFile(catalogPath, 'utf8');
let cards = 0;
const updated = catalog.replace(/<article class="catalog-card"[\s\S]*?<\/article>/g, card => {
  const name = card.match(/<h3>(.*?)<\/h3>/)?.[1];
  const beast = byName.get(name);
  if (!beast) throw new Error(`图鉴中存在未对应条目：${name}`);
  cards++;
  return card.replace(/href="beast-[^"]+\.html"/g, `href="${url(beast)}"`);
});
if (cards !== 16) throw new Error(`应匹配 16 张图鉴卡片，实际 ${cards}`);
await writeFile(catalogPath, updated);
const dataPath = resolve(root, 'data/beasts.js');
const data = await readFile(dataPath, 'utf8');
await writeFile(dataPath, data.replace(/name: '([^']+)'([\s\S]*?)link: '[^']+'/g, (match, name, body) => {
  const beast = byName.get(name);
  return beast ? `name: '${name}'${body}link: '${url(beast)}'` : match;
}));
console.log(`已生成 ${beastDetails.length} 个详情页，并对应 ${cards} 个图鉴入口。`);
