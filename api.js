/* Bagsy data layer. Real: Supabase. Preview: a fake backend in this browser, used when config.js has no Supabase URL. */
(function(){
const cfg = window.BAGSY_CONFIG || {};
const PREVIEW = !cfg.supabaseUrl;
/* a password-reset link from the email lands here with #...type=recovery; note it before Supabase tidies the address */
const RECOVERY = /type=recovery|error_code=otp_expired/.test(location.hash + location.search);
const APP_URL = location.origin + location.pathname;

/* ---------- real backend ---------- */
function realApi(){
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit', storageKey:'bagsy-auth' } });
  let recovering = RECOVERY;
  sb.auth.onAuthStateChange(ev => { if(ev==='PASSWORD_RECOVERY'){ recovering = true; window.dispatchEvent(new Event('bagsy-recovery')); } });
  const ok = ({data,error}) => { if(error) throw error; return data; };
  return {
    preview:false,
    async session(){ const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null; },
    async signIn(email, password){ const d = ok(await sb.auth.signInWithPassword({ email, password })); return d.user; },
    async signUp(email, password){ const d = ok(await sb.auth.signUp({ email, password })); if(!d.session) throw new Error('CONFIRM_ON'); return d.user; },
    async signOut(){ await sb.auth.signOut(); },
    recovering(){ return recovering; },
    async resetPassword(email){ ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: APP_URL })); },
    async newPassword(password){ ok(await sb.auth.updateUser({ password })); recovering = false; if(location.hash) history.replaceState(null,'',location.pathname); },
    async pushKey(){ return ok(await sb.rpc('push_public_key')) || ''; },
    async savePush(sub){ const j = sub.toJSON(); ok(await sb.from('push_subs').upsert({ endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth })); },
    async dropPush(endpoint){ ok(await sb.from('push_subs').delete().eq('endpoint', endpoint)); },
    async testPush(){ const { data:{ session } } = await sb.auth.getSession();
      const r = await fetch(cfg.supabaseUrl + '/functions/v1/push', { method:'POST', headers:{ 'Content-Type':'application/json', apikey:cfg.supabaseAnonKey, Authorization:'Bearer ' + (session && session.access_token) }, body:JSON.stringify({ type:'test' }) });
      const j = await r.json().catch(()=>({})); if(!r.ok || j.error) throw new Error(j.error || ('The notification server answered ' + r.status)); return j.sent || 0; },
    async findIdeas(ask){ const { data:{ session } } = await sb.auth.getSession();
      const r = await fetch(cfg.supabaseUrl + '/functions/v1/find', { method:'POST', headers:{ 'Content-Type':'application/json', apikey:cfg.supabaseAnonKey, Authorization:'Bearer ' + (session && session.access_token) }, body:JSON.stringify(ask) });
      const j = await r.json().catch(()=>({})); if(!r.ok || j.error) throw new Error(j.error || (r.status===404?'The finder isn’t switched on yet.':'The finder answered ' + r.status)); return j; },
    async load(uid){
      const [profiles, trips, members, parts, logs, replies, activity] = await Promise.all([
        sb.from('profiles').select('*'), sb.from('trips').select('*').order('start_date'), sb.from('trip_members').select('*'),
        sb.from('parts').select('*').order('position'), sb.from('logs').select('*').order('created_at'),
        sb.from('check_replies').select('*'), sb.from('activity').select('*').order('created_at',{ascending:false}).limit(200)
      ].map(p=>p.then(ok)));
      // surprises: tolerate the table not existing yet, so the app still loads before the SQL update is run
      const soft = q => q.then(r=>r.error?[]:(r.data||[]), ()=>[]);
      const [surprises, forMe] = await Promise.all([ soft(sb.from('surprises').select('*')), soft(sb.rpc('my_surprises')) ]);
      return { profiles, trips, members, parts, logs, replies, activity, surprises, forMe };
    },
    async saveProfile(uid, fields){ ok(await sb.from('profiles').upsert({ id:uid, ...fields })); },
    async createTrip(trip, parts){
      const t = ok(await sb.from('trips').insert(trip).select().single());
      if(parts.length) ok(await sb.from('parts').insert(parts.map((p,i)=>({ ...p, trip_id:t.id, position:i }))));
      return t;
    },
    async updateTrip(id, f){ ok(await sb.from('trips').update(f).eq('id',id)); },
    async deleteTrip(id){ ok(await sb.from('trips').delete().eq('id',id)); },
    async leaveTrip(id, uid){ ok(await sb.from('trip_members').delete().eq('trip_id',id).eq('user_id',uid)); },
    async updatePart(id, f){ ok(await sb.from('parts').update(f).eq('id',id)); },
    async addPart(p){ return ok(await sb.from('parts').insert(p).select().single()); },
    async deletePart(id){ ok(await sb.from('parts').delete().eq('id',id)); },
    async addLog(row){ return ok(await sb.from('logs').insert(row).select().single()); },
    async deleteLog(id){ ok(await sb.from('logs').delete().eq('id',id)); },
    async setSurprise(trip_id, f){ ok(await sb.from('surprises').upsert({ trip_id, ...f })); },
    async updateLog(id, f){ ok(await sb.from('logs').update(f).eq('id',id)); },
    async addActivity(trip_id, kind, data){ return ok(await sb.from('activity').insert({ trip_id, kind, data }).select().single()); },
    async deleteActivity(id){ ok(await sb.from('activity').delete().eq('id',id)); },
    async reply(trip_id, part_id, due_date, reply){ ok(await sb.from('check_replies').upsert({ trip_id, part_id, due_date, reply, created_at:new Date().toISOString() })); },
    async deleteReply(part_id, due_date){ ok(await sb.from('check_replies').delete().eq('part_id',part_id).eq('due_date',due_date)); },
    async join(code){ return ok(await sb.rpc('join_trip', { code })); },
    async invitePreview(code){ return ok(await sb.rpc('invite_preview', { code })); }
  };
}

