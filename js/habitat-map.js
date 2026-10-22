(() => {
  'use strict';
  const H=window.ShanhaiHabitats,{$,el,clamp,data,placeById,beastById}=H;
  const viewport=$('#map-viewport');if(!viewport)return;
  const svg=$('#habitat-map'),hotspots=$('#hotspot-layer'),labels=$('#label-layer'),tooltip=$('#map-tooltip');
  const labelLeaders=document.createElementNS('http://www.w3.org/2000/svg','svg');
  labelLeaders.classList.add('map-label-leaders');labelLeaders.setAttribute('aria-hidden','true');labels.before(labelLeaders);
  let world=H.mountWorld(svg,'atlas'),terrainKey='world',localPositions=new Map();
  const state=H.readState(),initialParams=new URLSearchParams(location.search);
  if(state.passage&&!initialParams.has('point')){const route=data.textRoutes.find(r=>r.id===state.passage),from=placeById.get(route.from);if(from)state.point=from.beastIds[0];else state.node=route.from;}
  let results=[],visiblePlaces=[],frame=0,saveTimer=0,searchTimer=0,operating=false,suppressClickUntil=0,gesture=null;
  const pointers=new Map(),pointButtons=new Map(),labelNodes=new Map(),clusterButtons=new Map(),catalogButtons=new Map();
  const motion=window.ShanhaiHabitatMotion?.create(viewport);
  const coarse=matchMedia('(pointer:coarse)'),small=matchMedia('(max-width:760px)');
  svg.removeAttribute('hidden');$('.map-fallback',viewport).hidden=true;
  document.querySelectorAll('[data-js-controls]').forEach(e=>e.hidden=false);

  function matchedRecords(){return data.beasts.filter(b=>{const p=placeById.get(b.placeId);const text=[b.name,...b.aliases,p.name,p.chapterLabel,p.seriesLabel,p.environment.summary,b.environmentLabel,H.chapters[p.chapterKey],...b.tags,b.summary].join(' ').toLowerCase();return (state.chapter==='all'||p.chapterKey===state.chapter)&&(state.series==='all'||p.seriesId===state.series)&&(state.category==='all'||b.categoryKey===state.category)&&(state.review==='all'||b.reviewStatus===state.review)&&(!state.q||text.includes(state.q.toLowerCase()));});}
  function currentPlace(){return state.node||beastById.get(state.point)?.placeId;}
  function displayPlace(id){const p=placeById.get(id)||H.contextById.get(id);return p?{...p,position:state.view==='region'?localPositions.get(id)||p.position:p.position}:null;}
  function syncLinks(){const b=beastById.get(state.point);if(b)$('#region-link').href=H.detailHref(b.placeId,b.id,state);}
  function commit(push=false){H.saveState(state,push);syncLinks();}
  function constrain(){state.z=clamp(state.z,1,3);const half=500/state.z;state.cx=clamp(state.cx,half,1000-half);state.cy=clamp(state.cy,half,1000-half);}
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;drawCamera();});}
  function setCamera(z,cx,cy){state.z=z;state.cx=cx;state.cy=cy;constrain();schedule();}
  function pointOnScreen(p){const m=world.getScreenCTM(),rect=viewport.getBoundingClientRect();if(!m)return {x:0,y:0};const pt=new DOMPoint(p.position.x,p.position.y).matrixTransform(m);return {x:pt.x-rect.left,y:pt.y-rect.top};}
  function svgPoint(x,y){return new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());}
  function worldPoint(x,y){return new DOMPoint(x,y).matrixTransform(world.getScreenCTM().inverse());}
  function zoomAt(z,clientX,clientY){const anchor=worldPoint(clientX,clientY),local=svgPoint(clientX,clientY);z=clamp(z,1,3);setCamera(z,anchor.x-(local.x-500)/z,anchor.y-(local.y-500)/z);}
  function zoomCenter(z){const rect=viewport.getBoundingClientRect();zoomAt(z,rect.left+rect.width/2,rect.top+rect.height/2);commit();}
  function fit(places,maxZoom=2.35){if(!places.length)return;const xs=places.map(p=>p.position.x),ys=places.map(p=>p.position.y);const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);setCamera(Math.min(maxZoom,1000/(Math.max(right-left,bottom-top)+250)),(left+right)/2,(top+bottom)/2);}
  function focusPlace(p){setCamera(Math.max(state.z,1.7),p.position.x,p.position.y);}
  function showTooltip(button,text){tooltip.textContent=text;tooltip.hidden=false;const r=viewport.getBoundingClientRect(),b=button.getBoundingClientRect();const left=clamp(b.left-r.left+22-tooltip.offsetWidth/2,10,Math.max(10,r.width-tooltip.offsetWidth-10));const top=b.top-r.top- tooltip.offsetHeight-4;tooltip.style.left=left+'px';tooltip.style.top=clamp(top,8,r.height-tooltip.offsetHeight-8)+'px';}
  function hideTooltip(){tooltip.hidden=true;}
  function makeHotspot(key){const button=el('button','hotspot');button.type='button';button.dataset.hotspot=key;const core=el('span','point-core');core.setAttribute('aria-hidden','true');button.append(core);hotspots.append(button);button.addEventListener('pointerenter',()=>{if(!pointers.size)showTooltip(button,button.getAttribute('aria-label'));});button.addEventListener('pointerleave',hideTooltip);button.addEventListener('focus',()=>showTooltip(button,button.getAttribute('aria-label')));button.addEventListener('blur',hideTooltip);return button;}
  for(const place of [...data.places,...data.contextNodes]){
    const button=makeHotspot(place.id);button.dataset.place=place.id;button.classList.toggle('is-context',place.kind==='context');button.classList.toggle('is-story',place.environment?.terrain==='story');button.addEventListener('click',()=>{if(performance.now()<suppressClickUntil)return;if(place.kind==='context'){selectContext(place.id);return;}const b=results.find(b=>b.placeId===place.id);if(b)select(b.id,true);});pointButtons.set(place.id,button);
    const label=el('span','map-label',place.name);labels.append(label);labelNodes.set(place.id,label);
  }
  function clustersFor(points){let groups=points.map(p=>({places:[p.place],x:p.x,y:p.y}));let changed=true;
    while(changed){changed=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)if(Math.abs(groups[i].x-groups[j].x)<46&&Math.abs(groups[i].y-groups[j].y)<46){const a=groups[i],b=groups[j],n=a.places.length+b.places.length;a.x=(a.x*a.places.length+b.x*b.places.length)/n;a.y=(a.y*a.places.length+b.y*b.places.length)/n;a.places.push(...b.places);groups.splice(j,1);changed=true;break outer;}}
    return groups;
  }
  function drawCamera(){
    constrain();world.setAttribute('transform',`translate(${500-state.cx*state.z} ${500-state.cy*state.z}) scale(${state.z})`);
    $('#zoom-value').textContent=Math.round(state.z*100)+'%';$('#zoom-in').disabled=state.z>=3;$('#zoom-out').disabled=state.z<=1;
    const rect=viewport.getBoundingClientRect(),activePlace=currentPlace();
    const positions=visiblePlaces.map(place=>({...pointOnScreen(place),place})).filter(p=>p.x>=22&&p.y>=22&&p.x<=rect.width-22&&p.y<=rect.height-22);
    const groups=clustersFor(positions),isolated=[];
    for(const button of pointButtons.values())button.hidden=true;
    for(const button of clusterButtons.values())button.hidden=true;
    for(const group of groups){
      let button;
      if(group.places.length===1){const p=group.places[0];button=pointButtons.get(p.id);const members=results.filter(b=>b.placeId===p.id);button.setAttribute('aria-label',p.name+' · '+(p.kind==='context'?'经文辅助节点':members.map(b=>b.name).join('、')));button.setAttribute('aria-pressed',String(activePlace===p.id));button.classList.toggle('is-selected',activePlace===p.id);isolated.push({...group,place:p});}
      else{const key=group.places.map(p=>p.id).sort().join('|');button=clusterButtons.get(key);if(!button){button=makeHotspot(key);button.classList.add('is-cluster');button.addEventListener('click',()=>{if(performance.now()<suppressClickUntil)return;hideTooltip();fit(button._places,3);const picker=$('#cluster-picker');picker.hidden=false;const list=$('div',picker);list.replaceChildren();for(const p of button._places){const pick=el('button','',p.name);pick.type='button';pick.addEventListener('click',()=>{if(p.kind==='context')selectContext(p.id);else{const b=results.find(b=>b.placeId===p.id);select(b.id,true);}requestAnimationFrame(()=>{const point=pointButtons.get(p.id),target=!point.hidden?point:[...clusterButtons.values()].find(c=>!c.hidden&&c._places.some(place=>place.id===p.id));target?.focus({preventScroll:true});});});list.append(pick);}commit();});clusterButtons.set(key,button);}
        button._places=group.places;button.setAttribute('aria-label',group.places.length+'处相邻地点：'+group.places.map(p=>p.name).join('、')+'，点击放大或选择');$('.point-core',button).textContent=String(group.places.length);button.setAttribute('aria-pressed',String(group.places.some(p=>p.id===activePlace)));button.classList.toggle('is-selected',group.places.some(p=>p.id===activePlace));
      }
      button.hidden=false;button.style.left=group.x+'px';button.style.top=group.y+'px';
    }
    const focused=document.activeElement;if(focused?.classList.contains('hotspot')&&focused.hidden){const related=focused.dataset.place?[focused.dataset.place]:focused._places?.map(p=>p.id)||[];const replacement=[...pointButtons.values()].find(b=>!b.hidden&&related.includes(b.dataset.place))||[...clusterButtons.values()].find(b=>!b.hidden&&b._places.some(p=>related.includes(p.id)))||[...pointButtons.values()].find(b=>!b.hidden);replacement?.focus({preventScroll:true});}
    layoutLabels(isolated,groups,rect);
    const selectedButton=pointButtons.get(activePlace);
    motion?.follow(activePlace,selectedButton&&!selectedButton.hidden?{x:parseFloat(selectedButton.style.left),y:parseFloat(selectedButton.style.top)}:null);
    syncLinks();
  }
  function layoutLabels(isolated,groups,rect){
    labelLeaders.replaceChildren();labelLeaders.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    for(const l of labelNodes.values()){l.hidden=true;delete l.dataset.places;}if(!state.labels)return;
    const active=currentPlace(),boxes=[];
    const priority=p=>(p.id===active?100:0)+p.labelPriority+(state.q?10:0);
    const ordered=[...groups].sort((a,b)=>Math.max(...b.places.map(priority))-Math.max(...a.places.map(priority)));
    const overlap=(a,b,pad=4)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w+pad)-Math.max(a.x,b.x-pad))*Math.max(0,Math.min(a.y+a.h,b.y+b.h+pad)-Math.max(a.y,b.y-pad));
    for(const point of ordered){
      const label=labelNodes.get(point.places[0].id);
      label.replaceChildren(...point.places.map(p=>el('span','map-label-name',p.name)));
      label.dataset.places=point.places.map(p=>p.id).join(' ');
      label.classList.toggle('is-selected',point.places.some(p=>p.id===active));
      label.classList.toggle('is-group',point.places.length>1);label.hidden=false;
      const w=label.offsetWidth,h=label.offsetHeight,candidates=[];
      // Search around the point rather than dropping names after a fixed quota.
      for(const d of [18,32,50,72,96])for(const [x,y]of [[point.x+d,point.y-h/2],[point.x-d-w,point.y-h/2],[point.x-w/2,point.y-d-h],[point.x-w/2,point.y+d],[point.x+d,point.y-d-h],[point.x-d-w,point.y+d]]){
        const b={x:clamp(x,5,Math.max(5,rect.width-w-5)),y:clamp(y,5,Math.max(5,rect.height-h-5)),w,h};
        const collisions=boxes.reduce((sum,c)=>sum+overlap(b,c),0)+groups.reduce((sum,g)=>sum+overlap(b,{x:g.x-12,y:g.y-12,w:24,h:24},2),0);
        const distance=Math.hypot(b.x+w/2-point.x,b.y+h/2-point.y);
        candidates.push({...b,score:collisions*1000+distance});
      }
      candidates.sort((a,b)=>a.score-b.score);const box=candidates[0];
      label.style.left=box.x+'px';label.style.top=(box.y+h/2)+'px';boxes.push(box);
      const endX=clamp(point.x,box.x,box.x+w),endY=clamp(point.y,box.y,box.y+h);
      if(Math.hypot(endX-point.x,endY-point.y)>22){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',point.x);line.setAttribute('y1',point.y);line.setAttribute('x2',endX);line.setAttribute('y2',endY);labelLeaders.append(line);}
    }
  }
  function activeRoutes(){const ids=new Set(visiblePlaces.map(p=>p.id));if(state.view==='world'&&results.length&&state.category==='all'&&state.review==='all'&&!state.q)for(const n of data.contextNodes.filter(n=>n.seriesId===state.series))ids.add(n.id);return state.text?data.textRoutes.filter(r=>r.seriesId===state.series&&ids.has(r.from)&&ids.has(r.to)):[];}
  function renderEnvironment(){const layer=$('.named-environment',world),p=placeById.get(currentPlace());layer.innerHTML=state.environment&&state.view==='region'&&p?window.ShanhaiHabitatArt.environment('atlas',p,displayPlace(p.id).position):'';}
  function renderRoutes(){
    const layer=$('.browse-routes',world),textLayer=$('.text-routes',world);layer.replaceChildren();textLayer.replaceChildren();
    $('#route-note').hidden=!state.route;$('#route-note').textContent=state.chapter==='all'?'选择一篇山经，可查看本站主题浏览路线。':state.chapter==='haihuang'?'海荒经点位单独阅读，本层不绘制山经式路线。':'虚线为本站主题浏览顺序；金色箭头另示有出处的经文路段。';
    const ids=new Set(visiblePlaces.map(p=>p.id));
    if(state.route&&state.chapter!=='all'&&state.chapter!=='haihuang')for(const route of data.routes.filter(r=>r.chapterKey===state.chapter))for(let i=1;i<route.placeIds.length;i++){const a=displayPlace(route.placeIds[i-1]),b=displayPlace(route.placeIds[i]);if(!ids.has(a.id)||!ids.has(b.id))continue;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M${a.position.x} ${a.position.y}L${b.position.x} ${b.position.y}`);layer.append(path);}
    if(state.view!=='region')return;
    const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');defs.innerHTML='<marker id="atlas-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="#98703a" stroke-width="1.5"/></marker>';textLayer.append(defs);
    const flowLayer=document.createElementNS(ns,'g');
    flowLayer.classList.add('route-flow-layer');
    flowLayer.setAttribute('aria-hidden','true');
    for(const r of activeRoutes()){
      const a=displayPlace(r.from).position,b=displayPlace(r.to).position,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),path=document.createElementNS(ns,'path');
      path.setAttribute('d',`M${a.x+dx/len*28} ${a.y+dy/len*28}L${b.x-dx/len*28} ${b.y-dy/len*28}`);
      path.setAttribute('marker-end','url(#atlas-route-arrow)');
      path.dataset.routeEdge=r.id;
      path.classList.toggle('is-selected',state.passage===r.id);
      path.addEventListener('click',()=>{if(performance.now()>=suppressClickUntil)chooseRoute(r.id);});
      textLayer.append(path);
      // Trace the existing sourced edge. The decorative copy has no arrow or hit target.
      const flow=document.createElementNS(ns,'path');
      flow.setAttribute('d',path.getAttribute('d'));
      flow.classList.add('route-flow');
      flow.classList.toggle('is-selected',state.passage===r.id);
      flow.dataset.flowRoute=r.id;
      flowLayer.append(flow);
    }
    if(flowLayer.childElementCount)textLayer.append(flowLayer);
  }
  function chooseRoute(id){const route=data.textRoutes.find(r=>r.id===id);if(!route)return;state.series=route.seriesId;state.chapter=H.seriesById.get(route.seriesId).chapterKey;state.view='region';state.text=true;state.passage=id;state.node=H.contextById.has(route.from)?route.from:'';const first=placeById.get(route.from);if(first)state.point=results.find(b=>b.placeId===first.id)?.id||first.beastIds[0];Object.assign(state,{z:1,cx:500,cy:500});render();const p=displayPlace(currentPlace());if(p)motion?.select(p.id,p.name);requestAnimationFrame(()=>$('#passage-detail').focus({preventScroll:true}));}
  function renderPassages(){const routes=activeRoutes(),host=$('#text-route-list');host.replaceChildren();$('#route-reader').hidden=state.series==='all';$('#text-route-note').textContent=!state.text?'开启“经文路段”以阅读已录入的相邻关系。':state.chapter==='haihuang'?'本篇按方位和叙事关系阅读，不绘制山经式路线。':!data.textRoutes.some(r=>r.seriesId===state.series)?'本山系的经文路段尚未录入，可点选地点阅读原文。':!routes.length?'当前筛选没有可连通的经文路段，清除筛选可阅读已录片段。':state.series==='west-third'?'本系展示两个独立片段，中间未录入的山不作跨越连线。':'本系展示招摇至杻阳片段；辅助节点不计入异兽数量。';
    if(!routes.some(r=>r.id===state.passage))state.passage='';for(const r of routes){const button=el('button','text-route-card');button.type='button';button.dataset.passage=r.id;button.setAttribute('aria-pressed',String(r.id===state.passage));button.append(el('strong','',displayPlace(r.from).name+' → '+displayPlace(r.to).name),el('span','',r.direction),el('small','','查看经文 ↗'));button.addEventListener('click',()=>chooseRoute(r.id));host.append(button);}
    const chosen=routes.find(r=>r.id===state.passage),detail=$('#passage-detail');detail.hidden=!chosen;if(chosen){const source=el('a','passage-source',chosen.sourceLabel+' ↗');source.href=chosen.url;source.target='_blank';source.rel='noopener noreferrer';detail.replaceChildren(el('p','eyebrow','经文路段 · '+chosen.direction),el('blockquote','',chosen.excerpt),source,el('p','passage-source',chosen.locator),el('p','passage-caveat','相邻关系据经文整理，图上线长不代表里程。'));}
  }
  function selectContext(id){if(!visiblePlaces.some(p=>p.id===id&&p.kind==='context'))return;state.node=id;const place=displayPlace(id);focusPlace(place);renderJournal();renderEnvironment();updateCatalog();motion?.select(id,place.name);schedule();hideTooltip();$('#map-status').textContent='已选择经文辅助节点'+H.contextById.get(id).name;commit(true);}
  function renderJournal(){
    const context=H.contextById.get(state.node);if(context){$('#journal-body').hidden=false;$('#journal-art-host').hidden=true;$('#journal-empty').hidden=true;$('#focus-point').disabled=false;$('#journal-place').textContent='山川经文节点';$('#journal-name').textContent=context.name;$('#journal-chapter').textContent=H.seriesById.get(context.seriesId).label+' · 经文辅助节点';$('#journal-summary').textContent=context.summary;$('#journal-members').replaceChildren();$('#journal-environment').replaceChildren(el('p','context-explanation','此节点用于阅读山川次序，未新增异兽记录。'));$('#journal-reading-label').textContent='经文摘录';$('#journal-excerpt').hidden=false;$('#journal-excerpt').textContent=context.excerpt;$('#journal-sources').replaceChildren(H.sourceBlock(context));$('#journal-versions').replaceChildren();$('#journal-tags').replaceChildren();$('#region-link').hidden=true;$('#beast-link').hidden=true;return;}
    const b=beastById.get(state.point),empty=!b||!results.some(r=>r.id===b.id);
    $('#journal-body').hidden=empty;$('#journal-art-host').hidden=empty;$('#journal-empty').hidden=!empty;$('#focus-point').disabled=empty;if(empty)return;
    const p=placeById.get(b.placeId);$('#journal-place').textContent=p.name;$('#journal-name').textContent=b.name;$('#journal-chapter').textContent=p.chapterLabel===p.seriesLabel?p.chapterLabel:p.chapterLabel+' · '+p.seriesLabel;$('#journal-summary').textContent=b.summary;$('#region-link').hidden=false;
    $('#journal-environment').replaceChildren(H.environmentBlock(p,b));$('#journal-versions').replaceChildren(H.versionBlock(b));
    $('#journal-art-host').replaceChildren(H.illustration(b,'journal-art'));
    const previousMember=document.activeElement?.dataset.member;const members=$('#journal-members');members.replaceChildren();const related=results.filter(r=>r.placeId===p.id);if(related.length>1)for(const item of related){const button=el('button','',item.name);button.type='button';button.dataset.member=item.id;button.setAttribute('aria-pressed',String(item.id===b.id));button.addEventListener('click',()=>select(item.id,false));members.append(button);}if(previousMember)members.querySelector(`[data-member="${previousMember}"]`)?.focus({preventScroll:true});
    $('#journal-reading-label').textContent=b.contentKind==='classical-excerpt'?'原典摘录与出处':'资料说明';$('#journal-excerpt').textContent=b.excerpt;$('#journal-excerpt').hidden=!b.excerpt;$('#journal-sources').replaceChildren(H.sourceBlock(b));
    $('#journal-tags').replaceChildren(...b.tags.slice(0,5).map(t=>el('span','',t)));
    const link=$('#beast-link');link.hidden=!(b.detailHref||b.catalogHref);if(!link.hidden){link.href=b.detailHref||b.catalogHref;link.textContent=b.detailHref?'翻阅神兽详情 ↗':'前往神兽图鉴 ↗';}syncLinks();
  }
  function select(id,focus){if(!results.some(b=>b.id===id))return;state.point=id;state.node='';const place=displayPlace(currentPlace());if(focus)focusPlace(place);renderJournal();renderRoutes();renderEnvironment();updateCatalog();motion?.select(place.id,place.name);schedule();hideTooltip();$('#map-status').textContent='已选择'+place.name+' · '+beastById.get(id).name;commit(true);}
  function makeCatalog(){const container=$('#habitat-catalog');for(const b of data.beasts){const p=placeById.get(b.placeId),button=el('button','catalog-record');button.type='button';button.dataset.record=b.id;button.setAttribute('aria-label','定位'+p.name+' · '+b.name);if(b.image){const img=el('img');img.src=b.image;img.alt='';img.width=62;img.height=72;img.loading='lazy';img.addEventListener('error',()=>{const fallback=el('span','record-placeholder','山');img.replaceWith(fallback);},{once:true});button.append(img);}else button.append(el('span','record-placeholder','山'));const pending=(b.evidence||[]).filter(e=>e.status==='pending').map(e=>e.label+'待辨').join('、'),copy=el('span');copy.append(el('strong','',b.name),el('small','',p.name),el('small','',p.seriesLabel+(pending?' · '+pending:'')));const arrow=el('span','record-arrow','↗');arrow.setAttribute('aria-hidden','true');button.append(copy,arrow);button.addEventListener('click',()=>{select(b.id,true);$('#field-journal').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});});container.append(button);catalogButtons.set(b.id,button);}const empty=el('p','catalog-empty','没有找到匹配记录。请调整关键词或清除筛选。');empty.id='catalog-empty';empty.hidden=true;container.append(empty);}
  function updateCatalog(){const ids=new Set(results.map(b=>b.id));for(const [id,button]of catalogButtons){button.hidden=!ids.has(id);button.setAttribute('aria-pressed',String(!state.node&&id===state.point));}$('#catalog-empty').hidden=!!results.length;}
  function render({fitView=false,announce=true,push=true}={}){
    results=matchedRecords();const visible=new Set(results.map(b=>b.placeId));if(!results.some(b=>b.id===state.point))state.point=results[0]?.id||'';
    localPositions=state.view==='region'?H.positionsFor(state.series):new Map();const key=state.view==='region'?state.series:'world';if(key!==terrainKey){world=H.mountWorld(svg,'atlas',key==='world'?null:key,localPositions);terrainKey=key;}
    visiblePlaces=data.places.filter(p=>visible.has(p.id)).map(p=>displayPlace(p.id));
    const context=state.view==='region'&&state.text&&results.length&&state.category==='all'&&state.review==='all'&&!state.q?data.contextNodes.filter(n=>n.seriesId===state.series).map(n=>displayPlace(n.id)):[];visiblePlaces.push(...context);if(state.node&&!context.some(n=>n.id===state.node))state.node='';
    $('#result-count').textContent=visible.size+' 处地点 · '+results.length+' 条记录'+(context.length?' · '+context.length+' 经文节点':'');$('#map-layer-name').textContent=state.series==='all'?H.chapters[state.chapter]:H.chapters[state.chapter]+' / '+H.seriesById.get(state.series).label;
    document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chapter===state.chapter)));
    $('#chapter-select').value=state.chapter;$('#category-select').value=state.category;$('#review-select').value=state.review;$('#show-labels').checked=state.labels;$('#show-route').checked=state.route;$('#show-text-routes').checked=state.text;$('#show-environment').checked=state.environment;$('#map-search').value=state.q;
    const seriesSelect=$('#series-select');seriesSelect.replaceChildren(new Option(state.chapter==='haihuang'?'全部篇章':'全部山系','all'),...data.series.filter(s=>state.chapter==='all'||s.chapterKey===state.chapter).map(s=>new Option(s.label,s.id)));seriesSelect.value=state.series;
    $('#series-label').textContent=state.chapter==='haihuang'?'细读篇章':'循山系';$('#series-hint').textContent=state.chapter==='haihuang'?'按篇章读方位与叙事关系':'选择山系，展开山川与经文路段';
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));$('#map-viewport').classList.toggle('is-region',state.view==='region');$('#reset-view').textContent=state.view==='region'?'览局部':'览全图';
    $('#cluster-picker').hidden=true;hideTooltip();renderPassages();renderRoutes();renderEnvironment();updateCatalog();renderJournal();if(fitView)fit(visiblePlaces);schedule();commit(push);if(announce)$('#map-status').textContent=visible.size+'处地点，'+results.length+'条异兽记录'+(state.point?'；所选'+beastById.get(state.point).name:'；未找到匹配内容');
  }
  makeCatalog();
  function changeChapter(chapter){Object.assign(state,{chapter,series:'all',view:'world',node:'',passage:''});render({fitView:chapter!=='all'});if(chapter==='all'){setCamera(1,500,500);commit();}}
  document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>changeChapter(button.dataset.chapter)));
  $('#chapter-select').addEventListener('change',e=>changeChapter(e.target.value));
  $('#series-select').addEventListener('change',e=>{state.series=e.target.value;if(state.series!=='all')state.chapter=H.seriesById.get(state.series).chapterKey;Object.assign(state,{view:state.series==='all'?'world':'region',node:'',passage:'',z:1,cx:500,cy:500});render();});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.view===state.view)return;state.view=button.dataset.view;if(state.view==='region'&&state.series==='all'){state.series=placeById.get(beastById.get(state.point)?.placeId)?.seriesId||data.series.find(s=>state.chapter==='all'||s.chapterKey===state.chapter).id;state.chapter=H.seriesById.get(state.series).chapterKey;}Object.assign(state,{node:'',passage:'',z:1,cx:500,cy:500});render();}));
  for(const [id,key]of [['category-select','category'],['review-select','review']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;render();});
  for(const [id,key]of [['show-labels','labels'],['show-route','route'],['show-text-routes','text'],['show-environment','environment']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.checked;render();});
  $('#map-search').addEventListener('input',e=>{clearTimeout(searchTimer);state.q=e.target.value.trim();searchTimer=setTimeout(()=>render(),150);});
  $('#clear-search').addEventListener('click',()=>{clearTimeout(searchTimer);state.q='';render();$('#map-search').focus();});
  document.querySelectorAll('[data-clear-filters]').forEach(button=>button.addEventListener('click',()=>{clearTimeout(searchTimer);Object.assign(state,{chapter:'all',series:'all',view:'world',node:'',passage:'',category:'all',review:'all',q:'',labels:true,route:false,text:true,environment:true,point:'qingqiu-jiuweihu',z:1,cx:500,cy:500});render();if(button.closest('#journal-empty'))$('#map-search').focus();}));
  $('#zoom-in').addEventListener('click',()=>zoomCenter(state.z+.25));$('#zoom-out').addEventListener('click',()=>zoomCenter(state.z-.25));
  $('#reset-view').addEventListener('click',()=>{setCamera(1,500,500);commit();});$('#focus-point').addEventListener('click',()=>{const p=displayPlace(currentPlace());if(p){focusPlace(p);commit();}});
  viewport.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();hideTooltip();zoomAt(state.z*(event.deltaY<0?1.12:1/1.12),event.clientX,event.clientY);clearTimeout(saveTimer);saveTimer=setTimeout(commit,180);},{passive:false});

  function resetGesture(){gesture=null;pointers.clear();viewport.classList.remove('is-dragging');}
  function baseGesture(){const points=[...pointers.values()];if(!points.length){gesture=null;return;}const mid=points.length>1?{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}:points[0];gesture={x:mid.x,y:mid.y,z:state.z,cx:state.cx,cy:state.cy,anchor:worldPoint(mid.x,mid.y),distance:points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0,moved:points.length>1};}
  viewport.addEventListener('pointerdown',event=>{if(event.button!==0||event.pointerType==='touch'&&!operating)return;hideTooltip();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});baseGesture();if(!event.target.closest('button,[data-route-edge]'))viewport.setPointerCapture(event.pointerId);});
  viewport.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId)||!gesture)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.values()];
    if(points.length>1){const mid={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),z=clamp(gesture.z*distance/Math.max(gesture.distance,1),1,3),local=svgPoint(mid.x,mid.y);setCamera(z,gesture.anchor.x-(local.x-500)/z,gesture.anchor.y-(local.y-500)/z);gesture.moved=true;}
    else{const distance=Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y);if(distance<6&&!gesture.moved)return;gesture.moved=true;const now=svgPoint(event.clientX,event.clientY),start=svgPoint(gesture.x,gesture.y);setCamera(gesture.z,gesture.cx-(now.x-start.x)/gesture.z,gesture.cy-(now.y-start.y)/gesture.z);}
    if(gesture.moved){viewport.classList.add('is-dragging');suppressClickUntil=performance.now()+400;viewport.setPointerCapture(event.pointerId);}
  });
  function finishPointer(event){
    // A touch may transfer implicit capture from a hotspot to the viewport.
    // Its bubbling child loss does not mean the viewport lost this pointer.
    if(event.type==='lostpointercapture'&&event.target!==viewport)return;
    if(!pointers.has(event.pointerId))return;const moved=gesture?.moved;if(moved)suppressClickUntil=performance.now()+350;pointers.delete(event.pointerId);if(pointers.size)baseGesture();else{gesture=null;viewport.classList.remove('is-dragging');commit();}}
  viewport.addEventListener('pointerup',finishPointer);viewport.addEventListener('pointercancel',finishPointer);viewport.addEventListener('lostpointercapture',finishPointer);window.addEventListener('blur',()=>{resetGesture();commit();});
  const touchButton=$('#touch-mode');function syncTouch(){if(!coarse.matches&&!small.matches){operating=false;resetGesture();}viewport.classList.toggle('is-operating',operating);touchButton.setAttribute('aria-pressed',String(operating));touchButton.textContent=operating?'完成操作':'操作地图';$('#map-instructions').textContent=operating?'单指拖动，双指缩放；完成后恢复页面滑动。':coarse.matches||small.matches?'点选朱砂；开启操作地图后可拖动、双指缩放。':'滚轮缩放，拖动探索；名录亦可定位。';}
  touchButton.addEventListener('click',()=>{operating=!operating;resetGesture();syncTouch();});coarse.addEventListener('change',syncTouch);small.addEventListener('change',syncTouch);syncTouch();
  const reading=$('#journal-reading');reading.open=!small.matches;small.addEventListener('change',()=>{reading.open=!small.matches;});
  new ResizeObserver(schedule).observe(viewport);
  window.addEventListener('popstate',()=>{resetGesture();motion?.clear();clearTimeout(searchTimer);Object.assign(state,H.readState());render({push:false});});
  render({announce:false,push:false});
  if(initialParams.has('point')&&!initialParams.has('z')&&state.view==='world'){const p=displayPlace(currentPlace());if(p)focusPlace(p);commit();}
  drawCamera();
})();
