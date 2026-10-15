const fs = require('fs');

const files = [
  'culture.html',
  'culture-detail.html',
  'habitat-detail.html',
  'map.html'
];

const newHeader = `<header class="ex-header">
    <div class="site-shell ex-nav">
      <a class="brand" href="index.html" aria-label="山海异兽录首页">
        <span class="logo-mark logo-image"><img src="images/demo/山海经1logo.png" alt="山海异兽录 logo"></span>
        <span><span class="brand-title">山海异兽录</span><span class="brand-sub">山海经神兽图鉴科普网站</span></span>
      </a>
      <nav class="nav-menu" aria-label="主导航">
        <a href="index.html">首页</a>
        <a href="beasts.html">神兽图鉴</a>
        <a href="map.html">栖息地</a>
        <a href="culture.html">文化延伸</a>
        <a href="about.html">关于我们</a>
      </nav>
      <div class="search-pill">搜索神兽、典故、地名 <span>⌕</span></div>
    </div>
  </header>`;

const newFooter = `<footer class="ex-footer">
    <div class="site-shell footer-grid">
      <div>
        <div class="footer-brand">
          <span class="logo-mark logo-image"><img src="images/demo/山海经1logo.png" alt="山海异兽录 logo"></span>
          <span><strong class="brand-title">山海异兽录</strong><p>以图解经，以文化人，探索《山海经》中的神兽世界与华夏文明。</p></span>
        </div>
      </div>
      <div class="footer-col"><h4>导航</h4><a href="index.html">首页</a><a href="beasts.html">神兽图鉴</a><a href="map.html">栖息地</a></div>
      <div class="footer-col"><h4>详情</h4><a href="beast-detail.html">神兽详情</a><a href="habitat-detail.html">地域详情</a><a href="culture-detail.html">文化详情</a></div>
      <div class="footer-col"><h4>说明</h4><a href="culture.html">文化延伸</a><a href="about.html">关于我们</a><a href="docs/source-notes.md">资料来源</a></div>
      <div class="footer-col"><h4>作业说明</h4><p>本网站为八页完整版山海异兽录静态前端站点。</p></div>
    </div>
    <div class="site-shell copyright">© 2024 山海异兽录 · 山海经神兽图鉴科普网站</div>
  </footer>`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace header: match <header ...> ... </header>
  content = content.replace(/<header[\s\S]*?<\/header>/, newHeader);

  // Replace footer: match <footer ...> ... </footer>
  content = content.replace(/<footer[\s\S]*?<\/footer>/, newFooter);

  // Set active nav based on page
  if (file.includes('culture')) {
    content = content.replace(
      '<a href="culture.html">文化延伸</a>',
      '<a class="active" href="culture.html">文化延伸</a>'
    );
  } else if (file === 'map.html' || file === 'habitat-detail.html') {
    content = content.replace(
      '<a href="map.html">栖息地</a>',
      '<a class="active" href="map.html">栖息地</a>'
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated: ' + file);
});

console.log('Done. All 4 files updated.');
