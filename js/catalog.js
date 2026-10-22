/* Search, pagination and recoverable reading state for the static catalogue. */
(() => {
  'use strict';
  const chips = [...document.querySelectorAll('.filter-chip')];
  const cards = [...document.querySelectorAll('.catalog-card')];
  const search = document.getElementById('catalogSearch');
  const count = document.getElementById('resultCount');
  const pagination = document.getElementById('catalogPagination');
  const empty = document.getElementById('catalog-empty');
  const reset = document.getElementById('catalog-reset');
  const PER_PAGE = 8;
  let category = 'all', page = 1;
  const read = () => {
    const params = new URLSearchParams(location.search);
    const value = params.get('category');
    category = chips.some(chip=>chip.dataset.filter===value) ? value : 'all';
    page = Math.max(1,parseInt(params.get('page'),10)||1);
    search.value = params.get('search') || '';
  };
  const save = () => {
    const url = new URL(location.href);
    for (const [key,value] of [['search',search.value.trim()],['category',category==='all'?'':category],['page',page>1?String(page):'']]) {
      if (value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    try { history.replaceState(null,'',url); } catch (_) { /* Local file browsing remains usable. */ }
  };
  const render = () => {
    const term = search.value.trim().toLowerCase();
    const found = cards.filter(card=>(category==='all'||card.dataset.category===category)&&(!term||(card.dataset.key+' '+card.textContent).toLowerCase().includes(term)));
    const total = Math.max(1,Math.ceil(found.length/PER_PAGE)); page=Math.min(page,total);
    const shown = new Set(found.slice((page-1)*PER_PAGE,page*PER_PAGE));
    cards.forEach(card=>{card.hidden=!shown.has(card);});
    count.textContent=found.length;
    chips.forEach(chip=>{const selected=chip.dataset.filter===category;chip.classList.toggle('active',selected);chip.setAttribute('aria-pressed',String(selected));});
    empty.hidden=found.length>0; pagination.hidden=found.length===0; reset.hidden=!term&&category==='all';
    pagination.replaceChildren();
    const add = (label,target,disabled=false,current=false) => {
      const button=document.createElement('button'); button.type='button';button.textContent=label;button.disabled=disabled;
      button.setAttribute('aria-label',/^\d+$/.test(label)?`第 ${label} 页`:label);
      if(current)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{
        page=target;render();
        pagination.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
        document.querySelector('.catalog-main').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
      });
      pagination.append(button);
    };
    add('上一页',page-1,page===1);
    for(let i=1;i<=total;i++)add(String(i),i,false,i===page);
    add('下一页',page+1,page===total);
    save();
  };
  const clear = () => { search.value='';category='all';page=1;render();search.focus(); };
  chips.forEach(chip=>chip.addEventListener('click',()=>{category=chip.dataset.filter;page=1;render();}));
  search.addEventListener('input',()=>{page=1;render();});
  search.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();clear();}});
  reset.addEventListener('click',clear);
  empty.querySelector('button').addEventListener('click',clear);
  document.addEventListener('keydown',event=>{
    if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable]'))return;
    event.preventDefault();search.focus();search.select();
  });
  addEventListener('popstate',()=>{read();render();});
  read();render();
  // Cards remain visible if JS or observer support is unavailable.
  cards.forEach(card=>card.classList.add('in-view'));
})();
