import { readFile } from 'node:fs/promises';

// Use the site's existing records. Missing geography stays a general map entry.
const source = await readFile(new URL('../data/habitats.js', import.meta.url), 'utf8');
const habitat = JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1));
export function readingConnections(beast) {
  const record = habitat.beasts.find(item => item.name === beast.name);
  const map = record ? `map.html?point=${encodeURIComponent(record.id)}` : 'map.html';
  const article = beast.article ? `article.html?id=${beast.article}` : 'classics.html';
  return `<section class="reading-connections page-width" aria-label="继续探索"><div><h2>循图读文，沿山寻兽</h2><p>从这一幅画，继续走进原典与山海。</p></div><nav aria-label="延伸阅读"><a href="${article}">${beast.article ? beast.slug === 'taotie' ? '辨读相关原典' : '对照原典摘读' : '浏览原典目录'}</a><a href="${map}">${record ? '在舆图中定位' : '展开山海舆图'}</a><a href="culture.html">继续文化寻踪</a></nav></section>`;
}
