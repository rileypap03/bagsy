/* Bagsy data layer. Real: Supabase. Preview: a fake backend in this browser, used when config.js has no Supabase URL. */
(function(){
const cfg = window.BAGSY_CONFIG || {};
const PREVIEW = !cfg.supabaseUrl;

/* ---------- real backend ---------- */
function realApi(){
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false, storageKey:'bagsy-auth' } });
  const ok = ({data,error}) => { if(error) throw error; return data; };
  return {
    preview:false,
    async session(){ const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null; },
    async sendCode(email){ ok(await sb.auth.signInWithOtp({ email, options:{ shouldCreateUser:true } })); },
    async verify(email, token){ const d = ok(await sb.auth.verifyOtp({ email, token, type:'email' })); return d.user; },
    async signOut(){ await sb.auth.signOut(); },
    async load(uid){
      const [profiles, trips, members, parts, logs, replies, activity] = await Promise.all([
        sb.from('profiles').select('*'), sb.from('trips').select('*').order('start_date'), sb.from('trip_members').select('*'),
        sb.from('parts').select('*').order('position'), sb.from('logs').select('*').order('created_at'),
        sb.from('check_replies').select('*'), sb.from('activity').select('*').order('created_at',{ascending:false}).limit(200)
      ].map(p=>p.then(ok)));
      return { profiles, trips, members, parts, logs, replies, activity };
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
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} };
  const me = () => db.session;
  const memberOf = t => db.trip_members.some(m=>m.trip_id===t && m.user_id===me());
  const wait = (v) => new Promise(r=>setTimeout(()=>r(v), 120));
  const need = () => { if(!me()) throw new Error('Not signed in'); };
  return {
    preview:true,
    async session(){ return wait(me() ? { id:me(), email:(db.users.find(u=>u.id===me())||{}).email } : null); },
    async sendCode(email){ await wait(); db.pendingEmail = email.toLowerCase(); save(); },
    async verify(email, token){
      await wait();
      if(String(token).trim() !== '123456') throw new Error('That code isn’t right. In preview mode the code is always 123456.');
      email = email.toLowerCase(); let u = db.users.find(x=>x.email===email);
      if(!u){ u = { id:uuid(), email }; db.users.push(u); db.profiles.push({ id:u.id, name:'', avatar:null, created_at:now() }); }
      db.session = u.id; save(); return { id:u.id, email };
    },
    async signOut(){ db.session = null; save(); },
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
        activity: db.activity.filter(inTrip).sort((a,b)=>a.created_at<b.created_at?1:-1)
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
