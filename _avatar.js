/* ---------- bag avatars: everyone bagsies a bag, with straps in their colour ---------- */
const BAGS = ['suitcase','backpack','duffel','hatbox','trunk','tote','satchel','bumbag'];
const BAG_NAMES = {suitcase:'Suitcase',backpack:'Backpack',duffel:'Duffel',hatbox:'Hatbox',trunk:'Trunk',tote:'Tote',satchel:'Satchel',bumbag:'Bum bag'};
const BAG_COLS = {mustard:null, terracotta:'#C8603F', sage:'#7E9B7A', blue:'#5F82B0', pink:'#D98A95', navy:'#2C3A5A'};
const BAG_SWATCH = {mustard:'#E2AE3A', terracotta:'#C8603F', sage:'#7E9B7A', blue:'#5F82B0', pink:'#D98A95', navy:'#2C3A5A'};
const COL_ORDER = Object.keys(BAG_COLS);
/* a steady default for anyone who hasn't picked (or still has an old drawn avatar) */
function hashPick(id, list){ let h=0; for(const c of String(id||'x')) h=(h*31+c.charCodeAt(0))>>>0; return list[h%list.length]; }
function bagOf(id, avatar){ const a=avatar||{}; return { bag: BAGS.includes(a.bag)?a.bag:hashPick(id,BAGS), col: BAG_COLS.hasOwnProperty(a.col)?a.col:hashPick(id+'c',COL_ORDER) }; }

/* recolour the mustard straps in the browser, once per bag and colour, and remember the result */
const bagCache = {}, bagWaiting = {};
function hexHsv(h){ const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; let hu=0; if(d){ hu=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; hu/=6; if(hu<0) hu+=1; } return [hu,mx?d/mx:0,mx]; }
function hsvRgb(h,s,v){ const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s); return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6]; }
function bagSrc(bag,col){
  const base=`img/bag-${bag}.png`, hex=BAG_COLS[col]; if(!hex) return base;
  const k=bag+'/'+col; if(bagCache[k]) return bagCache[k];
  if(!bagWaiting[k]){ bagWaiting[k]=true; const im=new Image(); im.onload=()=>{ try{
      const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; const x=c.getContext('2d'); x.drawImage(im,0,0);
      const d=x.getImageData(0,0,c.width,c.height), p=d.data, [th,ts,tv]=hexHsv(hex);
      for(let i=0;i<p.length;i+=4){ if(!p[i+3]) continue; const [h,s,v]=hexHsv('#'+[p[i],p[i+1],p[i+2]].map(n=>n.toString(16).padStart(2,'0')).join(''));
        if(h>0.08&&h<0.17&&s>0.45){ const nv=Math.min(1,v*(tv<0.6?tv/0.85:Math.min(1.1,tv/0.85))); const [r,g,b]=hsvRgb(th,Math.min(1,ts*(s/0.7)),nv); p[i]=r*255; p[i+1]=g*255; p[i+2]=b*255; } }
      x.putImageData(d,0,0); bagCache[k]=c.toDataURL('image/png');
      document.querySelectorAll(`img[data-bag="${k}"]`).forEach(el=>{ el.src=bagCache[k]; });
    }catch(e){} }; im.src=base; }
  return base;   // shows the mustard one for a moment, then swaps in place
}
function bagImg(bag,col,s,cls='bagav'){ return `<img class="${cls}" data-bag="${bag}/${col}" src="${bagSrc(bag,col)}" width="${s}" height="${s}" alt="" aria-hidden="true">`; }
