// Bagsy push notifications (Supabase Edge Function "push").
// Sends web push to people's phones. Bagsy never moves money: these are only reminders.
//
// Called three ways:
//   1. by the database when someone logs a saving / joins / pays a part in full   {type:'activity', record}
//   2. once a day by the database's scheduler (payday checks, things running behind, deposits due) {type:'daily'}
//   3. from the app's "Send a test" button, signed in                                  {type:'test'}
// 1 and 2 carry the x-bagsy-secret header. 3 carries the person's own sign-in token.
//
// Secrets to set in Supabase → Edge Functions → Secrets:
//   VAPID_PUBLIC, VAPID_PRIVATE, PUSH_SECRET   (SUPABASE_URL and the service key are provided automatically)
// Deploy with "Verify JWT" switched OFF (this function checks its own callers).

const env = (k: string) => (typeof Deno !== 'undefined' ? Deno.env.get(k) : (globalThis as any).process?.env?.[k]) || '';
const APP = 'https://rileypap03.github.io/bagsy/';

/* ---------- base64url ---------- */
export const b64u = {
  enc(buf: ArrayBuffer | Uint8Array) { const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(s: string) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const r = atob(s); const out = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) out[i] = r.charCodeAt(i); return out; },
};
const te = new TextEncoder();
const cat = (...a: Uint8Array[]) => { const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let o = 0; for (const x of a) { out.set(x, o); o += x.length; } return out; };

/* ---------- VAPID (who's sending) ---------- */
export async function vapidAuth(endpoint: string, pub: string, priv: string, subject: string) {
  const p = b64u.dec(pub); // 65 bytes: 0x04 || x || y
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: b64u.enc(p.slice(1, 33)), y: b64u.enc(p.slice(33, 65)), d: priv, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u.enc(te.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body));
  return `vapid t=${head}.${body}.${b64u.enc(sig)}, k=${pub}`;
}

