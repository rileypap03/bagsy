/* ---------- illustrated avatars ---------- */
const AV_OPTS = {
  skin:{s1:'#F7DCCB',s2:'#EDC3A4',s3:'#D9A27D',s4:'#B97D55',s5:'#8D5A3B',s6:'#5E3B26'},
  hairColour:{black:'#231C1A',dark:'#4A3426',brown:'#7A5236',blonde:'#D9B068',red:'#A9502C',grey:'#A29E98',white:'#E6E2DC'},
  hairStyle:{short:'Short',messy:'Messy',long:'Long',curly:'Curly',bun:'Bun',buzz:'Buzz',bald:'Bald'},
  facial:{none:'None',stubble:'Stubble',beard:'Beard',moustache:'Tache'},
  glasses:{none:'None',round:'Round',square:'Square'},
  bg:{sun:'#FFE29A',sky:'#DCE7FF',mint:'#DDF1E3',peach:'#FBE1D2',sand:'#EFE6D4'}
};
var avSeq=0;
function shade(hex,f){ const n=parseInt(hex.slice(1),16); const c=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*f)))); return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''); }
function avatarSVG(a,s){
  const id='avc'+(avSeq++), O=AV_OPTS, sk=O.skin[a.skin]||O.skin.s2, hc=O.hairColour[a.hairColour]||O.hairColour.dark, bg=O.bg[a.bg]||O.bg.sun, skd=shade(sk,.86), ink='#2A2522';
  const shirt=a.bg==='sky'?'#C99A3B':'#22408C';
  let back='',front='';
  const cap='M19.6 29 Q19 14.6 32 14.4 Q45 14.6 44.4 29 Q42.5 21.5 34 20.6 Q25.5 20.6 21 25 Z';
  if(a.hairStyle==='long') back=`<path d="M18.4 30 Q17.6 13.6 32 13.4 Q46.4 13.6 45.6 30 L47 52 Q32 56 17 52 Z" fill="${hc}"/>`;
  if(a.hairStyle==='curly') back=[[20,26,6],[44,26,6],[19,34,5],[45,34,5]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`).join('');
  if(a.hairStyle==='bun') back=`<circle cx="32" cy="11.5" r="5.5" fill="${hc}"/>`;
  if(a.hairStyle==='short'||a.hairStyle==='bun') front=`<path d="${cap}" fill="${hc}"/>`;
  if(a.hairStyle==='buzz') front=`<path d="${cap}" fill="${hc}" opacity=".5"/>`;
  if(a.hairStyle==='messy') front=`<path d="M19.6 29 Q18.6 15 27 13.6 L29 11 L31.5 13.2 L34.5 10.8 L36 13.6 Q45.4 15.4 44.4 29 Q43 21.8 36.5 20.2 L33 22.4 L31 19.8 Q24 20.4 21 25 Z" fill="${hc}"/>`;
  if(a.hairStyle==='long') front=`<path d="M19.6 31 Q19 15.2 32 15 Q45 15.2 44.4 31 Q41.5 21 33 19.8 Q25.5 21 19.6 31 Z" fill="${hc}"/>`;
  if(a.hairStyle==='curly') front=[[22,19,5],[28,15.5,5.5],[35,15,5.5],[41,18.5,5],[25,21,4],[38,21,4]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`).join('');
  let face='';
  if(a.facial==='stubble') face=`<path d="M20.6 31 Q21 43.6 32 44.4 Q43 43.6 43.4 31 Q42 39 36.5 40 Q32 38.4 27.5 40 Q22 39 20.6 31 Z" fill="${hc}" opacity=".38"/>`;
  if(a.facial==='beard') face=`<path d="M20 29.5 Q19.8 46.5 32 46.8 Q44.2 46.5 44 29.5 Q43 38.4 37.2 39.6 Q32 37.4 26.8 39.6 Q21 38.4 20 29.5 Z" fill="${hc}"/>`;
  if(a.facial==='moustache') face=`<path d="M27.2 36 Q32 33.2 36.8 36 Q32 37.2 27.2 36 Z" fill="${hc}"/>`;
  const mouthCol=a.facial==='beard'?shade(sk,.7):'#7A3B2E';
  let gl='';
  if(a.glasses==='round') gl=`<g fill="none" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"><circle cx="27" cy="29.6" r="3.7"/><circle cx="37" cy="29.6" r="3.7"/><path d="M30.7 29.4 Q32 28.4 33.3 29.4M23.3 29 L19.6 28.4M40.7 29 L44.4 28.4"/></g>`;
  if(a.glasses==='square') gl=`<g fill="none" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"><rect x="22.8" y="26.6" width="8.2" height="6.2" rx="1.6"/><rect x="33" y="26.6" width="8.2" height="6.2" rx="1.6"/><path d="M31 29.2 H33M22.8 28.6 L19.6 28.2M41.2 28.6 L44.4 28.2"/></g>`;
  const brow=a.hairStyle==='bald'||a.hairStyle==='buzz'?shade(hc,.8):hc;
  return `<svg class="avsvg" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="${id}"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#${id})">
  <rect width="64" height="64" fill="${bg}"/>${back}
  <path d="M10 66 Q12 50.5 32 49.5 Q52 50.5 54 66 Z" fill="${shirt}"/><path d="M27.5 38 H36.5 V49 Q32 52 27.5 49 Z" fill="${skd}"/>
  <circle cx="20" cy="31" r="3" fill="${skd}"/><circle cx="44" cy="31" r="3" fill="${skd}"/>
  <ellipse cx="32" cy="29.5" rx="12" ry="14" fill="${sk}"/>${face}${front}
  <path d="M24.6 25.6 Q27 24.4 29.4 25.4 M34.6 25.4 Q37 24.4 39.4 25.6" stroke="${brow}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <circle cx="27" cy="29.6" r="1.35" fill="${ink}"/><circle cx="37" cy="29.6" r="1.35" fill="${ink}"/>
  <path d="M32 30.5 Q30.6 34.4 32.6 34.8" stroke="${skd}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M28.8 37.4 Q32 39.8 35.2 37.4" stroke="${mouthCol}" stroke-width="1.4" fill="none" stroke-linecap="round"/>${gl}</g></svg>`;
}
