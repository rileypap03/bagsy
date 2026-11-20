/* ---------- location scenes ---------- */
const SC = {sky:'#22408C',far:'#3456A8',far2:'#2C4C9E',mid:'#1F3578',near:'#16214A',cream:'#F4EAD3',shade:'#E0CFAD',brass:'#D9A441',yellow:'#FFC53D',terra:'#C8603F',peach:'#F2B48A',blue:'#A9BDEB',rose:'#E58F7B',green:'#2E6A58',green2:'#245446',glow:'#FFD27A',water:'#2A4A9C'};
const PLACE_KIND = {lisbon:'lisbon',lisboa:'lisbon',barcelona:'barcelona',copenhagen:'copenhagen','københavn':'copenhagen',rome:'rome',roma:'rome',paris:'city',london:'city','new york':'city',tokyo:'city',berlin:'city',amsterdam:'copenhagen',bruges:'copenhagen',porto:'lisbon',madrid:'city',milan:'city',florence:'rome',athens:'coast',nice:'coast',santorini:'coast',ibiza:'tropical',mallorca:'coast',bali:'tropical',cancun:'tropical',maldives:'tropical',dubai:'desert',marrakech:'desert',cairo:'desert',zermatt:'mountains',chamonix:'mountains',innsbruck:'mountains',reykjavik:'mountains',cotswolds:'countryside',tuscany:'countryside',provence:'countryside'};
const SCENE_KINDS = ['coast','city','mountains','countryside','tropical','desert'];
function sceneKind(t){ return t.kind || PLACE_KIND[(t.place||'').trim().toLowerCase()] || 'coast'; }
function scSun(x,y){ return `<circle cx="${x}" cy="${y}" r="40" fill="${SC.glow}" opacity=".10"/><circle cx="${x}" cy="${y}" r="27" fill="${SC.glow}" opacity=".16"/><circle cx="${x}" cy="${y}" r="16" fill="#FFE3A0"/>`; }
function scHouse(x,base,w,h,wall,roof='gable',roofCol=SC.terra,lit=true){
  const y=base-h; let r='';
  if(roof==='gable') r=`<polygon points="${x-2},${y} ${x+w/2},${y-w*0.42} ${x+w+2},${y}" fill="${roofCol}"/>`;
  if(roof==='hip') r=`<polygon points="${x-2},${y} ${x+5},${y-8} ${x+w-5},${y-8} ${x+w+2},${y}" fill="${roofCol}"/>`;
  if(roof==='step'){ const s=w/5; r=`<path d="M${x} ${y} V${y-s} H${x+s} V${y-2*s} H${x+2*s} V${y-3*s} H${x+3*s} V${y-2*s} H${x+4*s} V${y-s} H${x+w} V${y} Z" fill="${wall}"/>`; }
  let win=''; const cols=Math.max(1,Math.floor((w-6)/10)), rows=Math.max(1,Math.floor((h-8)/13));
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){ const wx=x+5+i*((w-10)/cols)+((w-10)/cols-5)/2, wy=y+6+j*13; win+=`<rect x="${wx.toFixed(1)}" y="${wy}" width="5" height="7" rx="1.2" fill="${lit&&(i+j*3+Math.round(x))%3===0?SC.yellow:'rgba(22,33,74,.55)'}"/>`; }
  return `${r}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>${win}`;
}
function scWater(y,col=SC.water){ let l=''; for(let i=0;i<9;i++){ const x=(i*47+13)%370, yy=y+6+(i%3)*7; l+=`<path d="M${x} ${yy} h${14+(i%4)*5}" stroke="${SC.cream}" stroke-width="1.3" stroke-linecap="round" opacity=".35"/>`; } return `<rect x="0" y="${y}" width="390" height="${160-y}" fill="${col}"/>${l}`; }
function scPalm(x,base,h,flip=1){ const tx=x+flip*10, ty=base-h; const fr=[[-26,4],[-20,-10],[-6,-16],[12,-14],[24,0],[18,10]].map(([dx,dy])=>`<path d="M${tx} ${ty} Q${tx+dx*0.5} ${ty+dy-8} ${tx+dx} ${ty+dy}" stroke="${SC.green}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join(''); return `<path d="M${x} ${base} Q${x+flip*2} ${base-h*0.6} ${tx} ${ty}" stroke="#8A5A2E" stroke-width="4" fill="none" stroke-linecap="round"/>${fr}<circle cx="${tx}" cy="${ty+2}" r="3" fill="#8A5A2E"/>`; }
function scCypress(x,base,h){ return `<ellipse cx="${x}" cy="${base-h/2}" rx="${h*0.16}" ry="${h/2}" fill="${SC.green2}"/><path d="M${x} ${base-h+4} V${base}" stroke="${SC.green}" stroke-width="1.5" opacity=".6"/>`; }
function scPine(x,base,h,snow){ return `<polygon points="${x},${base-h} ${x-h*0.32},${base} ${x+h*0.32},${base}" fill="${SC.green2}"/>${snow?`<polygon points="${x},${base-h} ${x-h*0.1},${base-h*0.7} ${x+h*0.1},${base-h*0.7}" fill="${SC.cream}"/>`:''}`; }
const SCENES = {
  lisbon(){ return scSun(92,86)+
    `<path d="M150 112 C190 70 230 58 270 62 C320 66 350 72 390 80 V160 H150 Z" fill="${SC.far}"/>`+
    `<path d="M246 64 v-14 h7 v5 h6 v-5 h7 v5 h6 v-5 h7 v5 h6 v-5 h7 v14 z" fill="${SC.far}"/><path d="M268 50 v-12 l10 4 -10 4" stroke="${SC.cream}" stroke-width="1.4" fill="${SC.terra}"/>`+
    `<path d="M0 104 C60 92 120 96 170 108 L170 160 H0 Z" fill="${SC.far2}"/>`+
    [[6,40,'#F2B48A'],[50,34,SC.cream],[88,44,SC.blue],[136,36,SC.yellow],[176,46,SC.cream],[226,38,SC.rose],[268,42,SC.blue],[314,36,SC.peach],[354,44,SC.cream]].map(([x,w,c],i)=>scHouse(x,138,w-2,28+(i*7)%18,c,'hip')).join('')+
    `<rect x="0" y="138" width="390" height="22" fill="${SC.near}"/><path d="M0 150 H390 M0 155 H390" stroke="${SC.far}" stroke-width="1.2" opacity=".7"/>`+
    `<path d="M0 101 C120 98 260 99 390 96" stroke="#0E1633" stroke-width="1" fill="none"/><path d="M232 118 L250 100" stroke="#0E1633" stroke-width="1.6"/>`+
    `<rect x="196" y="117" width="104" height="6" rx="3" fill="${SC.cream}"/><rect x="194" y="122" width="108" height="26" rx="5" fill="${SC.yellow}"/><rect x="194" y="140" width="108" height="5" fill="${SC.cream}"/>`+
    [0,1,2,3,4].map(i=>`<rect x="${201+i*19.5}" y="126" width="13" height="10" rx="2" fill="#22305E"/>`).join('')+`<circle cx="214" cy="150" r="4.5" fill="#0E1633"/><circle cx="282" cy="150" r="4.5" fill="#0E1633"/><text x="296" y="133" font-size="6" font-weight="700" fill="#22305E" text-anchor="end" font-family="Inter,sans-serif">28</text>`; },
  barcelona(){ const spire=(x,h,w)=>`<path d="M${x-w/2} 128 V${128-h+w} Q${x-w/2} ${128-h} ${x} ${128-h-6} Q${x+w/2} ${128-h} ${x+w/2} ${128-h+w} V128 Z" fill="${SC.cream}"/><path d="M${x} ${128-h-4} Q${x+w/2} ${128-h} ${x+w/2} ${128-h+w} V128 H${x} Z" fill="${SC.shade}"/>${[0.3,0.5,0.7].map(f=>`<rect x="${x-1.5}" y="${(128-h+h*f).toFixed(1)}" width="3" height="6" rx="1.5" fill="${SC.mid}" opacity=".5"/>`).join('')}<circle cx="${x}" cy="${128-h-9}" r="3.4" fill="${SC.brass}"/>`;
    return scSun(310,92)+`<path d="M0 96 C80 80 150 86 220 98 C280 106 340 96 390 100 V160 H0 Z" fill="${SC.far}"/>`+
    scWater(134)+`<path d="M150 128 H290 V136 H150 Z" fill="${SC.shade}"/>`+spire(176,62,14)+spire(198,84,16)+spire(222,90,16)+spire(246,70,15)+spire(266,52,13)+
    `<path d="M150 128 Q220 108 290 128" fill="${SC.cream}"/>`+
    scHouse(12,134,34,26,SC.peach,'flat')+scHouse(48,134,30,34,SC.cream,'flat')+scHouse(300,134,34,30,SC.cream,'flat')+scHouse(336,134,40,22,SC.peach,'flat')+
    `<rect x="0" y="134" width="390" height="3" fill="${SC.shade}"/>`+scPalm(96,150,52,1)+scPalm(122,152,40,-1)+scPalm(352,152,46,-1)+`<rect x="0" y="150" width="390" height="10" fill="#E9D6A8"/>`; },
  copenhagen(){ const cols=[SC.yellow,SC.terra,SC.blue,SC.cream,SC.rose,SC.peach,'#7FA8C9',SC.yellow,SC.cream,SC.terra,SC.blue];
    let x=0,h='',refl=''; cols.forEach((c,i)=>{ const w=32+(i*5)%10, ht=40+(i*11)%22, roof=i%3===0?'step':'gable'; h+=scHouse(x,128,w,ht,c,roof,i%3===0?c:SC.near); refl+=`<rect x="${x}" y="130" width="${w}" height="${(ht*0.5).toFixed(0)}" fill="${c}" opacity=".22"/>`; x+=w+1; });
    return scSun(70,70)+`<path d="M0 92 C100 84 260 86 390 90 V160 H0 Z" fill="${SC.far2}"/>`+h+`<rect x="0" y="128" width="390" height="4" fill="${SC.shade}"/>`+scWater(132)+refl+
    `<path d="M228 146 H300 L292 156 H236 Z" fill="${SC.cream}"/><path d="M262 146 V104" stroke="${SC.cream}" stroke-width="2"/><path d="M264 108 L288 142 H264 Z" fill="${SC.terra}"/><rect x="234" y="150" width="60" height="2" fill="${SC.terra}"/>`; },
  rome(){ const cx=225, arcs=(y,n,w,hh)=>{ let s=''; for(let i=0;i<n;i++){ const x=cx-95+5+i*(190/n); s+=`<path d="M${x.toFixed(1)} ${y+hh} V${y+hh/2} a${w/2} ${w/2} 0 0 1 ${w} 0 V${y+hh} Z" fill="${SC.mid}" opacity=".55"/>`; } return s; };
    return scSun(80,84)+`<path d="M0 104 C80 96 160 100 390 98 V160 H0 Z" fill="${SC.far2}"/>`+
    `<path d="M318 98 q0 -26 22 -30 q22 4 22 30 z" fill="${SC.far}"/><rect x="337" y="58" width="6" height="12" fill="${SC.far}"/><path d="M300 98 H380 V104 H300 Z" fill="${SC.far}"/>`+
    `<path d="M${cx-95} 140 V84 Q${cx-40} 74 ${cx+60} 70 L${cx+70} 66 L${cx+80} 72 L${cx+95} 70 V140 Z" fill="${SC.cream}"/><path d="M${cx+40} 140 V72 L${cx+60} 70 L${cx+70} 66 L${cx+80} 72 L${cx+95} 70 V140 Z" fill="${SC.shade}"/>`+
    `<path d="M${cx-95} 98 H${cx+95} M${cx-95} 116 H${cx+95}" stroke="${SC.shade}" stroke-width="2"/>`+arcs(84,12,8,12)+arcs(100,12,9,14)+arcs(118,12,10,18)+
    scCypress(40,142,58)+scCypress(58,142,44)+scCypress(346,142,50)+
    `<path d="M92 142 V112" stroke="#6B4A2E" stroke-width="3"/><ellipse cx="92" cy="108" rx="24" ry="8" fill="${SC.green}"/>`+
    `<rect x="0" y="140" width="390" height="20" fill="${SC.near}"/>`; },
  coast(){ return scSun(270,96)+`<path d="M0 88 C60 72 130 78 190 96 C215 104 236 114 250 120 H0 Z" fill="${SC.far}"/>`+scWater(118)+
    `<path d="M0 118 C40 110 100 112 150 122 C175 128 190 140 196 160 H0Z" fill="${SC.mid}"/>`+
    scHouse(10,124,26,20,SC.cream,'hip')+scHouse(38,122,22,18,SC.peach,'hip')+scHouse(62,124,28,22,SC.cream,'hip',SC.blue)+
    `<rect x="110" y="88" width="12" height="34" fill="${SC.cream}"/><rect x="110" y="96" width="12" height="5" fill="${SC.terra}"/><rect x="110" y="108" width="12" height="5" fill="${SC.terra}"/><path d="M108 88 h16 l-3 -8 h-10 z" fill="${SC.near}"/><rect x="112" y="80" width="8" height="4" fill="${SC.yellow}"/>`+
    `<path d="M300 140 H352 L344 148 H306 Z" fill="${SC.cream}"/><path d="M326 140 V108" stroke="${SC.cream}" stroke-width="2"/><path d="M328 110 L348 138 H328 Z" fill="${SC.yellow}"/><path d="M324 114 L308 138 H324 Z" fill="${SC.cream}"/>`; },
  city(){ const b=[[0,46,52],[48,30,74],[80,40,58],[122,26,92],[150,44,64],[196,32,82],[230,48,50],[280,28,98],[310,38,66],[350,40,56]];
    return scSun(70,80)+b.map(([x,w,h],i)=>{ const hh=h*0.95, y=128-hh; let wn=''; for(let r=0;r<Math.floor(hh/10)-3;r++) for(let c=0;c<Math.floor(w/10);c++) if((r*7+c*3+i)%5===0) wn+=`<rect x="${x+4+c*10}" y="${y+6+r*10}" width="4" height="5" fill="${SC.yellow}" opacity=".55"/>`; return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${SC.far}"/>${wn}`; }).join('')+
    b.map(([x,w,h],i)=>scHouse(x+4,140,w-6,h*0.62,[SC.cream,SC.blue,SC.peach,SC.cream,SC.rose,SC.cream][i%6],'flat',SC.near)).join('')+
    `<rect x="133" y="22" width="2" height="16" fill="${SC.cream}"/><circle cx="134" cy="21" r="2.2" fill="${SC.terra}"/><rect x="0" y="140" width="390" height="20" fill="${SC.near}"/>`+
    [30,110,190,270,350].map(x=>`<rect x="${x}" y="148" width="18" height="2" fill="${SC.yellow}" opacity=".7"/>`).join(''); },
  mountains(){ return scSun(300,60)+`<path d="M-10 132 L70 56 L120 100 L180 40 L250 108 L300 70 L400 132 Z" fill="${SC.far}"/>`+
    `<path d="M70 56 L54 71 L64 68 L72 74 L84 69 Z M180 40 L162 57 L174 54 L182 60 L196 55 Z M300 70 L288 81 L298 79 L306 84 L314 80 Z" fill="${SC.cream}"/>`+
    `<path d="M0 132 C80 112 200 116 390 124 V160 H0 Z" fill="${SC.mid}"/>`+[20,40,58,300,320,342,362].map((x,i)=>scPine(x,142,26+(i%3)*8,true)).join('')+
    scHouse(170,140,40,22,SC.terra,'gable',SC.near)+`<rect x="186" y="128" width="8" height="12" fill="${SC.near}"/><rect x="0" y="140" width="390" height="20" fill="${SC.near}"/>`; },
  countryside(){ return scSun(90,80)+`<path d="M0 104 C80 84 160 90 230 102 C300 112 350 98 390 96 V160 H0 Z" fill="${SC.far}"/>`+
    `<path d="M0 126 C100 108 240 112 390 120 V160 H0 Z" fill="${SC.green}"/>`+[0,1,2,3,4,5].map(i=>`<path d="M${i*70-20} 160 Q${i*70+20} 128 ${i*70+80} 124" stroke="${SC.green2}" stroke-width="2" fill="none" opacity=".7"/>`).join('')+
    scHouse(220,124,46,26,SC.cream,'gable',SC.terra)+`<rect x="238" y="112" width="10" height="12" fill="${SC.near}"/>`+scCypress(290,126,34)+scCypress(304,126,26)+
    `<circle cx="150" cy="112" r="12" fill="${SC.green2}"/><rect x="149" y="118" width="3" height="10" fill="#6B4A2E"/><rect x="0" y="148" width="390" height="12" fill="${SC.green2}"/>`; },
  tropical(){ return scSun(240,92)+scWater(112)+`<path d="M0 132 C100 120 280 122 390 130 V160 H0 Z" fill="#E9D6A8"/><path d="M0 132 C100 120 280 122 390 130" stroke="${SC.cream}" stroke-width="2" fill="none"/>`+
    scPalm(40,148,70,1)+scPalm(70,150,52,1)+scPalm(350,148,64,-1)+
    `<path d="M150 117 h30 l-4 6 h-22 z" fill="${SC.terra}"/><path d="M164 117 v-21 l12 19 z" fill="${SC.cream}"/><rect x="0" y="152" width="390" height="8" fill="#D9C08A"/>`; },
  desert(){ return scSun(300,84)+`<path d="M0 118 C80 98 160 102 230 116 C300 128 350 110 390 108 V160 H0 Z" fill="#D9A26A"/><path d="M0 136 C120 120 240 124 390 132 V160 H0 Z" fill="#E9C089"/>`+
    `<path d="M120 116 h60 v-28 h-60 z" fill="${SC.peach}"/><path d="M134 88 v-10 a16 16 0 0 1 32 0 v10 z" fill="${SC.cream}"/><path d="M196 116 v-56 h8 v56 z" fill="${SC.peach}"/><path d="M194 60 h12 l-6 -10 z" fill="${SC.brass}"/>`+
    [130,146,162].map(x=>`<path d="M${x} 116 v-12 a4 4 0 0 1 8 0 v12 z" fill="${SC.near}" opacity=".7"/>`).join('')+scPalm(250,138,40,1)+scPalm(70,140,34,-1); }
};
function scene(t){ const k=sceneKind(t), f=SCENES[k]||SCENES.coast; return `<svg class="scene" viewBox="0 0 390 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${f()}</svg>`; }