/* ---------- payload encryption (RFC 8291, aes128gcm) ---------- */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
export async function encrypt(payload: string, p256dh: string, auth: string) {
  const ua = b64u.dec(p256dh), secret = b64u.dec(auth);
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey } as any, as.privateKey, 256));
  const ikm = await hkdf(secret, shared, cat(te.encode('WebPush: info\0'), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, cat(te.encode(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // record size 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, msg: unknown) {
  const body = await encrypt(JSON.stringify(msg), sub.p256dh, sub.auth);
  const r = await fetch(sub.endpoint, { method: 'POST', body, headers: {
    Authorization: await vapidAuth(sub.endpoint, env('VAPID_PUBLIC'), env('VAPID_PRIVATE'), APP),
    'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'normal' } });
  return r.status;
}

/* ---------- database (service key, so it sees everyone's rows) ---------- */
function serviceKey() {
  const k = env('SUPABASE_SERVICE_ROLE_KEY'); if (k) return k;
  try { const j = JSON.parse(env('SUPABASE_SECRET_KEYS')); return j.default || Object.values(j)[0]; } catch (_) { return ''; }
}
async function db(path: string, init: RequestInit = {}) {
  const key = serviceKey() as string;
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json', ...(init.headers as any || {}) };
  if (!key.startsWith('sb_')) headers.Authorization = 'Bearer ' + key;
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/' + path, { ...init, headers });
  if (!r.ok) throw new Error(path + ' → ' + r.status + ' ' + await r.text());
  return r.status === 204 ? null : r.json();
}
const inList = (ids: string[]) => '(' + ids.map(encodeURIComponent).join(',') + ')';

/* send to everyone's phones for one person, if they want this kind of message */
async function toPerson(uid: string, pref: string, msg: Record<string, unknown>, profiles?: Record<string, any>) {
  const prof = profiles?.[uid] || (await db(`profiles?id=eq.${uid}&select=notify`))[0];
  const want = { checks: true, partner: true, behind: true, ...((prof && prof.notify) || {}) };
  if (pref && want[pref as keyof typeof want] === false) return 0;
  const subs = await db(`push_subs?user_id=eq.${uid}&select=endpoint,p256dh,auth`);
  let n = 0;
  for (const s of subs) {
    try {
      const st = await sendPush(s, msg);
      if (st === 404 || st === 410) await db(`push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
      else if (st < 300) n++;
      else console.log('push refused', st, s.endpoint.slice(0, 40));
    } catch (e) { console.log('push failed', String(e)); }
  }
  return n;
}
/* only send each reminder once */
async function once(key: string) {
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/push_sent', { method: 'POST', body: JSON.stringify({ key }),
    headers: { apikey: serviceKey() as string, ...(String(serviceKey()).startsWith('sb_') ? {} : { Authorization: 'Bearer ' + serviceKey() }), 'Content-Type': 'application/json', Prefer: 'return=minimal' } });
  return r.status === 201; // 409 = already sent
}

/* ---------- dates and money (same rules as the app) ---------- */
const DAY = 864e5;
const D = (s: string) => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmt = (d: Date, day = true) => (day ? DN[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + ' ' + MN[d.getUTCMonth()];
const money = (n: number) => { n = +n || 0; return '£' + (Math.abs(n - Math.round(n)) < .005 ? Math.round(n).toLocaleString('en-GB') : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
const nextFridayAfter = (d: Date) => { const x = addDays(d, 1); while (x.getUTCDay() !== 5) x.setUTCDate(x.getUTCDate() + 1); return x; };
function firstPay(freq: string, from: Date) { if (freq === 'month') { const x = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 27)); if (x <= from) x.setUTCMonth(x.getUTCMonth() + 1); return x; } return nextFridayAfter(from); }
function stepPay(freq: string, d: Date) { const x = new Date(d); if (freq === 'month') x.setUTCMonth(x.getUTCMonth() + 1); else x.setUTCDate(x.getUTCDate() + (freq === 'week' ? 7 : 14)); return x; }
function payCount(freq: string, due: string, today: Date) { let n = 0, d = firstPay(freq, today); const end = D(due); while (d < end && n < 400) { n++; d = stepPay(freq, d); } return n; }
const weeksTo = (s: string, today: Date) => Math.max(0, Math.floor((D(s).getTime() - today.getTime()) / (7 * DAY)));
const londonToday = () => { const s = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); return D(s); };

/* ---------- 1. something happened on a trip ---------- */
async function onActivity(rec: any) {
  if (!['log', 'packed', 'joined'].includes(rec.kind)) return { skipped: rec.kind };
  // wait a moment so an Undo in the app cancels the message
  await new Promise(r => setTimeout(r, 9000));
  const still = await db(`activity?id=eq.${rec.id}&select=id`);
  if (!still.length) return { undone: true };
  const [trip] = await db(`trips?id=eq.${rec.trip_id}&select=id,place`);
  const members: { user_id: string }[] = await db(`trip_members?trip_id=eq.${rec.trip_id}&select=user_id`);
  const ids = members.map(m => m.user_id);
  const profs: any[] = ids.length ? await db(`profiles?id=in.${inList(ids)}&select=id,name,notify`) : [];
  const P: Record<string, any> = Object.fromEntries(profs.map(p => [p.id, p]));
  const who = (P[rec.user_id] && P[rec.user_id].name) || 'Your partner', d = rec.data || {};
  let sent = 0;
  for (const uid of ids) {
    if (uid === rec.user_id) continue;
    let title = '', body = '';
    if (rec.kind === 'log') { title = `${who} put ${money(d.amount)} into ${d.owner === uid ? 'your ' : ''}${d.part}`; body = `${trip.place} · now ${money(d.saved)} of ${money(d.cost)}${d.saved >= d.cost ? '. Packed!' : ''}`; }
    if (rec.kind === 'packed') { title = `${d.part} is packed`; body = `${who} paid ${money(d.amount)} in full · ${trip.place}`; }
    if (rec.kind === 'joined') { title = `${who} joined ${trip.place}`; body = 'The parts you set aside for them are theirs now.'; }
    sent += await toPerson(uid, 'partner', { title, body, url: APP + '?trip=' + trip.id, tag: 'act-' + rec.id }, P);
  }
  return { sent };
}

/* ---------- 2. the daily round ---------- */
async function daily() {
  const today = londonToday(), monday = today.getUTCDay() === 1, sunday = today.getUTCDay() === 0;
  const parts: any[] = await db('parts?owner=not.is.null&select=id,trip_id,name,cost,owner,due,method,freq,amount,into_label,checks,schedule_from,deposit,deposit_due,created_at');
  if (!parts.length) return { sent: 0 };
  const trips: any[] = await db(`trips?select=id,place,start_date,nights`);
  const T: Record<string, any> = Object.fromEntries(trips.map(t => [t.id, t]));
  const logs: any[] = await db('logs?select=part_id,amount');
  const saved: Record<string, number> = {}; for (const l of logs) saved[l.part_id] = (saved[l.part_id] || 0) + (+l.amount);
  const replies: any[] = await db('check_replies?select=part_id,due_date,reply,created_at');
  const owners = [...new Set(parts.map(p => p.owner))];
  const profs: any[] = await db(`profiles?id=in.${inList(owners)}&select=id,name,notify`);
  const P: Record<string, any> = Object.fromEntries(profs.map(p => [p.id, p]));
  let sent = 0;
  for (const p of parts) {
    const t = T[p.trip_id]; if (!t) continue;
    const tripEnd = addDays(D(t.start_date), t.nights); if (tripEnd < today) continue;
    const cost = +p.cost, sv = saved[p.id] || 0, rem = cost - sv, amt = +p.amount; if (rem <= 0) continue;
    const url = APP + '?trip=' + t.id;

    // payday: "Did £x go in?"
    if ((p.method === 'pot' || p.method === 'account') && p.checks && amt > 0) {
      let d = firstPay(p.freq, D(p.schedule_from)), last: Date | null = null; while (d <= today) { last = d; d = stepPay(p.freq, d); }
      if (last && (today.getTime() - last.getTime()) / DAY <= 21) {
        const due = iso(last), r = replies.find(x => x.part_id === p.id && x.due_date === due);
        const msg = { title: `Did ${money(Math.min(amt, rem))} go in?`, body: `${p.name} · ${t.place}${p.into_label ? ' · ' + p.into_label : ''}. Tap to confirm.`, url: APP + '?tab=activity', tag: 'check-' + p.id };
        if (!r && due === iso(today) && await once(`check:${p.id}:${due}`)) sent += await toPerson(p.owner, 'checks', msg, P);
        if (r && r.reply === 'notyet' && monday && await once(`again:${p.id}:${due}:${iso(today)}`)) sent += await toPerson(p.owner, 'checks', msg, P);
      }
    }

    // deposit due within a week and not covered yet
    const dep = +p.deposit || 0;
    if (dep > 0 && p.deposit_due && sv < dep) {
      const days = Math.round((D(p.deposit_due).getTime() - today.getTime()) / DAY);
      if ((days === 7 || days === 1) && await once(`deposit:${p.id}:${p.deposit_due}:${days}`))
        sent += await toPerson(p.owner, 'behind', { title: `${p.name} deposit due ${days === 1 ? 'tomorrow' : fmt(D(p.deposit_due))}`, body: `${money(dep - sv)} still to save for the ${money(dep)} deposit · ${t.place}`, url, tag: 'dep-' + p.id }, P);
    }

    // running behind: Sunday evening round-up, at most once a fortnight per part
    if (sunday) {
      let behind = false, pace = 0;
      if (p.method === 'pot' || p.method === 'account') { const planned = amt * payCount(p.freq, p.due, today); behind = planned < rem; pace = Math.ceil(rem / Math.max(1, weeksTo(p.due, today))); }
      if (p.method === 'adhoc') { const st = D(p.created_at), span = Math.max(1, (D(p.due).getTime() - st.getTime()) / (7 * DAY)), el = (today.getTime() - st.getTime()) / (7 * DAY); behind = el >= 2 && sv < cost * Math.min(1, el / span) - cost * .05; pace = Math.ceil(rem / Math.max(1, weeksTo(p.due, today))); }
      const fortnight = Math.floor(today.getTime() / (14 * DAY));
      if (behind && await once(`behind:${p.id}:${fortnight}`))
        sent += await toPerson(p.owner, 'behind', { title: `${p.name} is behind`, body: `${money(pace)} a week from now gets it there by ${fmt(D(p.due), false)} · ${t.place}`, url, tag: 'behind-' + p.id }, P);
    }
  }
  return { sent };
}

/* ---------- 3. a test from the app ---------- */
async function test(req: Request) {
  const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_ANON_KEY') || (serviceKey() as string), Authorization: 'Bearer ' + tok } });
  if (!r.ok) return { error: 'Not signed in' };
  const u = await r.json();
  return { sent: await toPerson(u.id, '', { title: 'Bagsy notifications are on', body: 'You’ll hear about payday checks, your partner’s savings and anything running behind.', url: APP, tag: 'test' }) };
}

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.type === 'test') return json(await test(req));
    if (!env('PUSH_SECRET') || req.headers.get('x-bagsy-secret') !== env('PUSH_SECRET')) return json({ error: 'Not allowed' }, 401);
    if (body.type === 'activity') {
      const work = onActivity(body.record).catch(e => console.log('activity push failed', String(e)));
      // answer the database straight away and finish the work in the background
      // @ts-ignore EdgeRuntime is provided by Supabase
      if (typeof EdgeRuntime !== 'undefined') { EdgeRuntime.waitUntil(work); return json({ queued: true }, 202); }
      return json(await work);
    }
    if (body.type === 'daily') return json(await daily());
    return json({ error: 'Unknown request' }, 400);
  } catch (e) { console.log(String(e)); return json({ error: String(e) }, 500); }
}

if (typeof Deno !== 'undefined') Deno.serve(handler);
