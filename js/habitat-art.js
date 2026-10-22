/* Original SVG landscape. Named features are sourced in habitats.js; contours are artistic. */
(() => {
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const land='M197 255C240 189 353 177 409 162C449 151 477 167 518 151C564 132 580 175 624 176C705 182 763 221 797 257C843 304 829 369 846 414C859 450 893 443 900 485C919 532 885 579 864 562C836 550 838 576 830 604C817 655 785 690 779 734C775 781 764 816 727 835C701 848 672 837 662 865C618 889 564 856 521 868C464 885 412 860 364 859C314 864 268 826 249 788C220 755 225 695 192 665C157 655 134 670 123 629C104 595 113 558 142 551C173 555 172 523 179 481C182 437 167 402 184 358C197 328 176 300 197 255Z M260 304C283 274 325 291 369 266C408 247 448 255 488 244C545 226 563 258 605 254C672 252 692 288 731 295C768 311 751 345 772 381C794 415 778 465 789 496C810 540 785 574 765 604C735 642 743 686 710 727C685 764 640 762 601 781C565 800 521 772 478 790C429 805 402 781 360 786C310 785 277 762 275 726C270 678 242 666 247 622C253 570 226 549 241 502C254 456 231 426 248 388C265 351 238 333 260 304Z';
  const center='M387 360C423 334 468 361 499 349C544 328 562 360 598 365C639 365 672 382 683 417C696 453 661 455 664 493C653 514 626 509 629 485C633 461 652 445 641 441C622 440 617 462 614 484C612 515 635 537 609 554C590 570 562 545 547 565C531 586 557 611 586 610C609 609 625 635 606 655C588 674 563 651 544 666C521 692 553 706 538 727C517 739 494 709 467 712C437 713 417 736 392 751C361 766 347 734 360 711C384 671 397 637 400 604C397 576 411 553 405 529C397 511 394 548 380 563C355 594 370 627 352 640C332 655 325 610 333 581C347 550 328 518 340 482C355 447 343 394 369 381Z';
  function defs(p){return `<defs>
    <radialGradient id="${p}-sea"><stop stop-color="#61847b"/><stop offset=".75" stop-color="#3c6058"/><stop offset="1" stop-color="#29463f"/></radialGradient>
    <linearGradient id="${p}-paper" x2=".6" y2="1"><stop stop-color="#f2e7c9"/><stop offset=".65" stop-color="#dfcca5"/><stop offset="1" stop-color="#bfa67c"/></linearGradient>
    <linearGradient id="${p}-jade" x2=".3" y2="1"><stop stop-color="#78907b"/><stop offset=".4" stop-color="#476a57"/><stop offset="1" stop-color="#345447"/></linearGradient>
    <pattern id="${p}-wave" width="126" height="76" patternUnits="userSpaceOnUse"><path class="atlas-waterlines" d="M-126 20q31.5-16 63 0t63 0t63 0t63 0t63 0t63 0M-126 55q31.5-11 63 0t63 0t63 0t63 0t63 0t63 0" fill="none" stroke="#ded7ae" stroke-width="1" opacity=".24"/></pattern>
    <pattern id="${p}-lake-wave" width="36" height="18" patternUnits="userSpaceOnUse"><path class="atlas-lake-waterlines" d="M-36 9q9-4 18 0t18 0t18 0t18 0t18 0t18 0" fill="none" stroke="#d6d6b4" stroke-width=".8" opacity=".65"/></pattern>
    <clipPath id="${p}-disc"><circle cx="500" cy="500" r="454"/></clipPath>
    <g id="${p}-ridge"><path d="M-87 24Q-67 12-59-6L-48-3Q-38-34-24-37L-14-12Q-2-19 9-67Q17-76 26-44L38-30 49-35Q58-10 78 4L91 24Z" fill="url(#${p}-jade)" stroke="#38513f" stroke-width="1.4"/><path d="M-74 21-49 1-37-23-23-31-16-5M-16 18Q-4-4 9-59L15-43 11-16 23-24 42 16M37-24 53-12 65 8" fill="none" stroke="#b5b88d" stroke-width="1.2"/><path d="M-48 16-37-5m4 24 8-13m26 13 10-21m9 18 9-9m17 18 11-6" fill="none" stroke="#293f34" stroke-width=".9" opacity=".7"/></g>
    <g id="${p}-peak"><path d="M-47 26Q-28 3-17-24L-7-19 3-68Q8-81 16-52L27-21Q32 9 53 26Z" fill="url(#${p}-jade)" stroke="#3c5543" stroke-width="1.4"/><path d="M-29 20-12-15-4-7 6-62 10-38 7-11 18 4 24 22M15-46 19-24 34 16" fill="none" stroke="#bfc099" stroke-width="1.2"/></g>
    <g id="${p}-rock"><path d="M-61 23-43-6-21-12-4-46 11-39 19-15 44-4 64 23Z" fill="#9a9478" stroke="#625f49" stroke-width="1.4"/><path d="M-48 17-24-7-7-35 0-11 12-4 20 19M10-32 15-13 35 0 45 15M-28 8-17 17" fill="none" stroke="#e3d4ae" stroke-width="1.6"/></g>
    <g id="${p}-pine"><path d="M0 20 1-32M0-1-15-10M1-13 17-23" stroke="#62563f" stroke-width="2.5" fill="none"/><path d="m-24-7 10-9-3-5 16 3 9-9 18 5-9 7-14 3 1 6-17 3Zm7-22 15-13 7 2 4-7 17 9-3 7-19 3Z" fill="#44644c" stroke="#364f3e" stroke-width="1"/></g>
    <g id="${p}-lake"><path d="M-67 8q22-30 54-19t58-4q36 15 5 36t-54 5q-42 11-63-18Z" fill="#6c9384" stroke="#507b6b" stroke-width="1.5"/><path d="M-41 5q20-8 39 0t40 0M-25 17q16-6 33 0t28 0" fill="none" stroke="#d6d6b4" stroke-width="1"/></g>
  </defs>`;}
  function frame(p,local=false){return `${defs(p)}<circle cx="500" cy="500" r="482" fill="#23352e" stroke="#a68d59" stroke-width="1.2"/><circle cx="500" cy="500" r="469" fill="none" stroke="#b6a36e" stroke-width=".6"/><circle class="atlas-compass-glint" cx="500" cy="500" r="469" fill="none" stroke="#ffe5a3" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="70 2876.814" pointer-events="none"/><circle cx="500" cy="500" r="456" fill="${local?`url(#${p}-paper)`:`url(#${p}-sea)`}" stroke="#d2b57b" stroke-width="2"/>`;}
  function use(p,id,x,y,s=1){return `<use href="#${p}-${id}" transform="translate(${x} ${y}) scale(${s})"/>`;}
  function world(p){const d=window.ShanhaiHabitatData;
    const peaks=d.places.filter(n=>n.id!=='dahuang'&&n.id!=='gonggong').map((n,i)=>n.id==='leize'?'':use(p,n.environment.terrain==='bare'?'rock':i%3===0?'peak':'ridge',n.position.x+5,n.position.y+30,.48+(i%3)*.12)).join('');
    // Fill and waterlines share each outline, so the water cannot drift outside it.
    const lakes=['M635 146q32-9 23 32-31 21-23-32Z','M844 670q47 30 10 83-40 3-10-83Z'].map(shape=>`<g class="world-lake"><path class="world-lake-fill" d="${shape}" fill="#6c9384" stroke="#507b6b" stroke-width="1.5"/><path class="world-lake-waves" d="${shape}" fill="url(#${p}-lake-wave)"/></g>`).join('');
    return `${frame(p)}<g clip-path="url(#${p}-disc)"><circle cx="500" cy="500" r="454" fill="url(#${p}-wave)"/><g fill="url(#${p}-paper)" stroke="#9a956e" stroke-width="1.8"><path fill-rule="evenodd" d="${land}"/><path d="${center}"/></g>${lakes}<g opacity=".22" stroke="#d8d7b6" fill="none"><path d="M166 401q30 9 34 48t-20 85M703 307q66 23 81 87M307 793q45 10 72 33M666 759q50-21 64-55"/></g>${peaks}${use(p,'pine',407,790,.48)}${use(p,'pine',615,465,.6)}${use(p,'pine',478,376,.5)}<g fill="#dacb9d" font-family="KaiTi,serif" font-size="18" letter-spacing="8" opacity=".76"><text x="468" y="120">海 外</text><text x="115" y="462" transform="rotate(-83 115 462)">山 海 之 间</text><text x="856" y="458" transform="rotate(78 856 458)">海 域</text></g></g><text x="500" y="941" text-anchor="middle" fill="#d7c695" font-family="KaiTi,serif" font-size="15" letter-spacing="5">山川名物 · 相对示意</text>`;
  }
  function local(p,seriesId,positions){
    const d=window.ShanhaiHabitatData,s=d.series.find(s=>s.id===seriesId),nodes=[...d.places,...d.contextNodes].filter(n=>n.seriesId===seriesId);
    const scenery=nodes.map((n,i)=>{
      const q=positions.get(n.id),bare=n.environment?.terrain==='bare';
      if(n.id==='leize')return use(p,'lake',q.x,q.y+20,1.2);
      const distant=`<g transform="translate(${q.x} ${q.y})" opacity=".17"><path d="M-110 36Q-90 23-65-14L-49 0-28-38-10-20 8-50 36-10 57-20Q80 12 112 36Z" fill="${bare?'#9b8b69':'#809678'}"/><path d="M-135 48q75-13 135 0t135 0M-101 56q60-9 101 0t101 0" stroke="#8d9d82" fill="none" stroke-width="1.2"/></g>`;
      return distant+use(p,bare?'rock':i%2?'peak':'ridge',q.x,q.y+20,.75)+(n.environment?.terrain==='forest'?use(p,'pine',q.x-53,q.y+25,.65):'');
    }).join('');
    return `${frame(p,true)}<g clip-path="url(#${p}-disc)"><path d="M130 342q100-70 230-36t230-5 260 28M132 570q90-55 197-28t218 7 310-10M270 810q170-40 380-8" fill="none" stroke="#9b9f7c" stroke-width="1" opacity=".22"/>${scenery}<g fill="#6c694e" font-family="KaiTi,serif" text-anchor="middle"><text x="500" y="164" font-size="38" letter-spacing="6">${escape(s?.label||'山系手札')}</text><text x="500" y="198" font-size="13" letter-spacing="3">循山 · 读水 · 识异兽</text></g><g stroke="#988661" fill="none" stroke-width="1"><path d="M860 230v-70m-8 12 8-12 8 12"/></g><text x="860" y="144" text-anchor="middle" font-size="13" fill="#756544">北</text></g><text x="500" y="906" text-anchor="middle" font-size="13" fill="#756447" letter-spacing="2">经文关系示意 · 线长不代表里程</text>`;
  }
  function environment(p,place,position){if(!place?.environment)return '';const env=place.environment,{x,y}=position;let markup='';
    if(env.water){
      if(place.id==='leize')markup+=use(p,'lake',x,y+16,1.2);
      else if(place.id==='liubo')markup+=`<path d="M${x-70} ${y+42}q22-10 44 0t44 0t44 0M${x-45} ${y+52}q20-8 40 0t40 0" fill="none" stroke="#557e76" stroke-width="2"/><text x="${x+70}" y="${y+50}" fill="#365f58" font-size="14">东海</text>`;
      else{
        const vectors={qingqiu:[0,100],danxue:[0,100],niuyang:[105,0],yinshan:[0,100],guishan:[0,100],'luwu-water':[0,100],zhaoyao:[-105,0],huaijiang:[0,-100],daishan:[-100,0],beiyue:[-100,0],dushan:[80,-70],qingyao:[0,-100],xianshan:[0,-100]};
        const rivers=place.id==='kunlun'?[[0,110,'河水'],[90,75,'赤水'],[-90,75,'洋水'],[-110,0,'黑水']]:place.id==='yiwang'?[[110,0,'湍水'],[75,85,'贶水']]:[[...(vectors[place.id]||[0,95]),env.water.split(' → ')[0]]];
        for(const [dx,dy,name]of rivers){const sx=x-8,sy=y+18;markup+=`<path d="M${sx} ${sy}C${sx+dx*.3-12} ${sy+dy*.4+12} ${sx+dx*.7+12} ${sy+dy*.7-12} ${sx+dx} ${sy+dy}" fill="none" stroke="#557e76" stroke-width="2.8" opacity=".8"/><text x="${x+dx*.72+12}" y="${y+dy*.72+14}" fill="#365f58" font-size="13" font-family="KaiTi,serif">${escape(name)}</text>`;}
      }
    }
    markup+=`<text x="${x}" y="${y+65}" text-anchor="middle" fill="#756447" font-size="12" font-family="KaiTi,serif">${escape(env.terrain==='bare'?'无草木 · 岩山':env.relation)}</text>`;return markup;
  }
  window.ShanhaiHabitatArt={world,local,environment};
})();
