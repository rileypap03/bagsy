/* ---------- basics ---------- */
const api = window.bagsyApi;
const DAY = 864e5;
const now0 = new Date(); let TODAY = new Date(Date.UTC(now0.getFullYear(), now0.getMonth(), now0.getDate()));
const BASE_PARTS = [['Flights',''],['Stay',''],['Package holiday',''],['Days out',''],['Spending money','']];
/* how many days before the trip each part is usually needed, who takes it by default, and whether it starts switched on */
const PART_DEF = {'Flights':[150,'me',true],'Stay':[100,'partner',true],'Package holiday':[120,'split',false],'Days out':[40,'me',false],'Spending money':[2,'partner',true]};
const partDue = (name,start) => { const d=iso(addDays(D(start),-((PART_DEF[name]||[14])[0]))); return d<iso(TODAY)?iso(addDays(TODAY,7)):d; };
const PLACES = ['Lisbon','Barcelona','Copenhagen','Rome'];
const SPLIT_COLS = ['var(--brass)','var(--brass-deep)','var(--brass-light)','var(--brass-darkest)'];
const I = (d,s=20,w=2.2)=>`<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const IC = {pen:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',back:'M15 18l-6-6 6-6',plus:'M12 5v14M5 12h14',close:'M6 6l12 12M18 6L6 18',warn:'M12 8v5M12 16.5v.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z',tick:'M5 12.5l4.5 4.5L19 7.5',chev:'M9 6l6 6-6 6',lock:'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',refresh:'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',trips:'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 11v6M15 11v6',act:'M3 12h4l3-7 4 14 3-7h4',you:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',share:'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',mail:'M3 6h18v12H3zM3 7l9 6 9-6',home:'M3 11l9-7 9 7M5 10v10h14V10'};
const PART_IMG = {Flights:'plane',Stay:'bed','Package holiday':'package','Days out':'tickets','Spending money':'wallet'};
const partIcon = n => `<span class="ico img"><img src="img/${PART_IMG[n]||'case'}.png" alt="" aria-hidden="true"></span>`;
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => { n=+n||0; return '£'+(Number.isInteger(Math.round(n*100)/100)?Math.round(n).toLocaleString('en-GB'):n.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})); };
const D = s => new Date(String(s).slice(0,10)+'T00:00:00Z');
const iso = d => d.toISOString().slice(0,10);
const localDay = ts => { const d=new Date(ts); return iso(new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))); };
const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (d,day=true)=>(day?DN[d.getUTCDay()]+' ':'')+d.getUTCDate()+' '+MN[d.getUTCMonth()];
const tripEnd = t => new Date(D(t.start).getTime()+t.nights*DAY);
const tripDates = t => { const a=D(t.start), b=tripEnd(t); return a.getUTCMonth()===b.getUTCMonth()?`${a.getUTCDate()}–${b.getUTCDate()} ${MN[b.getUTCMonth()]} ${b.getUTCFullYear()}`:`${fmt(a,false)} – ${fmt(b,false)} ${b.getUTCFullYear()}`; };
const weeksTo = s => Math.max(0,Math.floor((D(s)-TODAY)/(7*DAY)));
const addDays = (d,n) => new Date(d.getTime()+n*DAY);
const nextFridayAfter = d => { const x=addDays(d,1); while(x.getUTCDay()!==5) x.setUTCDate(x.getUTCDate()+1); return x; };
const nextFriday = () => nextFridayAfter(TODAY);
function firstPay(freq, from){ if(freq==='month'){ const x=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth(),27)); if(x<=from) x.setUTCMonth(x.getUTCMonth()+1); return x; } return nextFridayAfter(from); }
function stepPay(freq, d){ const x=new Date(d); if(freq==='month') x.setUTCMonth(x.getUTCMonth()+1); else x.setUTCDate(x.getUTCDate()+(freq==='week'?7:14)); return x; }
/* future payment dates, from the next one after today up to (not including) the due date */
function payDates(freq, due){ const out=[], end=D(due); let d=firstPay(freq,TODAY); while(d<end&&out.length<400){ out.push(d); d=stepPay(freq,d); } return out; }
const PER={week:'a week',fortnight:'a fortnight',month:'a month'};
const ls = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

/* ---------- state ---------- */
let A = ls.get('bagsy-cache', null);     // last loaded data, for a fast, offline-friendly start
let user = null, booting = true, offline = false, busy = false, loadErr = '';
let UI = { tab:'trips', screen:{name:'tabs'} };
let plan=null, sheet=null, toast=null, toastTimer=null, auth={ mode:'in', email:'', err:'', sending:false };
let splashSeen = false;   // the splash plays every time the app is opened fresh (not when you switch back to it)
const view=document.getElementById('view'), layer=document.getElementById('layer');
const params = new URLSearchParams(location.search);
if(params.get('join')){ ls.set('bagsy-join', params.get('join').toUpperCase()); history.replaceState(null,'',location.pathname); }

function shape(raw, uid){
  const profiles = {}; for(const p of raw.profiles) profiles[p.id]=p;
  const trips = raw.trips.map(t=>{
    const members = raw.members.filter(m=>m.trip_id===t.id).map(m=>m.user_id);
    const logs = raw.logs.filter(l=>l.trip_id===t.id);
    const parts = raw.parts.filter(p=>p.trip_id===t.id).map(p=>({
      id:p.id, name:p.name, cost:+p.cost, owner:p.owner, forPartner:p.for_partner, due:p.due, method:p.method, freq:p.freq, amt:+p.amount,
      into:p.into_label||'', checks:p.checks, scheduleFrom:p.schedule_from, created:p.created_at,
      saved: logs.filter(l=>l.part_id===p.id).reduce((s,l)=>s+(+l.amount),0) }));
    return { id:t.id, place:t.place, kind:t.kind, start:t.start_date, nights:t.nights, partnerName:t.partner_name||'', code:t.invite_code, createdBy:t.created_by, members, parts, logs };
  });
  return { uid, profiles, trips, activity:raw.activity, replies:raw.replies, at:Date.now() };
}
async function reload(){
  if(!user) return;
  try{ const raw = await api.load(user.id); A = shape(raw, user.id); ls.set('bagsy-cache', A); offline=false; loadErr=''; }
  catch(e){ offline = !navigator.onLine || /fetch|network/i.test(String(e&&e.message)); if(!offline) console.error(e); if(!A) loadErr = friendly(e); }
  render();
}
const me = () => A && A.profiles[user.id] || { id:user&&user.id, name:'' };
const trip = id => A.trips.find(t=>t.id===id);
const total = t => t.parts.reduce((s,p)=>s+p.cost,0), savedOf = t => t.parts.reduce((s,p)=>s+Math.min(p.saved,p.cost),0);
/* the other person on a trip: a joined member, or the name you planned it with */
function partnerOf(t){ const id=t.members.find(m=>m!==user.id); if(id) return { id, name:(A.profiles[id]||{}).name||'Your partner', joined:true }; if(t.partnerName||t.parts.some(p=>p.forPartner)) return { id:'partner:'+t.id, name:t.partnerName||'Your partner', joined:false }; return null; }
const ownerKey = (t,p) => p.owner || (p.forPartner ? 'partner:'+t.id : null);
const nameOf = (t,key) => key===user.id ? (me().name||'You') : key&&key.startsWith('partner:') ? (t.partnerName||'Your partner') : ((A.profiles[key]||{}).name||'Someone');
const isMine = p => p.owner===user.id;
function status(p){
  if(p.saved>=p.cost) return {txt:'Packed',k:'ok'};
  const rem=p.cost-p.saved, wl=Math.max(1,weeksTo(p.due));
  if(p.method==='adhoc'){ const startD=D(p.created||TODAY), span=Math.max(1,(D(p.due)-startD)/(7*DAY)), el=(TODAY-startD)/(7*DAY); const ideal=p.cost*Math.min(1,el/span); const behind = el>=2 && p.saved < ideal - p.cost*0.05; return behind?{txt:'Behind',k:'behind',pace:Math.ceil(rem/wl)}:{txt:'As and when',k:'muted',pace:Math.ceil(rem/wl)}; }
  if(p.method==='paid') return {txt:'Paid',k:'ok'};
  if(p.method==='none') return {txt:'Not set up',k:'muted'};
  const planned=p.amt*payDates(p.freq,p.due).length;
  return planned>=rem?{txt:'On track',k:'ok'}:{txt:'Behind',k:'behind',short:rem-planned};
}
function how(p){ return p.method==='none'?'<span class="setup">Set up how you’ll save</span>':p.method==='paid'?'Paid in full':p.method==='adhoc'?'As and when':`Auto ${money(p.amt)} ${p.freq==='week'?'Fri':p.freq==='fortnight'?'every 2 wks':'monthly'}`; }
/* "Did £x go in?" checks: the latest scheduled payment day that's passed and hasn't been confirmed */
function dueChecks(){
  if(!A) return [];
  const out=[];
  for(const t of A.trips) for(const p of t.parts){
    if(!isMine(p)||!p.checks||(p.method!=='pot'&&p.method!=='account')||p.saved>=p.cost||!(p.amt>0)) continue;
    let d=firstPay(p.freq, D(p.scheduleFrom)), last=null; while(d<=TODAY){ last=d; d=stepPay(p.freq,d); }
    if(!last||(TODAY-last)/DAY>21) continue;
    const due=iso(last), r=A.replies.find(x=>x.part_id===p.id&&x.due_date===due);
    if(r&&r.reply==='yes') continue;
    if(r&&r.reply==='notyet'){ const c=D(localDay(r.created_at)); const mon=addDays(c,((8-c.getUTCDay())%7)||7); if(TODAY<mon) continue; }
    out.push({ trip:t.id, part:p.id, due, amt:Math.min(p.amt,p.cost-p.saved) });
  }
  return out;
}

/* ---------- avatars ---------- */
const DEFAULT_AV = {skin:'s2',hairColour:'brown',hairStyle:'short',facial:'none',glasses:'none',bg:'sun'};
function av(key,s=32,t){
  const prof = key&&!String(key).startsWith('partner:') ? A&&A.profiles[key] : null;
  if(prof&&prof.avatar) return `<span class="av" style="width:${s}px;height:${s}px;overflow:hidden">${avatarSVG(prof.avatar,s)}</span>`;
  const nm = prof ? prof.name : t ? (t.partnerName||'?') : '?';
  return `<span class="av ${key===(user&&user.id)?'P':'I'}" style="width:${s}px;height:${s}px;font-size:${Math.round(s*.4)}px" aria-hidden="true">${esc((nm||'?')[0].toUpperCase())}</span>`;
}

/* ---------- rendering ---------- */
function render(){
  TODAY = (n=>new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())))(new Date());
  let chrome='';
  if(booting){ view.innerHTML=`<div class="center"><span class="spin"></span></div>`; }
  else if(!user){ view.innerHTML=signIn(); }
  else if(!A){ view.innerHTML=loadErr?`<div class="center" style="padding:24px;text-align:center"><p class="behind">${esc(loadErr)}</p><button class="btn sec" data-act="retry" style="max-width:240px">Try again</button><button class="link" data-act="signOut">Sign out</button></div>`:`<div class="center"><span class="spin"></span><p class="muted">Loading your trips…</p></div>`; }
  else if(!me().name){ view.innerHTML=onboarding(); }
  else {
    const sc=UI.screen;
    if(sc.name==='plan'&&!plan) UI.screen={name:'tabs'};
    if(UI.screen.name==='trip'&&!trip(UI.screen.id)) UI.screen={name:'tabs'};
    if(UI.screen.name==='tabs'){ view.innerHTML = UI.tab==='trips'?trips():UI.tab==='activity'?activity():you(); chrome=tabbar(); }
    else if(UI.screen.name==='trip') view.innerHTML = tripView(trip(UI.screen.id));
    else if(UI.screen.name==='plan'){ const r=planView(); view.innerHTML=r.main; chrome=`<div class="bottom">${r.bottom}</div>`; }
    const pending = ls.get('bagsy-join', null);
    if(pending && !sheet){ sheet={type:'join',code:pending,preview:undefined}; ls.set('bagsy-join',null); loadInvite(sheet); }
  }
  document.getElementById('chrome').innerHTML=chrome;
  if(navigator.setAppBadge){ const n=user&&A?dueChecks().length:0; (n?navigator.setAppBadge(n):navigator.clearAppBadge()).catch(()=>{}); }
  renderLayer();
}
function tabbar(){
  const n=dueChecks().length;
  const t=(k,label,ic)=>`<button class="tab" data-tab="${k}" ${UI.tab===k?'aria-current="page"':''}>${I(IC[ic],22,2)}<span>${label}</span>${k==='activity'&&n?`<span class="badge" aria-hidden="true">${n}</span><span class="sr">, ${n} thing${n===1?'':'s'} need${n===1?'s':''} you</span>`:''}</button>`;
  return `<nav class="tabs" aria-label="Main">${t('trips','Trips','trips')}${t('activity','Activity','act')}${t('you','You','you')}</nav>`;
}
const banner = () => (api.preview?`<div class="pv">Preview mode: everything is saved in this browser only.</div>`:'')+(offline?`<div class="pv off">You’re offline. Showing what was saved last time.</div>`:'');

/* sign in with email and password; new accounts are ready straight away (email confirmation is off in Supabase) */
function signIn(){
  const e=auth, up=e.mode==='up';
  return `<div class="auth">${banner()}<div class="authtop"><img src="img/bagsy-black.svg" alt="Bagsy" style="height:56px"><p class="muted" style="margin:14px 0 0;font-size:16px">Save for a trip together.<br>Each of you bagsies your part.</p></div>
  <div class="card" style="display:flex;flex-direction:column;gap:12px">
    <div class="seg two" role="tablist"><button data-authmode="in" aria-pressed="${!up}">Sign in</button><button data-authmode="up" aria-pressed="${up}">Create account</button></div>
    <label class="b" for="email">Email</label><input id="email" class="field" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="${esc(e.email)}">
    <label class="b" for="pw">Password</label><input id="pw" class="field" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'At least 8 characters':''}">
    <button class="btn" data-act="auth" ${e.sending?'disabled':''}>${e.sending?(up?'Creating…':'Signing in…'):(up?'Create account':'Sign in')}</button>
    ${e.err?`<p class="cap behind" role="alert" style="margin:0">${e.err}</p>`:''}
    <p class="cap muted" style="margin:0">${up?'Use a password you’ll remember. Your password manager can save it.':'New here? Tap Create account.'}</p></div></div>`;
}
function onboarding(){
  const d = sheet&&sheet.type==='onboard' ? sheet.draft : (sheet={type:'onboard',draft:{...DEFAULT_AV},name:''}).draft;
  return `<div class="auth">${banner()}<div style="padding:8px 8px 0"><h1>Welcome to Bagsy</h1><p class="muted" style="margin:6px 0 0">Tell us your name and make your avatar. Your trip partner sees both.</p></div>
  <div class="card" style="display:flex;flex-direction:column;gap:16px"><label class="b" for="nm">Your first name</label><input id="nm" class="field" autocomplete="given-name" value="${esc(sheet.name)}" placeholder="Paul">
  <div style="display:grid;place-items:center">${avatarSVG(d,120)}</div>${avatarControls(d)}
  <button class="btn" data-act="finishOnboard">Let’s go</button></div></div>`;
}
function trips(){
  const live=A.trips.filter(t=>tripEnd(t)>=TODAY), past=A.trips.filter(t=>tripEnd(t)<TODAY), checks=dueChecks();
  let h=`<div class="pad">${banner()}<div class="top"><h1>Trips</h1><button class="round" data-act="plan" aria-label="Plan a trip">${I(IC.plus,18,2.4)}</button></div>`;
  if(!live.length) h+=`<div class="card" style="text-align:center;padding:28px 20px;display:flex;flex-direction:column;gap:12px"><h1 style="font-size:24px">Where to next?</h1><p class="muted" style="margin:0">Plan a trip, split it into parts, and invite the person you’re going with.</p><button class="btn" data-act="plan">Plan a trip</button></div>`;
  else { h+=`<h2>Coming up</h2>`; for(const t of live){ const tot=total(t),sv=savedOf(t),pct=tot?Math.round(sv/tot*100):0, pt=partnerOf(t);
    h+=`<button class="card" data-open="${t.id}" style="padding:0;overflow:hidden;border:0;text-align:left;width:100%"><div style="position:relative;height:148px;background:var(--masthead)">${stars(4)}${scene(t)}<span class="pill" style="position:absolute;left:12px;top:12px;background:rgba(255,255,255,.18);color:#fff;box-shadow:none">${flag(t)}${esc(t.place)}</span><span style="position:absolute;right:12px;top:12px;display:flex">${[user.id].concat(pt?[pt.id]:[]).map((p,i)=>`<span style="margin-left:${i?-6:0}px;border-radius:50%;box-shadow:0 0 0 2px var(--masthead);display:flex">${av(p,28,t)}</span>`).join('')}</span></div>
    <div style="padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px"><div class="row" style="align-items:flex-end"><div class="col"><span class="cap muted">${tripDates(t)} · ${weeksTo(t.start)} weeks to go</span><span style="font-size:26px;line-height:32px;font-weight:700;letter-spacing:-.03em">${money(sv)} <span class="muted" style="font-size:15px;font-weight:500;letter-spacing:0">of ${money(tot)}</span></span></div><span class="sm b ok" style="padding-bottom:4px">${pct}% covered</span></div>
    <div style="display:flex;gap:3px;height:6px">${t.parts.map(p=>`<span class="bar" style="flex:${p.cost||1}"><i style="width:${p.cost?Math.min(100,p.saved/p.cost*100):0}%"></i></span>`).join('')}</div>
    ${pt&&!pt.joined?`<span class="notice" style="padding:10px 12px;align-items:center"><span class="b" style="color:var(--ink)">Invite ${esc(pt.name)}</span> They haven’t joined yet</span>`:''}
    ${checks.filter(c=>c.trip===t.id).map(c=>`<span class="notice" style="padding:10px 12px;align-items:center"><span class="b" style="color:var(--ink)">Did ${money(c.amt)} go in?</span> ${esc((t.parts.find(p=>p.id===c.part)||{}).name)}</span>`).join('')}</div></button>`; } }
  h+=`${live.length?`<button class="dash" data-act="plan">${I(IC.plus,16,2.4)} Plan another trip</button>`:''}<button class="link" data-act="enterCode" style="align-self:center">Got an invite code?</button>`;
  h+=`<h2>Been and gone</h2>`+(past.length?past.map(t=>`<button class="card row" data-open="${t.id}" style="border:0;text-align:left;width:100%"><span class="ico" style="border-radius:22px">${I(IC.trips,22,2)}</span><span class="col"><span class="b">${esc(t.place)}</span><span class="cap muted">${tripDates(t)}</span></span><span class="b">${money(savedOf(t))}</span></button>`).join(''):`<p class="sm muted" style="margin:0 8px">Finished trips land here, with what each part really cost.</p>`);
  return h+`</div>`;
}
function tripView(t){
  const tot=total(t), sv=savedOf(t), pct=tot?Math.round(sv/tot*100):0, pt=partnerOf(t);
  const mine=t.parts.filter(p=>isMine(p)&&(p.method==='pot'||p.method==='account')&&p.saved<p.cost);
  const nxt = mine.length?`Next saving <b style="color:#fff">${money(mine.reduce((s,p)=>s+Math.min(p.amt,p.cost-p.saved),0))} on ${fmt(nextFriday())}</b>`:`No saving due from you this week`;
  const people=[user.id].concat(pt?[pt.id]:[]);
  let h=`<div class="mast">${stars(8)}${scene(t)}<div class="in"><div class="row" style="width:100%;justify-content:space-between;height:52px"><button class="round veil" data-act="home" aria-label="Back">${I(IC.back)}</button><span class="pill" style="background:rgba(255,255,255,.16);color:#fff;box-shadow:none;font-size:15px">${flag(t)}${esc(t.place)}</span><button class="round veil" data-act="tripSettings" aria-label="Trip settings">${I(IC.gear,18,2)}</button></div>
  <div class="row" style="gap:8px;margin-top:18px;color:var(--on-mast-muted)"><span style="display:flex">${people.map((p,i)=>`<span style="margin-left:${i?-6:0}px;border-radius:50%;box-shadow:0 0 0 2px var(--masthead);display:flex">${av(p,26,t)}</span>`).join('')}</span>${tripDates(t)}${pt?' · you and '+esc(pt.name):''}</div>
  <div class="amt">${money(sv)}</div><div style="margin-top:8px;color:var(--on-mast-muted)"><b style="color:var(--ok-mast)">${pct}% covered</b> of ${money(tot)} · ${weeksTo(t.start)} weeks to go</div>
  <div class="split" style="width:280px;margin-top:16px">${t.parts.map(p=>`<span style="flex:${p.cost||1}"><i style="width:${p.cost?Math.min(100,p.saved/p.cost*100):0}%"></i></span>`).join('')}</div>
  <div class="row sm" style="gap:6px;margin-top:14px;color:var(--on-mast-muted)">${I(IC.refresh,15,2.4).replace('currentColor','var(--ok-mast)')}${nxt}</div></div></div><div class="pad" style="padding-top:12px">${banner()}`;
  if(pt&&!pt.joined) h+=`<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="row">${av(pt.id,40,t)}<div class="col"><span class="b" style="font-size:16px">Invite ${esc(pt.name)}</span><span class="cap muted">Send the link. They sign in with their email and the parts you set aside become theirs.</span></div></div><div class="codebox"><span class="cap muted">Invite code</span><span class="code-big">${esc(t.code)}</span></div><button class="btn" data-act="share" data-trip="${t.id}">${I(IC.share,18,2.2)} Share invite link</button></div>`;
  const owners = people.concat(t.parts.some(p=>!ownerKey(t,p))?[null]:[]);
  for(const who of owners){
    const ps=t.parts.filter(p=>ownerKey(t,p)===who); if(who===null&&!ps.length) continue;
    const s1=ps.reduce((s,p)=>s+Math.min(p.saved,p.cost),0), s2=ps.reduce((s,p)=>s+p.cost,0), mineCard = who===user.id;
    h+=`<div class="card" style="padding:16px 16px 0"><div class="row" style="gap:10px;padding-bottom:8px">${who?av(who,32,t):`<span class="av I" style="width:32px;height:32px">?</span>`}<span class="b" style="flex:1;font-size:16px;font-weight:700">${who===null?'Nobody yet':mineCard?esc(me().name)+' (you)':esc(nameOf(t,who))}</span><span class="sm muted"><b style="color:var(--ink)">${money(s1)}</b> of ${money(s2)}</span></div>`;
    if(!ps.length) h+=`<p class="sm muted" style="margin:0 0 12px">Nothing bagsied yet.</p>`;
    for(const p of ps){ const st=status(p);
      h+=`<button data-part="${p.id}" style="display:flex;gap:12px;padding:12px 0;width:100%;border:0;background:none;text-align:left">${partIcon(p.name)}<span class="col" style="gap:8px"><span class="row" style="align-items:flex-start;gap:8px"><span class="col"><span style="font-size:16px;font-weight:500">${esc(p.name)}</span><span class="cap muted">Due ${fmt(D(p.due),false)} · ${p.method==='none'&&!mineCard?'Not set up yet':how(p)}</span></span><span class="col" style="flex:none;align-items:flex-end"><span class="b" style="font-size:16px">${money(p.saved)}</span><span class="cap ${st.txt==='Packed'?'ok':'muted'}" style="font-weight:500">${st.txt==='Packed'?'Packed':'of '+money(p.cost)}</span></span></span><span class="bar" style="height:4px"><i style="width:${p.cost?Math.min(100,p.saved/p.cost*100):0}%"></i></span></span></button>`;
      if(st.k==='behind'){ const pace=st.pace||Math.ceil(st.short/Math.max(1,weeksTo(p.due)));
        h+=`<div class="notice" style="margin:4px 0 8px">${I(IC.warn,18,2)}<div class="col" style="gap:6px"><span>${esc(p.name)} is behind. ${money(pace)} a week from now gets it there by ${fmt(D(p.due),false)}.</span><span class="row" style="gap:16px">${mineCard?`<button class="link" style="padding:0;color:var(--ink)" data-part="${p.id}">Change how I save</button>`:`<button class="link" style="padding:0;color:var(--ink)" data-log="${t.id}" data-for="${p.id}">Help ${esc(nameOf(t,who))} out</button>`}</span></div></div>`; } }
    if(who!==null) h+=`<div class="divider"></div><button data-log="${t.id}" data-who="${who}" style="display:flex;align-items:center;justify-content:center;gap:8px;height:52px;width:100%;border:0;background:none;font-weight:600"><span style="width:24px;height:24px;border-radius:12px;background:${mineCard?'var(--yellow)':'var(--line-subtle)'};display:grid;place-items:center">${I(IC.plus,14,2.6)}</span>Log a saving${mineCard?'':' for '+esc(nameOf(t,who))}</button>`;
    h+=`</div>`;
  }
  return h+`<button class="dash" data-act="addPartSheet" data-trip="${t.id}">${I(IC.plus,16,2.4)} Add a part</button><p class="demo">Bagsy never moves money. You log what goes into your own accounts.</p></div>`;
}
const AKIND = (e,t) => {
  const d=e.data||{}, who=e.user_id===user.id?'You':esc((A.profiles[e.user_id]||{}).name||'Someone'), whose = id => id===user.id?(e.user_id===user.id?'':'your '):esc(nameOf(t,id))+'’s ';
  switch(e.kind){
    case 'planned': return { text:`${who} planned ${esc(t.place)}: ${money(d.total)} in ${d.parts} parts`, meta:tripDates(t) };
    case 'joined': return { text:`${who} joined ${esc(t.place)}`, meta:'From the invite' };
    case 'log': return { text:`${who} put ${money(d.amount)} into ${d.owner&&d.owner!==e.user_id?whose(d.owner):''}${esc(d.part)}`, meta:`${d.check?'Confirmed · ':''}now ${money(d.saved)} of ${money(d.cost)}`, amt:'+'+money(d.amount), tag:d.saved>=d.cost?'Packed':'', k:'ok', lead:'' };
    case 'plan': return { text:`${who} changed ${esc(d.part)} to ${esc(d.desc)}`, meta:esc(t.place) };
    case 'packed': return { text:`${esc(d.part)} is packed`, meta:`${who} paid ${money(d.amount)} in full`, amt:money(d.amount), tag:'Packed', k:'ok', lead:'part:'+d.part };
    case 'part': return { text:`${who} added ${esc(d.part)} to ${esc(t.place)}`, meta:money(d.cost) };
    default: return { text:`${who} updated ${esc(t.place)}`, meta:'' };
  }
};
function activity(){
  const checks=dueChecks();
  let h=`<div class="pad">${banner()}<div class="top"><h1>Activity</h1></div>`;
  if(checks.length){ h+=`<h2 style="margin-top:4px">Needs you</h2>`; for(const c of checks){ const t=trip(c.trip), p=t.parts.find(x=>x.id===c.part);
    h+=`<div class="card" style="display:flex;flex-direction:column;gap:14px"><div class="row">${partIcon(p.name)}<div class="col"><span class="b" style="font-size:16px">Did ${money(c.amt)} go in?</span><span class="cap muted">${esc(p.name)} · ${esc(t.place)} · ${fmt(D(c.due))} saving${p.into?' into '+esc(p.into):''}</span></div></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"><button class="btn s" data-yes="${c.part}" data-due="${c.due}">Yes, it went in</button><button class="btn s sec" data-notyet="${c.part}" data-due="${c.due}">Not yet</button></div></div>`; } }
  const rows=A.activity.map(e=>({e,t:trip(e.trip_id)})).filter(x=>x.t);
  if(!rows.length&&!checks.length) h+=`<div class="card" style="text-align:center"><p class="muted" style="margin:0">Nothing yet. When you or your partner plan, log or change something, it shows up here.</p></div>`;
  const mon=addDays(TODAY,-((TODAY.getUTCDay()+6)%7)), lab=day=>{ const x=D(day), n=Math.round((TODAY-x)/DAY); return n<=0?'Today':n===1?'Yesterday':x>=mon?'Earlier this week':x>=addDays(mon,-7)?'Last week':'Earlier'; };
  const groups={}; for(const r of rows){ const g=lab(localDay(r.e.created_at)); (groups[g]=groups[g]||[]).push(r); }
  for(const g of ['Today','Yesterday','Earlier this week','Last week','Earlier']) if(groups[g]){ h+=`<div class="grp">${g}</div><div class="card" style="padding:4px 16px">`+groups[g].map(({e,t},i)=>{
    const x=AKIND(e,t), dd=new Date(e.created_at), when=g==='Today'||g==='Yesterday'?dd.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):g==='Earlier'?fmt(D(localDay(e.created_at)),false):DN[dd.getDay()];
    const lead = x.lead&&x.lead.startsWith('part:')?partIcon(x.lead.slice(5)).replace('class="ico img"','class="ico img" style="width:36px;height:36px"').replace('<img ','<img style="width:40px;height:40px;margin:-2px" '):av(e.user_id,36,t);
    return `<div class="row" style="align-items:flex-start;padding:12px 0;${i?'border-top:1px solid var(--line-subtle)':''}">${lead}<div class="col"><span style="font-weight:500">${x.text}</span><span class="cap muted">${when}${x.meta?' · '+x.meta:''}</span></div>${x.amt?`<div class="col" style="flex:none;align-items:flex-end"><span class="b">${esc(x.amt)}</span><span class="cap ${x.k||'muted'}" style="font-weight:500">${esc(x.tag||'')}</span></div>`:''}</div>`; }).join('')+`</div>`; }
  return h+`</div>`;
}
function you(){
  const mine=A.trips.flatMap(t=>t.parts.filter(isMine).map(p=>({t,p})));
  const s1=mine.reduce((s,x)=>s+Math.min(x.p.saved,x.p.cost),0), s2=mine.reduce((s,x)=>s+x.p.cost,0);
  const behind=mine.some(x=>status(x.p).k==='behind');
  const partners={}; for(const t of A.trips){ const pt=partnerOf(t); if(pt){ (partners[pt.id]=partners[pt.id]||{pt,t,trips:[]}).trips.push(t.place); } }
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="pad">${banner()}<div class="top"><h1>You</h1></div><div class="card row"><button class="avbtn" data-act="editMe" aria-label="Change your name and avatar">${av(user.id,44)}<span class="pen" aria-hidden="true">${I(IC.pen,12,2.2)}</span></button><div class="col"><span class="b" style="font-size:17px">${esc(me().name)}</span><span class="cap muted">${esc(user.email||'')}</span></div></div>
  <h2>Your saving</h2><div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="row" style="align-items:baseline"><span style="font-size:26px;font-weight:700;letter-spacing:-.03em">${money(s1)}</span><span class="muted">of ${money(s2)}</span><span class="sm b ${behind?'behind':'ok'}" style="margin-left:auto">${!mine.length?'':behind?'Something’s behind':'On track'}</span></div><span class="bar"><i style="width:${s2?s1/s2*100:0}%"></i></span><span class="cap muted">Payment-day checks show up in Activity${navigator.setAppBadge?' and on the app icon':''}.</span></div>
  ${mine.length?`<h2>Where your money sits</h2><div class="card" style="padding:4px 16px">${mine.map(({t,p},i)=>`<div class="row" style="padding:12px 0;${i?'border-top:1px solid var(--line-subtle)':''}">${partIcon(p.name)}<div class="col"><span class="b">${esc(p.name)}</span><span class="cap muted">${esc(t.place)} · ${p.method==='none'?'Not set up yet':p.method==='paid'?'Paid in full':p.method==='adhoc'?'As and when':(p.method==='pot'?'A pot in my banking app':'Another account')+(p.into?' · '+esc(p.into):'')}</span></div></div>`).join('')}<p class="cap muted">Bagsy never moves your money. Your partner sees what you’ve saved for each part, never your balance.</p></div>`:''}
  ${Object.keys(partners).length?`<h2>Your people</h2><div class="card" style="padding:4px 16px">${Object.values(partners).map(({pt,t,trips},i)=>`<div class="row" style="padding:12px 0;${i?'border-top:1px solid var(--line-subtle)':''}">${av(pt.id,32,t)}<span class="b" style="flex:1">${esc(pt.name)}</span><span class="cap muted">${pt.joined?'':'Invited · '}${trips.map(esc).join(', ')}</span></div>`).join('')}</div>`:''}
  ${standalone?'':`<h2>Put Bagsy on your home screen</h2><div class="card sm" style="display:flex;flex-direction:column;gap:6px">${ios?`<span>1. Open this page in <b>Safari</b>.</span><span>2. Tap the Share button, then <b>Add to Home Screen</b>.</span><span>3. Open Bagsy from your home screen and sign in once more.</span>`:`<span>Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</span>`}</div>`}
  <button class="btn sec" data-act="signOut" style="margin-top:12px">Sign out</button>
  ${api.preview?`<h2>Preview tools</h2><div class="card" style="display:flex;flex-direction:column;gap:10px"><span class="cap muted">Pretend to be someone else to test the partner side. Sign out, then create another account with a different email.</span>${api._users().filter(u=>u.id!==user.id).map(u=>`<button class="btn s sec" data-switch="${u.id}">Switch to ${esc(u.name||u.email)}</button>`).join('')}<button class="btn s sec" data-act="wipe">Wipe preview data</button></div>`:''}
  <p class="demo">Bagsy ${window.BAGSY_VERSION||''}</p></div>`;
}
/* ---------- plan a trip ---------- */
function planView(){
  const P=plan, step=P.step;
  const head=`<div style="display:flex;flex-direction:column;gap:10px;padding:0 4px"><div class="row" style="justify-content:space-between;height:52px"><button class="round" data-act="planback" aria-label="Back">${I(IC.back)}</button><span class="b" style="font-size:16px">New trip</span><span class="cap muted" style="width:44px;text-align:right">${step} of 3</span></div><div style="display:flex;gap:4px;height:4px" role="img" aria-label="Step ${step} of 3">${[1,2,3].map(i=>`<span style="flex:1;border-radius:2px;background:${i<=step?'var(--ink)':'var(--line)'}"></span>`).join('')}</div></div>`;
  let body='', bottom='';
  const pn = P.partnerName.trim()||'them';
  if(step===1){
    const kind = P.kind || PLACE_KIND[P.place.trim().toLowerCase()] || 'coast', preset = !!PLACE_KIND[P.place.trim().toLowerCase()] && SCENES[PLACE_KIND[P.place.trim().toLowerCase()]] && !SCENE_KINDS.includes(PLACE_KIND[P.place.trim().toLowerCase()]);
    body=`<div style="padding:4px 8px 0"><h1>Where are you going?</h1><p class="muted" style="margin:6px 0 0">Plan it now. You’ll invite the other person at the end.</p></div>
    <div class="card" style="display:flex;flex-direction:column;gap:14px"><label class="b" for="place">Where</label><input id="place" class="field" value="${esc(P.place)}" placeholder="A city or somewhere warm" autocomplete="off"><div class="chips">${PLACES.map(p=>`<button class="chip" data-place="${p}" aria-pressed="${P.place===p}">${p}</button>`).join('')}</div>
    <div id="scenePrev" class="scenebox">${stars(3)}${scene({place:P.place,kind:P.kind})}</div>
    ${preset?'':`<div class="chips" role="group" aria-label="Scene">${SCENE_KINDS.map(k=>`<button class="chip" data-kind="${k}" aria-pressed="${kind===k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>`}
    <label class="b" for="start">First night</label><input id="start" type="date" class="field" value="${P.start}" min="${iso(TODAY)}">
    <div class="row"><span class="col"><span class="b">Nights</span><span class="cap muted">Roughly is fine</span></span><div class="stepper" style="padding:0;background:none"><button data-nights="-1" aria-label="One less night">−</button><span class="b" style="min-width:28px;text-align:center;font-size:17px" aria-live="polite">${P.nights}</span><button data-nights="1" aria-label="One more night">+</button></div></div>
    <div class="row" style="border-top:1px solid var(--line-subtle);padding-top:12px"><span class="col"><span class="b">Going with someone</span><span class="cap muted">Turn off to save for it on your own</span></span><input type="checkbox" class="switch" id="withPartner" ${P.withPartner?'checked':''}></div>
    ${P.withPartner?`<label class="b" for="pname">Who’s coming?</label><input id="pname" class="field" value="${esc(P.partnerName)}" placeholder="Their first name" autocomplete="off">`:''}</div>`;
    bottom=`<button class="btn" data-act="planNext" ${P.place.trim()&&(!P.withPartner||P.partnerName.trim())?'':'disabled'}>Next: what does it need?</button>`;
  } else if(step===2){
    const chosen=P.parts.filter(p=>p.on), tot=chosen.reduce((s,p)=>s+(+p.cost||0),0), wk=Math.max(1,weeksTo(P.start));
    body=`<div style="padding:4px 8px 0"><h1>What does the trip need?</h1><p class="muted" style="margin:6px 0 0">Pick the parts and give each a rough cost. You can change them later.</p></div>
    <div class="tiles">${P.parts.map((p,i)=>`<div class="tile ${p.on?'on':''}">${partIcon(p.name).replace('class="ico img"',`class="ico img" style="opacity:${p.on?1:.55}"`)}${p.on?`<span class="chk" aria-hidden="true">${I(IC.tick,14,3)}</span>`:''}<label class="b" for="cost${i}" style="min-height:40px;line-height:1.25">${esc(p.name)}</label>${p.on?`<div class="money" style="margin-top:auto"><span class="b muted">£</span><input id="cost${i}" inputmode="numeric" data-cost="${i}" value="${p.cost}" placeholder="0" aria-label="${esc(p.name)} cost"></div><button class="link" style="padding:4px 0 0;font-size:13px;align-self:flex-start" data-toggle="${i}">Remove</button>`:`<button class="btn s sec" style="margin-top:auto" data-toggle="${i}">${I(IC.plus,14,2.6)} Add</button>`}</div>`).join('')}</div>
    ${P.adding?`<div class="card" style="display:flex;flex-direction:column;gap:10px"><label class="b" for="newName">Your own part</label><input id="newName" class="field" placeholder="Insurance, a big dinner…"><div class="money"><span class="b muted">£</span><input id="newCost" inputmode="numeric" placeholder="Rough cost"></div><button class="btn s" data-act="addPlanPart">Add part</button></div>`:`<button class="dash" data-act="adding">${I(IC.plus,16,2.4)} Add your own part</button>`}
    <div class="notice">${I(IC.bulb,20,2)}<span>Flights and hotel booked as one deal? Add <b>Package holiday</b> instead, and split it between you on the next step. A rough cost is fine for now; you can change it later.</span></div>`;
    bottom=`<div class="row" style="align-items:baseline;justify-content:space-between"><span class="muted">Trip total · ${chosen.length} part${chosen.length===1?'':'s'}</span><span style="font-size:32px;font-weight:700;letter-spacing:-.03em" id="planTotal">${money(tot)}</span></div>
    <div class="splitc">${chosen.map((p,i)=>`<span style="flex:${+p.cost||1};background:${SPLIT_COLS[i%4]}"></span>`).join('')}</div>
    <div class="sm muted">About <b style="color:var(--ink)" id="planWeek">${money(Math.ceil(tot/wk))} a week</b>${P.withPartner?' between you':''}, over ${wk} weeks</div>
    ${chosen.length&&!chosen.every(p=>+p.cost>0)?`<span class="cap muted" id="costHint">Add a cost to each part to carry on.</span>`:''}<button class="btn" data-act="planNext" ${chosen.length&&chosen.every(p=>+p.cost>0)?'':'disabled'}>Next: who’s bagsying what</button>`;
  } else {
    const chosen=P.parts.filter(p=>p.on);
    body=`<div style="padding:4px 8px 0"><h1>Who’s bagsying what?</h1><p class="muted" style="margin:6px 0 0">Give each part an owner, or split it between you, and a date it’s needed by. Money stays in each person’s own bank.</p></div>
    ${chosen.map(p=>{ const i=P.parts.indexOf(p); return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="row">${partIcon(p.name)}<span class="col"><span class="b" style="font-size:16px">${esc(p.name)}</span><span class="cap muted">${money(+p.cost||0)}</span></span></div>${P.withPartner?`<div class="seg two" role="group" aria-label="Who bagsies ${esc(p.name)}">${['me','partner','split'].map(w=>`<button data-owner="${i}" data-w="${w}" aria-pressed="${p.owner===w}">${w==='me'?'Me':w==='split'?'Split it':esc(pn)}</button>`).join('')}</div>${p.owner==='split'?`<span class="cap muted">You each save ${money(Math.round((+p.cost||0)/2))} towards it, in your own bank.</span>`:''}`:''}<label class="cap muted" for="due${i}">Needed by</label><input id="due${i}" type="date" class="field" data-due="${i}" value="${p.due}" min="${iso(TODAY)}"></div>`; }).join('')}`;
    const mine=chosen.reduce((s,p)=>s+(!P.withPartner||p.owner==='me'?(+p.cost||0):p.owner==='split'?Math.round((+p.cost||0)/2):0),0);
    bottom=`<div class="row" style="justify-content:space-between"><span class="muted">You’re bagsying</span><span class="b" style="font-size:20px">${money(mine)}</span></div><button class="btn" data-act="create" ${busy?'disabled':''}>${busy?'Creating…':'Create trip'}</button>`;
  }
  return {main:`<div class="pad" style="padding-bottom:${step===2?300:200}px">${head}${body}</div>`, bottom};
}
function startPlan(){
  const start=iso(addDays(TODAY,180));
  plan={step:1,place:'',kind:null,start,nights:7,withPartner:true,partnerName:'',adding:false,
    parts:BASE_PARTS.map(([name,cost])=>({name,cost,on:PART_DEF[name][2],owner:PART_DEF[name][1],due:partDue(name,start)}))};
  UI.screen={name:'plan'}; render(); view.scrollTop=0;
}
function fixDues(){ plan.parts.forEach(p=>{ p.due=partDue(p.name,plan.start); }); }
async function createTrip(){
  if(busy) return; busy=true; render();
  const P=plan, chosen=P.parts.filter(p=>p.on);
  const kind = PLACE_KIND[P.place.trim().toLowerCase()] || P.kind || 'coast';
  try{
    const t = await api.createTrip({ place:P.place.trim(), kind, start_date:P.start, nights:P.nights, partner_name:P.withPartner?P.partnerName.trim():'' },
      chosen.flatMap(p=>{ const cost=Math.max(0,Math.round(+p.cost||0)), n=Math.max(1,payDates('week',p.due).length);
        const row=(c,mine)=>({ name:p.name, cost:c, owner:mine?user.id:null, for_partner:!mine, due:p.due, method:'none', freq:'week', amount:Math.ceil(c/n), into_label:mine?P.place.trim()+' pot':'', checks:true, schedule_from:iso(TODAY) });
        if(P.withPartner&&p.owner==='split'){ const a=Math.ceil(cost/2); return [row(a,true),row(cost-a,false)]; }
        return [row(cost,!P.withPartner||p.owner==='me')]; }));
    await api.addActivity(t.id,'planned',{ total:chosen.reduce((s,p)=>s+Math.max(0,Math.round(+p.cost||0)),0), parts:chosen.length });
    plan=null; UI.screen={name:'trip',id:t.id}; busy=false; await reload(); view.scrollTop=0;
    showToast(P.withPartner?`${esc(t.place)} is planned. Now invite ${esc(P.partnerName.trim())}.`:`${esc(t.place)} is planned. Tap a part to set how you’re saving.`);
  }catch(e){ busy=false; render(); fail(e); }
}
function fail(e){ console.error(e); showToast(esc(friendly(e))); }
const friendly = e => { const m=String(e&&(e.message||e.error_description)||e); if(/fetch|network|Failed/i.test(m)) return 'Couldn’t reach Bagsy. Check your connection and try again.'; return m; };

/* ---------- sheets ---------- */
function renderLayer(){
  const old=layer.querySelector('.sheet'), st=old?old.scrollTop:0, oldType=old?old.dataset.type:null;
  let h='';
  if(sheet&&user&&A){ const f={saving:savingSheet,log:logSheet,avatar:avatarSheet,join:joinSheet,code:codeSheet,settings:settingsSheet,addPart:addPartSheet}[sheet.type]; if(f) h=f(); }
  if(toast) h+=`<div class="toast" role="status"><span style="flex:1">${toast.msg}</span>${toast.undo?'<button data-act="undo">Undo</button>':''}</div>`;
  layer.innerHTML=h;
  const ns=layer.querySelector('.sheet'); if(ns&&old&&oldType===ns.dataset.type){ ns.style.animation='none'; ns.parentElement.style.animation='none'; ns.scrollTop=st; }
}
function showSplash(){
  const el=document.createElement('div'); el.className='splash'; el.id='splash';
  el.innerHTML=`<video id="sv" src="splash.mp4" autoplay muted playsinline preload="auto" aria-label="Bagsy splash: the trip parts drop into a suitcase and the lid shuts"></video><button class="skip" data-act="skip">Skip</button>`;
  document.getElementById('phone').appendChild(el);
  const v=el.querySelector('video'); v.muted=true; v.playsInline=true; v.onended=endSplash; v.onerror=()=>setTimeout(endSplash,800);
  const go=()=>v.play().catch(()=>setTimeout(endSplash,1200)); go(); setTimeout(()=>{ if(v.paused&&v.currentTime===0) go(); },500); setTimeout(endSplash,7000);
}
function endSplash(){ if(splashSeen) return; splashSeen=true; const el=document.getElementById('splash'); if(el){ el.style.transition='opacity .25s'; el.style.opacity='0'; setTimeout(()=>el.remove(),260); } }
const sheetHead = (id,title,sub) => `<span class="grab" aria-hidden="true"></span><div class="row"><div class="col"><span id="${id}" style="font-size:20px;font-weight:700;letter-spacing:-.02em">${title}</span>${sub?`<span class="cap muted">${sub}</span>`:''}</div><button class="round" style="box-shadow:none;background:var(--surface-page)" data-act="closeSheet" aria-label="Close">${I(IC.close,18,2.4)}</button></div>`;
const wrap = (type,id,inner) => `<div class="scrim" data-act="closeSheet"><div class="sheet" data-type="${type}" role="dialog" aria-modal="true" aria-labelledby="${id}" data-stop>${inner}</div></div>`;
function savingSheet(){
  const t=trip(sheet.trip), p=t&&t.parts.find(x=>x.id===sheet.part); if(!p){ sheet=null; return ''; }
  const d=sheet.draft, ownerName=nameOf(t,ownerKey(t,p)), theirs=!isMine(p);
  const rem=Math.max(0,p.cost-p.saved), dates=payDates(d.freq,p.due), n=dates.length, sugg=Math.max(1,Math.ceil(rem/Math.max(1,n)));
  const amt=d.amt||sugg, k=Math.ceil(rem/amt), planned=Math.min(amt*n,rem);
  let outcome,col;
  if(!rem){ outcome='Already packed. Nothing left to save.'; col='var(--ok)'; }
  else if(!n){ outcome='The due date has passed or is this week. Log what you have, or move the date.'; col='var(--behind)'; }
  else if(k<=n){ const hit=dates[k-1], early=Math.round((D(p.due)-hit)/DAY); outcome=`Covered by ${fmt(hit)}, ${early} day${early===1?'':'s'} before it’s due`; col='var(--ok)'; }
  else { outcome=`Behind: ${money(rem-amt*n)} short on ${fmt(D(p.due),false)}`; col='var(--behind)'; }
  const methods=[['pot','A pot in my banking app','A scheduled move into a pot or space, like Monzo, Starling or Revolut.','Most people'],['account','Another account','A standing order from your main bank to a savings account or a second bank.',''],['adhoc','As and when','You put money in when you can. No schedule.',''],['paid','Paid in full','You’ve already paid for this part.','']];
  const pt=partnerOf(t), owners=[[user.id,'Me']].concat(pt?[[pt.id,pt.name]]:[]);
  const details = `<details ${sheet.open?'open':''} id="pdet"><summary class="b">Part details</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
    <label class="cap muted" for="pName">Name</label><input id="pName" class="field" data-bind="name" value="${esc(d.name)}">
    <label class="cap muted" for="pCost">Cost</label><div class="money" style="height:48px;background:#fff;border:1.5px solid var(--line-control)"><span class="b muted">£</span><input id="pCost" inputmode="decimal" data-bind="cost" value="${d.cost}"></div>
    <label class="cap muted" for="pDue">Needed by</label><input id="pDue" type="date" class="field" data-bind="due" value="${d.due}">
    ${owners.length>1?`<span class="cap muted">Who’s bagsying it</span><div class="seg two">${owners.map(([id,l])=>`<button data-powner="${id}" aria-pressed="${d.owner===id}">${esc(l)}</button>`).join('')}</div>`:''}
    <button class="btn s" data-act="saveDetails">Save details</button><button class="link behind" data-act="deletePart" style="align-self:flex-start">${sheet.confirmDel?'Tap again to delete this part and its logged savings':'Delete this part'}</button></div></details>`;
  return wrap('saving','st',`<span class="grab" aria-hidden="true"></span><div class="row">${partIcon(p.name)}<div class="col"><span id="st" style="font-size:20px;font-weight:700;letter-spacing:-.02em">${theirs?esc(ownerName)+'’s saving':'How I’m saving'}</span><span class="cap muted">${esc(p.name)} · ${money(p.saved)} of ${money(p.cost)} · due ${fmt(D(p.due))}</span></div><button class="round" style="box-shadow:none;background:var(--surface-page)" data-act="closeSheet" aria-label="Close">${I(IC.close,18,2.4)}</button></div>
  ${theirs?`<div class="notice">${I(IC.lock,18,2)}<span>This is ${esc(ownerName)}’s part, so ${esc(ownerName)} sets how it’s saved. ${p.method==='none'?'They haven’t set it up yet.':p.method==='paid'?'It’s paid in full.':p.method==='adhoc'?'They’re saving as and when.':`They’re saving ${money(p.amt)} ${PER[p.freq]}.`} You can log a saving to help out.</span></div><button class="btn sec" data-log="${t.id}" data-for="${p.id}">Help ${esc(ownerName)} out</button>${details}`:`
  <div role="radiogroup" aria-labelledby="mq" style="display:flex;flex-direction:column;gap:8px"><span id="mq" class="b">Where does the money go?</span>${methods.map(([id,nm,h,tag])=>`<button class="radio" role="radio" aria-checked="${d.method===id}" data-method="${id}"><span class="dot"></span><span class="col"><span class="b" style="font-size:16px">${nm}${tag?`<span class="tag">${tag}</span>`:''}</span><span class="cap muted">${h}</span></span></button>`).join('')}</div>
  ${d.method==='pot'||d.method==='account'?`<div style="display:flex;flex-direction:column;gap:12px"><span class="b">How often</span><div class="seg" role="group" aria-label="How often">${[['week','Weekly'],['fortnight','Fortnightly'],['month','Monthly']].map(([f,l])=>`<button data-freq="${f}" aria-pressed="${d.freq===f}">${l}</button>`).join('')}</div>
  <div class="stepper"><button data-amt="-1" aria-label="Save £1 less">−</button><div class="col" style="text-align:center;align-items:center" aria-live="polite"><span style="font-size:32px;line-height:36px;font-weight:700;letter-spacing:-.03em">${money(amt)}</span><span class="cap muted">${PER[d.freq]}, ${d.freq==='month'?'on the 27th':d.freq==='week'?'every Friday':'every other Friday'}</span></div><button data-amt="1" aria-label="Save £1 more">+</button></div>
  <div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:2px;height:8px;border-radius:4px;overflow:hidden;background:var(--track)"><span style="flex:${Math.max(p.saved,0.01)};background:var(--brass)"></span><span style="flex:${planned||0.01};background:var(--brass-light)"></span><span style="flex:${Math.max(rem-planned,0)}"></span></div><span class="sm b" style="color:${col}">${outcome}</span>${n?`<span class="cap muted">${n} payment${n===1?'':'s'} ${d.freq==='week'?'every Friday':d.freq==='fortnight'?'every other Friday':'monthly'}, first on ${fmt(dates[0])}.</span>`:''}${amt!==sugg&&n?`<button class="link" style="align-self:flex-start;padding:4px 0" data-act="sugg">Use the suggested ${money(sugg)} ${PER[d.freq]}</button>`:''}</div></div>`:''}
  ${d.method==='adhoc'&&rem?`<div class="notice">${I(IC.bulb,20,2)}<span>No schedule, that’s fine. To be ready by ${fmt(D(p.due),false)} you’d need about <b>${money(Math.ceil(rem/Math.max(1,weeksTo(p.due))))} a week</b>.</span></div>`:''}
  ${d.method==='paid'&&rem?`<div class="notice">${I(IC.tick,18,2.4)}<span>Saving this logs the last ${money(rem)} so the part shows as packed.</span></div>`:''}
  ${d.method!=='paid'?`<div style="display:flex;flex-direction:column;gap:8px"><label class="b" for="into">Saving into</label><input id="into" class="field" value="${esc(d.into)}" placeholder="Pot or account name"><span class="cap muted">Your own account. ${pt?esc(pt.name)+' sees':'Others see'} the name, never the balance.</span></div>
  ${d.method!=='adhoc'?`<label class="row" style="min-height:44px"><span class="col"><span class="b" style="font-size:16px">Check it went in</span><span class="cap muted">On payment day: “Did ${money(amt)} go in?” One tap to confirm.</span></span><input type="checkbox" class="switch" id="chk" ${d.checks?'checked':''}></label>`:''}`:''}
  <div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="saveSaving" ${busy?'disabled':''}>Save</button><span class="cap muted row" style="justify-content:center;gap:6px">${I(IC.lock,14,2)} Bagsy never moves your money. You set this up in your bank.</span></div>${details}`}`);
}
function logSheet(){
  const t=trip(sheet.trip), d=sheet.draft, p=t.parts.find(x=>x.id===d.part);
  return wrap('log','lt',`${sheetHead('lt','Log a saving')}
  <div style="display:flex;flex-direction:column;gap:8px"><span class="b">Which part?</span>${t.parts.filter(x=>x.saved<x.cost).map(x=>`<button class="radio" role="radio" aria-checked="${d.part===x.id}" data-lpart="${x.id}"><span class="dot"></span><span class="col"><span class="b">${esc(x.name)}</span><span class="cap muted">${isMine(x)?'Your part':esc(nameOf(t,ownerKey(t,x)))+'’s part'} · ${money(x.saved)} of ${money(x.cost)}</span></span></button>`).join('')||'<p class="muted">Every part is packed.</p>'}</div>
  ${p?`<div style="display:flex;flex-direction:column;gap:10px"><label class="b" for="lamt">How much went in?</label><div class="money" style="height:56px;background:#fff;border:1.5px solid var(--line-control)"><span class="b muted" style="font-size:22px">£</span><input id="lamt" inputmode="decimal" value="${d.amt||''}" placeholder="0" style="font-size:24px"></div><div class="chips">${[5,10,20,50].map(a=>`<button class="chip" data-lq="${a}" aria-pressed="${+d.amt===a}">${money(a)}</button>`).join('')}</div>
  ${!isMine(p)?`<p class="cap muted" style="margin:0">This counts towards ${esc(nameOf(t,ownerKey(t,p)))}’s part. They’ll see you helped.</p>`:''}</div>
  <button class="btn" data-act="doLog" ${busy?'disabled':''}>Log ${d.amt?money(d.amt):'it'}</button>`:''}
  <span class="cap muted row" style="justify-content:center;gap:6px">${I(IC.lock,14,2)} Logging only records it. Bagsy never moves your money.</span>`);
}
function avatarControls(d){
  const O=AV_OPTS;
  const chips=k=>`<div class="chips">${Object.entries(O[k]).map(([v,l])=>`<button class="chip" data-avk="${k}" data-avv="${v}" aria-pressed="${d[k]===v}">${l}</button>`).join('')}</div>`;
  const sw=(k,label)=>`<div class="chips" role="group" aria-label="${label}">${Object.entries(O[k]).map(([v,c])=>`<button class="sw" style="background:${c}" data-avk="${k}" data-avv="${v}" aria-pressed="${d[k]===v}" aria-label="${label} ${v}"></button>`).join('')}</div>`;
  const row=(t,c)=>`<div style="display:flex;flex-direction:column;gap:8px"><span class="b">${t}</span>${c}</div>`;
  return row('Hair',chips('hairStyle'))+row('Hair colour',sw('hairColour','Hair colour'))+row('Skin',sw('skin','Skin tone'))+row('Face',chips('facial'))+row('Glasses',chips('glasses'))+row('Background',sw('bg','Background'));
}
function avatarSheet(){
  const d=sheet.draft;
  return wrap('avatar','avt',`${sheetHead('avt','You')}<label class="b" for="nm2">Your first name</label><input id="nm2" class="field" value="${esc(sheet.name)}"><div style="display:grid;place-items:center">${avatarSVG(d,120)}</div>${avatarControls(d)}<button class="btn" data-act="saveMe" ${busy?'disabled':''}>Save</button>`);
}
async function loadInvite(s){ try{ s.preview = await api.invitePreview(s.code); }catch(e){ s.preview=null; s.err=friendly(e); } if(sheet===s) renderLayer(); }
function joinSheet(){
  const s=sheet, p=s.preview, already=A.trips.some(t=>t.code===s.code);
  return wrap('join','jt',`${sheetHead('jt','Join a trip')}${s.preview===undefined?`<div class="center" style="min-height:120px"><span class="spin"></span></div>`:p?`<div class="scenebox" style="height:120px">${stars(3)}${scene({place:p.place})}</div><div class="col"><span class="b" style="font-size:18px">${esc(p.from||'Someone')} invited you to ${esc(p.place)}</span><span class="cap muted">${fmt(D(p.start_date),false)} ${D(p.start_date).getUTCFullYear()}</span></div><p class="sm muted" style="margin:0">You’ll see the whole trip and the parts set aside for you. Your money stays in your own bank.</p><button class="btn" data-act="doJoin" ${busy?'disabled':''}>${already?'Open the trip':'Join the trip'}</button>`:`<p class="behind" style="margin:0">${esc(s.err||'That code doesn’t match a trip. Check it with whoever invited you.')}</p><button class="btn sec" data-act="enterCode">Type the code</button>`}`);
}
function codeSheet(){ return wrap('code','ct',`${sheetHead('ct','Got an invite code?')}<input id="joinCode" class="field code" autocapitalize="characters" maxlength="8" placeholder="ABC123" value="${esc(sheet.val||'')}"><button class="btn" data-act="lookupCode">Find the trip</button>`); }
function settingsSheet(){
  const t=trip(sheet.trip), d=sheet.draft, creator=t.createdBy===user.id, pt=partnerOf(t);
  return wrap('settings','tst',`${sheetHead('tst','Trip settings')}
  <label class="b" for="sPlace">Where</label><input id="sPlace" class="field" data-bind="place" value="${esc(d.place)}">
  <div class="chips" role="group" aria-label="Scene">${SCENE_KINDS.concat(['lisbon','barcelona','copenhagen','rome']).map(k=>`<button class="chip" data-skind="${k}" aria-pressed="${(d.kind||sceneKind(t))===k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
  <label class="b" for="sStart">First night</label><input id="sStart" type="date" class="field" data-bind="start" value="${d.start}">
  <div class="row"><span class="col"><span class="b">Nights</span></span><div class="stepper" style="padding:0;background:none"><button data-snights="-1" aria-label="One less night">−</button><span class="b" style="min-width:28px;text-align:center;font-size:17px">${d.nights}</span><button data-snights="1" aria-label="One more night">+</button></div></div>
  <button class="btn" data-act="saveTrip" ${busy?'disabled':''}>Save</button>
  ${pt&&pt.joined?'':`<div class="codebox"><span class="cap muted">Invite code</span><span class="code-big">${esc(t.code)}</span></div><button class="btn sec" data-act="share" data-trip="${t.id}">${I(IC.share,18,2.2)} Share invite link</button>`}
  <button class="link behind" data-act="${creator?'deleteTrip':'leaveTrip'}" style="align-self:center">${sheet.confirm?(creator?'Tap again to delete this trip for both of you':'Tap again to leave this trip'):(creator?'Delete this trip':'Leave this trip')}</button>`);
}
function addPartSheet(){
  const t=trip(sheet.trip), d=sheet.draft, pt=partnerOf(t);
  return wrap('addPart','apt',`${sheetHead('apt','Add a part')}<label class="b" for="apName">What is it?</label><input id="apName" class="field" data-bind="name" value="${esc(d.name)}" placeholder="Insurance, car hire…">
  <label class="b" for="apCost">Rough cost</label><div class="money" style="height:48px;background:#fff;border:1.5px solid var(--line-control)"><span class="b muted">£</span><input id="apCost" inputmode="decimal" data-bind="cost" value="${esc(d.cost)}"></div>
  <label class="b" for="apDue">Needed by</label><input id="apDue" type="date" class="field" data-bind="due" value="${d.due}">
  ${pt?`<span class="b">Who’s bagsying it</span><div class="seg">${[[user.id,'Me'],[pt.id,pt.name],['split','Split it']].map(([id,l])=>`<button data-apowner="${id}" aria-pressed="${d.owner===id}">${esc(l)}</button>`).join('')}</div>${d.owner==='split'?`<span class="cap muted">Adds it to both your cards, half each.</span>`:''}`:''}
  <button class="btn" data-act="doAddPart" ${busy?'disabled':''}>Add part</button>`);
}
function showToast(msg,undo){ toast={msg,undo}; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{ toast=null; renderLayer(); },5500); renderLayer(); }
const ownerFields = (t,key) => key&&key.startsWith('partner:') ? { owner:null, for_partner:true } : { owner:key, for_partner:false };

async function logSaving(tid,pid,amt,checkDue){
  const t=trip(tid), p=t.parts.find(x=>x.id===pid); if(!p||!(amt>0)) return;
  busy=true; renderLayer();
  try{
    const log = await api.addLog({ trip_id:tid, part_id:pid, amount:amt, check_date:checkDue||null });
    const saved = p.saved+amt;
    const act = await api.addActivity(tid,'log',{ part:p.name, amount:amt, owner:p.owner, saved:Math.min(saved,p.cost), cost:p.cost, check:!!checkDue });
    if(checkDue) await api.reply(tid,pid,checkDue,'yes');
    busy=false; sheet=null; await reload();
    const pt=partnerOf(t);
    showToast(`Logged. ${esc(p.name)} is now ${money(Math.min(saved,p.cost))} of ${money(p.cost)}.${pt&&pt.joined?' '+esc(pt.name)+' will see it.':''}`, async()=>{ await api.deleteLog(log.id); await api.deleteActivity(act.id); if(checkDue) await api.deleteReply(pid,checkDue); await reload(); });
  }catch(e){ busy=false; renderLayer(); fail(e); }
}
async function share(t){
  const url = location.origin+location.pathname+'?join='+t.code, pt=partnerOf(t);
  const text = `Join me saving for ${t.place} on Bagsy. Open the link, sign in with your email, and the parts set aside for you are yours. Code: ${t.code}`;
  if(navigator.share){ try{ await navigator.share({ title:'Bagsy: '+t.place, text, url }); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  try{ await navigator.clipboard.writeText(text+'\n'+url); showToast('Invite link copied. Paste it in a message'+(pt?' to '+esc(pt.name):'')+'.'); }catch(e){ showToast('Invite code: '+esc(t.code)); }
}

/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const el=e.target.closest('button,[data-act],.scrim'); if(!el) return;
  if(e.target.closest('[data-stop]') && el.classList.contains('scrim')) return;
  const ds=el.dataset;
  if(ds.tab){ UI.tab=ds.tab; UI.screen={name:'tabs'}; render(); view.scrollTop=0; return; }
  if(ds.open){ UI.screen={name:'trip',id:ds.open}; render(); view.scrollTop=0; return; }
  if(ds.part){ const t=trip(UI.screen.id), p=t.parts.find(x=>x.id===ds.part); sheet={type:'saving',trip:t.id,part:p.id,draft:{method:p.method==='none'?'pot':p.method,freq:p.freq,amt:p.amt,into:p.into,checks:p.checks,name:p.name,cost:p.cost,due:p.due,owner:ownerKey(t,p)}}; renderLayer(); return; }
  if(ds.log){ const t=trip(ds.log); const pick=ds.for||(t.parts.find(x=>ownerKey(t,x)===(ds.who||user.id)&&x.saved<x.cost)||{}).id; sheet={type:'log',trip:t.id,draft:{part:pick,amt:''}}; renderLayer(); return; }
  if(ds.lpart){ sheet.draft.part=ds.lpart; renderLayer(); return; }
  if(ds.lq){ sheet.draft.amt=+ds.lq; renderLayer(); return; }
  if(ds.method){ sheet.draft.method=ds.method; renderLayer(); return; }
  if(ds.freq){ sheet.draft.freq=ds.freq; sheet.draft.amt=0; renderLayer(); return; }
  if(ds.powner){ sheet.draft.owner=ds.powner; sheet.open=true; renderLayer(); return; }
  if(ds.apowner){ sheet.draft.owner=ds.apowner; renderLayer(); return; }
  if(ds.skind){ sheet.draft.kind=ds.skind; renderLayer(); return; }
  if(ds.snights){ sheet.draft.nights=Math.min(60,Math.max(1,sheet.draft.nights+(+ds.snights))); renderLayer(); return; }
  if(ds.amt){ const s=sheet, t=trip(s.trip), p=t.parts.find(x=>x.id===s.part); const n=Math.max(1,payDates(s.draft.freq,p.due).length); const cur=s.draft.amt||Math.max(1,Math.ceil((p.cost-p.saved)/n)); s.draft.amt=Math.max(1,cur+(+ds.amt)); renderLayer(); return; }
  if(ds.yes){ const c=dueChecks().find(x=>x.part===ds.yes&&x.due===ds.due); if(c) logSaving(c.trip,c.part,c.amt,c.due); return; }
  if(ds.notyet){ const c=dueChecks().find(x=>x.part===ds.notyet&&x.due===ds.due); if(!c) return; try{ await api.reply(c.trip,c.part,c.due,'notyet'); await reload(); showToast('No problem. We’ll ask again on Monday.', async()=>{ await api.deleteReply(c.part,c.due); await reload(); }); }catch(err){ fail(err); } return; }
  if(ds.place){ plan.place=ds.place; plan.kind=null; render(); return; }
  if(ds.kind){ plan.kind=ds.kind; render(); return; }
  if(ds.nights){ plan.nights=Math.min(60,Math.max(1,plan.nights+(+ds.nights))); render(); return; }
  if(ds.toggle){ const p=plan.parts[+ds.toggle]; p.on=!p.on;
    if(p.on&&p.name==='Package holiday') plan.parts.forEach(x=>{ if(x.name==='Flights'||x.name==='Stay') x.on=false; });
    if(p.on&&(p.name==='Flights'||p.name==='Stay')) plan.parts.forEach(x=>{ if(x.name==='Package holiday') x.on=false; });
    render(); return; }
  if(ds.owner){ plan.parts[+ds.owner].owner=ds.w; render(); return; }
  if(ds.avk){ sheet.draft[ds.avk]=ds.avv; if(sheet.type==='onboard') render(); else renderLayer(); return; }
  if(ds.authmode){ auth.mode=ds.authmode; auth.err=''; const v=document.getElementById('email'); if(v) auth.email=v.value; render(); return; }
  if(ds.switch){ api._switch(ds.switch); user=await api.session(); A=null; sheet=null; UI={tab:'trips',screen:{name:'tabs'}}; render(); reload(); return; }
  switch(ds.act){
    case 'auth': { const em=(document.getElementById('email').value||'').trim(), pw=document.getElementById('pw').value||'', up=auth.mode==='up'; auth.email=em;
      if(!/^\S+@\S+\.\S+$/.test(em)){ auth.err='Enter your email address.'; render(); return; }
      if(pw.length<(up?8:1)){ auth.err=up?'Make your password at least 8 characters.':'Enter your password.'; render(); return; }
      auth.sending=true; auth.err=''; render();
      try{ user = up ? await api.signUp(em,pw) : await api.signIn(em,pw); auth={mode:'in',email:'',err:'',sending:false}; A=null; render(); await reload(); }
      catch(err){ const m=String(err&&err.message||err); auth.sending=false;
        auth.err = /CONFIRM_ON|not confirmed/i.test(m) ? 'Your account was made, but Supabase still has “Confirm email” switched on. Turn it off (Authentication → Sign In / Providers → Email), then sign in.'
          : /already registered|already exists/i.test(m) ? 'There’s already an account with that email. Tap Sign in.'
          : /invalid login/i.test(m) ? 'That email and password don’t match. Check them, or tap Create account if you’re new.'
          : /weak|pwned|leaked/i.test(m) ? 'That password is too easy to guess. Try a longer one.'
          : esc(friendly(err));
        render(); } break; }
    case 'finishOnboard': { const nm=(document.getElementById('nm').value||'').trim(); if(!nm){ document.getElementById('nm').focus(); return; } try{ await api.saveProfile(user.id,{ name:nm, avatar:sheet.draft }); sheet=null; await reload(); }catch(err){ fail(err); } break; }
    case 'editMe': sheet={type:'avatar',name:me().name,draft:{...DEFAULT_AV,...(me().avatar||{})}}; renderLayer(); break;
    case 'saveMe': { const nm=(document.getElementById('nm2').value||'').trim()||me().name; busy=true; renderLayer(); try{ await api.saveProfile(user.id,{ name:nm, avatar:sheet.draft }); busy=false; sheet=null; await reload(); showToast('Saved. Your trip partners see the new look.'); }catch(err){ busy=false; renderLayer(); fail(err); } break; }
    case 'plan': startPlan(); break;
    case 'home': UI.screen={name:'tabs'}; UI.tab='trips'; render(); break;
    case 'planback': if(plan.step>1){ plan.step--; render(); } else { plan=null; UI.screen={name:'tabs'}; render(); } view.scrollTop=0; break;
    case 'planNext': if(plan.step===1) fixDues(); plan.step++; render(); view.scrollTop=0; break;
    case 'adding': plan.adding=true; render(); document.getElementById('newName')?.focus(); break;
    case 'addPlanPart': { const n=document.getElementById('newName').value.trim(), c=+document.getElementById('newCost').value.replace(/[^\d.]/g,''); if(n){ plan.parts.push({name:n,cost:c||0,on:true,owner:'me',due:iso(addDays(D(plan.start),-14))}); plan.adding=false; render(); } break; }
    case 'create': createTrip(); break;
    case 'closeSheet': sheet=null; renderLayer(); break;
    case 'sugg': sheet.draft.amt=0; renderLayer(); break;
    case 'saveSaving': { const t=trip(sheet.trip), p=t.parts.find(x=>x.id===sheet.part), d=sheet.draft; const n=Math.max(1,payDates(d.freq,p.due).length);
      const amt=d.method==='pot'||d.method==='account'?(d.amt||Math.max(1,Math.ceil((p.cost-p.saved)/n))):0, rem=Math.max(0,p.cost-p.saved);
      busy=true; renderLayer();
      try{ await api.updatePart(p.id,{ method:d.method, freq:d.freq, amount:amt, into_label:d.into||'', checks:!!d.checks, schedule_from:iso(TODAY) });
        if(d.method==='paid'&&rem>0){ await api.addLog({ trip_id:t.id, part_id:p.id, amount:rem }); await api.addActivity(t.id,'packed',{ part:p.name, amount:p.cost }); }
        else await api.addActivity(t.id,'plan',{ part:p.name, desc: d.method==='adhoc'?'as and when':d.method==='paid'?'paid in full':money(amt)+' '+PER[d.freq] });
        busy=false; sheet=null; await reload(); const pt=partnerOf(t); showToast(`Saved.${pt&&pt.joined?' '+esc(pt.name)+' sees the plan, never your balance.':''}`); }catch(err){ busy=false; renderLayer(); fail(err); } break; }
    case 'saveDetails': { const t=trip(sheet.trip), p=t.parts.find(x=>x.id===sheet.part), d=sheet.draft; const cost=+String(document.getElementById('pCost').value).replace(/[^\d.]/g,''), name=document.getElementById('pName').value.trim()||p.name, due=document.getElementById('pDue').value||p.due;
      try{ await api.updatePart(p.id,{ name, cost:cost>=0?cost:p.cost, due, ...ownerFields(t,d.owner) }); sheet=null; await reload(); showToast('Part updated.'); }catch(err){ fail(err); } break; }
    case 'deletePart': if(!sheet.confirmDel){ sheet.confirmDel=true; sheet.open=true; renderLayer(); break; } try{ await api.deletePart(sheet.part); sheet=null; await reload(); showToast('Part deleted.'); }catch(err){ fail(err); } break;
    case 'doLog': { const v=+String(document.getElementById('lamt').value).replace(/[^\d.]/g,''); if(v>0) logSaving(sheet.trip,sheet.draft.part,Math.round(v*100)/100); else document.getElementById('lamt').focus(); break; }
    case 'undo': if(toast&&toast.undo){ const u=toast.undo; toast=null; renderLayer(); try{ await u(); }catch(err){ fail(err); } } break;
    case 'skip': endSplash(); break;
    case 'retry': loadErr=''; render(); reload(); break;
    case 'share': share(trip(ds.trip)); break;
    case 'enterCode': sheet={type:'code'}; renderLayer(); document.getElementById('joinCode')?.focus(); break;
    case 'lookupCode': { const v=(document.getElementById('joinCode').value||'').trim().toUpperCase(); if(!v) return; sheet={type:'join',code:v,preview:undefined}; renderLayer(); loadInvite(sheet); break; }
    case 'doJoin': { const s=sheet; busy=true; renderLayer(); try{ const id=await api.join(s.code); busy=false; sheet=null; await reload(); UI.screen={name:'trip',id}; render(); view.scrollTop=0; showToast(`You’re in. Tap one of your parts to set how you’ll save.`); }catch(err){ busy=false; s.err=friendly(err); s.preview=null; renderLayer(); } break; }
    case 'tripSettings': { const t=trip(UI.screen.id); sheet={type:'settings',trip:t.id,draft:{place:t.place,kind:t.kind,start:t.start,nights:t.nights}}; renderLayer(); break; }
    case 'saveTrip': { const t=trip(sheet.trip), d=sheet.draft; const place=document.getElementById('sPlace').value.trim()||t.place, start=document.getElementById('sStart').value||t.start;
      try{ await api.updateTrip(t.id,{ place, kind:d.kind||t.kind, start_date:start, nights:d.nights }); sheet=null; await reload(); showToast('Trip updated.'); }catch(err){ fail(err); } break; }
    case 'deleteTrip': if(!sheet.confirm){ sheet.confirm=true; renderLayer(); break; } try{ await api.deleteTrip(sheet.trip); sheet=null; UI.screen={name:'tabs'}; await reload(); showToast('Trip deleted.'); }catch(err){ fail(err); } break;
    case 'leaveTrip': if(!sheet.confirm){ sheet.confirm=true; renderLayer(); break; } try{ await api.leaveTrip(sheet.trip,user.id); sheet=null; UI.screen={name:'tabs'}; await reload(); showToast('You left the trip.'); }catch(err){ fail(err); } break;
    case 'addPartSheet': { const t=trip(ds.trip); sheet={type:'addPart',trip:t.id,draft:{name:'',cost:'',due:iso(addDays(D(t.start),-14)<TODAY?addDays(TODAY,7):addDays(D(t.start),-14)),owner:user.id}}; renderLayer(); document.getElementById('apName')?.focus(); break; }
    case 'doAddPart': { const t=trip(sheet.trip), d=sheet.draft, name=document.getElementById('apName').value.trim(), cost=+String(document.getElementById('apCost').value).replace(/[^\d.]/g,''), due=document.getElementById('apDue').value||d.due;
      if(!name){ document.getElementById('apName').focus(); return; } const mine=d.owner===user.id, n=Math.max(1,payDates('week',due).length);
      busy=true; renderLayer();
      try{ const pt=partnerOf(t), c=cost||0, base={ trip_id:t.id, name, due, method:'none', position:t.parts.length, schedule_from:iso(TODAY) };
        if(d.owner==='split'&&pt){ const a=Math.ceil(c/2); await api.addPart({ ...base, cost:a, ...ownerFields(t,user.id), amount:Math.ceil(a/n), into_label:t.place+' pot' }); await api.addPart({ ...base, cost:c-a, ...ownerFields(t,pt.id), amount:Math.ceil((c-a)/n), into_label:'', position:t.parts.length+1 }); }
        else await api.addPart({ ...base, cost:c, ...ownerFields(t,d.owner), amount:Math.ceil(c/n), into_label:mine?t.place+' pot':'' }); await api.addActivity(t.id,'part',{ part:name, cost:cost||0 }); busy=false; sheet=null; await reload(); showToast(`${esc(name)} added.`); }catch(err){ busy=false; renderLayer(); fail(err); } break; }
    case 'signOut': await api.signOut(); user=null; A=null; ls.set('bagsy-cache',null); sheet=null; UI={tab:'trips',screen:{name:'tabs'}}; render(); break;
    case 'wipe': api._wipe(); ls.set('bagsy-cache',null); location.reload(); break;
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='place'&&plan){ plan.place=t.value; plan.kind=null; const b=document.querySelector('[data-act=planNext]'); if(b) b.disabled=!(t.value.trim()&&(!plan.withPartner||plan.partnerName.trim())); document.querySelectorAll('[data-place]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.place===t.value)); const sp=document.getElementById('scenePrev'); if(sp) sp.innerHTML=stars(3)+scene({place:t.value}); }
  if(t.id==='pname'&&plan){ plan.partnerName=t.value; const b=document.querySelector('[data-act=planNext]'); if(b) b.disabled=!(plan.place.trim()&&t.value.trim()); }
  if(t.id==='start'&&plan&&t.value) plan.start=t.value;
  if(t.dataset.cost!==undefined&&plan){ plan.parts[+t.dataset.cost].cost=t.value.replace(/[^\d]/g,''); const ch=plan.parts.filter(p=>p.on), tot=ch.reduce((s,p)=>s+(+p.cost||0),0); const el=document.getElementById('planTotal'); if(el) el.textContent=money(tot); const w=document.getElementById('planWeek'); if(w) w.textContent=money(Math.ceil(tot/Math.max(1,weeksTo(plan.start))))+' a week'; const ok=ch.length&&ch.every(p=>+p.cost>0), b=document.querySelector('[data-act=planNext]'); if(b) b.disabled=!ok; const hn=document.getElementById('costHint'); if(hn) hn.style.display=ok?'none':''; }
  if(t.dataset.due!==undefined&&plan&&t.value) plan.parts[+t.dataset.due].due=t.value;
  if(t.id==='into'&&sheet) sheet.draft.into=t.value;
  if(t.dataset.bind&&sheet&&sheet.draft) sheet.draft[t.dataset.bind]=t.value;
  if(t.id==='nm'&&sheet) sheet.name=t.value;
  if(t.id==='nm2'&&sheet) sheet.name=t.value;
  if(t.id==='joinCode'&&sheet) sheet.val=t.value;
  if(t.id==='lamt'&&sheet){ sheet.draft.amt=+t.value.replace(/[^\d.]/g,'')||''; const b=document.querySelector('[data-act=doLog]'); if(b) b.textContent='Log '+(sheet.draft.amt?money(sheet.draft.amt):'it'); document.querySelectorAll('[data-lq]').forEach(c=>c.setAttribute('aria-pressed',+c.dataset.lq===sheet.draft.amt)); }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='withPartner'&&plan){ plan.withPartner=t.checked; render(); }
  if(t.id==='chk'&&sheet) sheet.draft.checks=t.checked;
  if(t.id==='start'&&plan) fixDues();
  if(t.dataset.cost!==undefined&&plan) render();
});
document.addEventListener('toggle',e=>{ if(e.target.id==='pdet'&&sheet) sheet.open=e.target.open; },true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&sheet&&sheet.type!=='onboard'){ sheet=null; renderLayer(); }
  if(e.key==='Enter'&&(e.target.id==='email'||e.target.id==='pw')) document.querySelector('[data-act=auth]')?.click();
  if(e.key==='Enter'&&e.target.id==='joinCode') document.querySelector('[data-act=lookupCode]')?.click();
});
/* keep both phones in step: refresh when the app comes back to the front, and every 30 seconds while open */
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') reload(); });
setInterval(()=>{ if(document.visibilityState==='visible'&&user&&!sheet&&!plan) reload(); },30000);
window.addEventListener('online',reload);

(async function boot(){
  showSplash();
  render();
  try{ user = await api.session(); }catch(e){ user=null; }
  if(user && A && A.uid!==user.id) A=null;
  if(!user) A=null;
  booting=false; render();
  if(user) reload();
})();
if('serviceWorker' in navigator && location.protocol==='https:' && !api.preview){
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache:'none' }).then(r=>{ r.update().catch(()=>{}); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') r.update().catch(()=>{}); }); }).catch(()=>{});
  /* a new version just took over: reload once so you see it straight away */
  let reloaded=false; navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(hadController&&!reloaded&&!sheet&&!plan){ reloaded=true; location.reload(); } });
}