/* ---------- preview backend (this browser only) ---------- */
function previewApi(){
  const KEY='bagsy-preview-db';
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id'+Math.random().toString(36).slice(2)+Date.now().toString(36));
  const now = () => new Date().toISOString();
  let db; try{ db = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!db) db = { users:[], session:null, profiles:[], trips:[], trip_members:[], parts:[], logs:[], check_replies:[], activity:[] };
  db.surprises = db.surprises || [];
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} };
  const me = () => db.session;
  const memberOf = t => db.trip_members.some(m=>m.trip_id===t && m.user_id===me());
  const wait = (v) => new Promise(r=>setTimeout(()=>r(v), 120));
  const need = () => { if(!me()) throw new Error('Not signed in'); };
  return {
    preview:true,
    async session(){ return wait(me() ? { id:me(), email:(db.users.find(u=>u.id===me())||{}).email } : null); },
    async signUp(email, password){ await wait(); email=email.toLowerCase(); if(db.users.find(x=>x.email===email)) throw new Error('User already registered');
      const u={ id:uuid(), email, password }; db.users.push(u); db.profiles.push({ id:u.id, name:'', avatar:null, created_at:now() }); db.session=u.id; save(); return { id:u.id, email }; },
    async signIn(email, password){ await wait(); email=email.toLowerCase(); const u=db.users.find(x=>x.email===email&&(x.password||'')===password); if(!u) throw new Error('Invalid login credentials'); db.session=u.id; save(); return { id:u.id, email }; },
    async signOut(){ db.session = null; save(); },
    recovering(){ return RECOVERY; },
    async resetPassword(email){ await wait(); },
    async newPassword(password){ await wait(); const u=db.users.find(x=>x.id===me()); if(u) u.password=password; save(); },
    async pushKey(){ return ''; },
    async savePush(){}, async dropPush(){}, async testPush(){ throw new Error('Notifications only work in the real app.'); },
    async findIdeas(ask){ need(); await new Promise(r=>setTimeout(r,1500));
      const n=ask.nights||7, ppl=ask.people||2, d=new Date(ask.month+'-01T00:00:00Z'); while(d.getUTCDay()!==5) d.setUTCDate(d.getUTCDate()+1); const start=d.toISOString().slice(0,10);
      const mk=(place,country,iata,kind,why,weather,fl,night,daily,live)=>{ const stay=Math.round(night*n/(ppl===1?1:2)), sp=daily*n, total=fl+stay+sp;
        return { place,country,iata,kind,why,weather,start,nights:n, flight:{pp:fl,live,direct:live,airline:live?'EZY':'',link:'https://www.aviasales.com/'}, stay:{night,pp:stay}, spend:{daily,pp:sp}, total, over:Math.max(0,total-ask.budget) }; };
      const ideas=[ mk('Tenerife','Spain','TFS','tropical','Reliable sun and a short-ish flight, with quiet towns away from the strip','22°C, mostly sunny',149,60,25,true),
        mk('Madeira','Portugal','FNC','countryside','Mild and green, great walks along the levadas and good food','19°C, some cloud',168,62,26,true),
        mk('Paphos','Cyprus','PFO','coast','Harbour town with old ruins and warm afternoons','18°C, sunny spells',198,70,30,true),
        mk('Marrakech','Morocco','RAK','desert','Warm days, riads and souks, and cheap to eat well','20°C, dry and sunny',156,55,24,false),
        mk('Lanzarote','Spain','ACE','coast','Calmer than Tenerife, volcanic scenery and beaches','21°C, sunny',231,95,42,true) ].sort((a,b)=>a.over-b.over||b.total-a.total);
      return { ideas, asked:ask, inBudget:ideas.filter(i=>!i.over).length }; },
    async load(){
      need(); await wait();
      const tripIds = new Set(db.trip_members.filter(m=>m.user_id===me()).map(m=>m.trip_id));
      const partners = new Set(db.trip_members.filter(m=>tripIds.has(m.trip_id)).map(m=>m.user_id)); partners.add(me());
      const inTrip = r => tripIds.has(r.trip_id);
      return JSON.parse(JSON.stringify({
        profiles: db.profiles.filter(p=>partners.has(p.id)),
        trips: db.trips.filter(t=>tripIds.has(t.id)).sort((a,b)=>a.start_date<b.start_date?-1:1),
        members: db.trip_members.filter(inTrip), parts: db.parts.filter(inTrip).sort((a,b)=>a.position-b.position),
        logs: db.logs.filter(inTrip), replies: db.check_replies.filter(inTrip),
        activity: db.activity.filter(inTrip).sort((a,b)=>a.created_at<b.created_at?1:-1),
        surprises: db.surprises.filter(x=>x.from_user===me()),
        forMe: db.surprises.filter(x=>x.to_user===me()&&(x.revealed_at||x.save_date_at)).map(x=>{ const t=db.trips.find(y=>y.id===x.trip_id)||{}, pf=db.profiles.find(y=>y.id===x.from_user)||{};
          return { trip_id:x.trip_id, from_user:x.from_user, from_name:pf.name, place:x.revealed_at?t.place:null, kind:x.revealed_at?t.kind:null, trip_type:t.trip_type||'holiday', start_date:t.start_date, nights:t.nights, hint:x.hint||'', save_date_at:x.save_date_at||null, revealed_at:x.revealed_at||null }; })
      }));
    },
    async saveProfile(uid, f){ need(); await wait(); const p = db.profiles.find(x=>x.id===uid); Object.assign(p, f); save(); },
    async createTrip(trip, parts){
      need(); await wait();
      const t = { id:uuid(), kind:null, partner_name:'', ...trip, invite_code:Math.random().toString(36).slice(2,8).toUpperCase(), created_by:me(), created_at:now() };
      db.trips.push(t); db.trip_members.push({ trip_id:t.id, user_id:me(), joined_at:now() });
      parts.forEach((p,i)=>db.parts.push({ id:uuid(), owner:null, for_partner:false, method:'pot', freq:'week', amount:0, into_label:'', checks:true, schedule_from:new Date().toISOString().slice(0,10), ...p, trip_id:t.id, position:i, created_at:now() }));
      save(); return t;
    },
    async updateTrip(id, f){ need(); await wait(); if(!memberOf(id)) throw new Error('Not allowed'); Object.assign(db.trips.find(t=>t.id===id), f); save(); },
    async deleteTrip(id){ need(); await wait(); const t=db.trips.find(x=>x.id===id); if(!t||t.created_by!==me()) throw new Error('Only the person who made the trip can delete it');
      for(const k of ['trip_members','parts','logs','check_replies','activity']) db[k]=db[k].filter(r=>r.trip_id!==id); db.trips=db.trips.filter(x=>x.id!==id); save(); },
    async leaveTrip(id, uid){ need(); await wait(); db.trip_members=db.trip_members.filter(m=>!(m.trip_id===id&&m.user_id===uid)); save(); },
    async updatePart(id, f){ need(); await wait(); const p=db.parts.find(x=>x.id===id); if(!p||!memberOf(p.trip_id)) throw new Error('Not allowed'); Object.assign(p,f); save(); },
    async addPart(p){ need(); await wait(); const row={ id:uuid(), owner:null, for_partner:false, method:'pot', freq:'week', amount:0, into_label:'', checks:true, schedule_from:new Date().toISOString().slice(0,10), position:99, created_at:now(), ...p }; db.parts.push(row); save(); return row; },
    async deletePart(id){ need(); await wait(); db.parts=db.parts.filter(p=>p.id!==id); db.logs=db.logs.filter(l=>l.part_id!==id); save(); },
    async addLog(row){ need(); await wait(); if(!memberOf(row.trip_id)) throw new Error('Not allowed'); const r={ id:uuid(), user_id:me(), check_date:null, created_at:now(), ...row }; db.logs.push(r); save(); return r; },
    async deleteLog(id){ need(); await wait(); db.logs=db.logs.filter(l=>l.id!==id); save(); },
    async setSurprise(trip_id, f){ need(); await wait(); let r=db.surprises.find(x=>x.trip_id===trip_id); if(!r){ r={ trip_id, from_user:me(), to_user:null, hint:'', save_date_at:null, revealed_at:null, created_at:now() }; db.surprises.push(r); } Object.assign(r,f); save(); },
    async updateLog(id, f){ need(); await wait(); const l=db.logs.find(x=>x.id===id); if(l) Object.assign(l,f); save(); },
    async addActivity(trip_id, kind, data){ need(); await wait(); const r={ id:uuid(), trip_id, user_id:me(), kind, data, created_at:now() }; db.activity.push(r); save(); return r; },
    async deleteActivity(id){ need(); await wait(); db.activity=db.activity.filter(a=>a.id!==id); save(); },
    async reply(trip_id, part_id, due_date, reply){ need(); await wait(); db.check_replies=db.check_replies.filter(r=>!(r.part_id===part_id&&r.due_date===due_date)); db.check_replies.push({ trip_id, part_id, due_date, reply, user_id:me(), created_at:now() }); save(); },
    async deleteReply(part_id, due_date){ need(); await wait(); db.check_replies=db.check_replies.filter(r=>!(r.part_id===part_id&&r.due_date===due_date)); save(); },
    async join(code){
      need(); await wait(); const t=db.trips.find(x=>x.invite_code===String(code).trim().toUpperCase()); if(!t) throw new Error('That code doesn’t match a trip');
      if(!memberOf(t.id)){ db.trip_members.push({ trip_id:t.id, user_id:me(), joined_at:now() }); db.parts.forEach(p=>{ if(p.trip_id===t.id&&p.for_partner){ p.owner=me(); p.for_partner=false; } }); db.activity.push({ id:uuid(), trip_id:t.id, user_id:me(), kind:'joined', data:{}, created_at:now() }); save(); }
      return t.id;
    },
    async invitePreview(code){ await wait(); const t=db.trips.find(x=>x.invite_code===String(code).trim().toUpperCase()); if(!t) return null; const p=db.profiles.find(x=>x.id===t.created_by); return { place:t.place, start_date:t.start_date, from:p?p.name:'' }; },
    /* preview-only helpers */
    _users(){ return db.users.map(u=>({ ...u, name:(db.profiles.find(p=>p.id===u.id)||{}).name })); },
    _switch(id){ db.session=id; save(); },
    _wipe(){ localStorage.removeItem(KEY); }
  };
}

window.bagsyApi = PREVIEW ? previewApi() : realApi();
})();
