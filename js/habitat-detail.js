(() => {
  'use strict';
  const H=window.ShanhaiHabitats,{$,el,data,placeById,beastById}=H;
  if(!$('#region-valid'))return;
  const params=new URLSearchParams(location.search),id=params.has('place')?params.get('place'):'qingqiu',place=placeById.get(id);
  if(!place){$('#region-valid').hidden=true;$('#region-invalid').hidden=false;$('#region-crumb').textContent='未收录地点';document.title='地点未收录 — 山海异兽录';return;}
  const members=data.beasts.filter(b=>b.placeId===place.id),chosen=members.find(b=>b.id===params.get('point'))||members[0],state=H.readState(params);
  state.point=chosen.id;
  if(!params.has('z')){state.z=1.7;state.cx=place.position.x;state.cy=place.position.y;const half=500/state.z;state.cx=H.clamp(state.cx,half,1000-half);state.cy=H.clamp(state.cy,half,1000-half);}
  const normalized=H.paramsFor(state);normalized.set('place',place.id);try{history.replaceState(null,'','habitat-detail.html?'+normalized);}catch{/* File protocol fallback keeps the validated links usable. */}
  $('#region-crumb').textContent=place.name;$('#region-title').textContent=place.name;$('#region-chapter').textContent=(place.chapterLabel===place.seriesLabel?place.chapterLabel:place.chapterLabel+' · '+place.seriesLabel)+' · 地域手札';document.title=place.name+' · 地域手札 — 山海异兽录';
  $('#region-intro').textContent=members.map(b=>b.name).join('、')+'的山海线索，从这一处文字中的地点展开。';
  const names=members.map(b=>b.name).join('、'),pending=members.some(b=>b.reviewStatus==='pending');
  $('#region-overview').textContent=`此页整理${place.name}与${names}的文本关系。${place.locationNote}${pending?'名字形或住所关系仍有待辨，见下方分项说明。':'经篇、形态和地点关系见下方原文与出处。'}命名山水据所列文字整理，山水轮廓属于画面创作。`;
  $('#region-environment').replaceChildren(H.environmentBlock(place));
  $('#back-to-map').href='map.html?'+H.paramsFor(state);
  const records=$('#region-records');records.replaceChildren(...[chosen,...members.filter(b=>b.id!==chosen.id)].map(H.recordArticle));
  const nav=$('#region-navigation');for(const [key,label]of Object.entries(H.chapters)){if(key==='all')continue;const group=el('details');group.open=key===place.chapterKey;group.append(el('summary','',label));for(const p of data.places.filter(p=>p.chapterKey===key)){const b=beastById.get(p.beastIds[0]),a=el('a','',p.name+' · '+p.seriesLabel);a.href=H.detailHref(p.id,b.id,{...state,point:b.id,chapter:p.chapterKey,series:p.seriesId,node:'',passage:'',view:'region',z:1,cx:500,cy:500});if(p.id===place.id)a.setAttribute('aria-current','page');group.append(a);}nav.append(group);}
  const svg=$('#region-map'),positions=H.positionsFor(place.seriesId),world=H.mountWorld(svg,'region',place.seriesId,positions);svg.removeAttribute('hidden');$('.map-fallback',svg.parentElement).hidden=true;
  const pos=positions.get(place.id);$('.named-environment',world).innerHTML=window.ShanhaiHabitatArt.environment('region',place,pos);
  const marker=document.createElementNS('http://www.w3.org/2000/svg','g');const {x,y}=pos;marker.innerHTML=`<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#b48b48" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="#a82320" stroke="#f3deb2" stroke-width="1.5"/>`;world.append(marker);
})();
