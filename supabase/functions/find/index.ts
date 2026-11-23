// Bagsy holiday finder (Supabase Edge Function "find").
// "Winter sun in February, £600 each, from London": an AI model suggests places that fit, real flight prices
// come from Travelpayouts (Aviasales data), and the function adds them up per person and keeps the ones in budget.
// Bagsy never books or moves money: each idea links out to the provider to check and book.
//
// Secrets (Edge Functions → Secrets): ANTHROPIC_API_KEY, TRAVELPAYOUTS_TOKEN, optional TRAVELPAYOUTS_MARKER.
// Only signed-in Bagsy users can call it (it checks the caller's sign-in itself, so "Verify JWT" can be on or off).

const env = (k: string) => Deno.env.get(k) || '';
const MODEL = 'claude-sonnet-5-5';
const KINDS = ['coast', 'city', 'mountains', 'countryside', 'tropical', 'desert', 'snow', 'lakes'];
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Ask = { vibe: string; month: string; nights: number; origin: string; originName: string; budget: number; people: number; notes?: string; debug?: boolean };
type Cand = { place: string; country: string; iata: string; kind: string; why: string; weather: string; stay_night: number; daily_pp: number; flight_pp_estimate: number };

/* ---------- who's asking ---------- */
async function signedIn(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: auth } });
  return r.ok;
}

/* ---------- the AI: places that fit, with ballpark costs ---------- */
async function candidates(a: Ask): Promise<Cand[]> {
  const [y, m] = a.month.split('-').map(Number);
  const prompt = `A ${a.people === 1 ? 'solo traveller' : 'couple'} from the UK wants a trip.
What they want: ${a.vibe}${a.notes ? `. Also: ${a.notes}` : ''}.
When: ${MN[m - 1]} ${y}, ${a.nights} nights.
Flying from: ${a.originName} (${a.origin}).
Budget: £${a.budget} per person, all in (return flights, ${a.people === 1 ? 'a room' : 'their half of a double room'}, food and spending money).

Suggest 8 destinations that genuinely suit this in ${MN[m - 1]} (weather, season, what's open), reachable from ${a.originName} with direct or simple flights, and likely to fit the budget. Mix well-known picks with one or two less obvious ones. Avoid places with UK government advice against travel.

For each give realistic ${y} prices in GBP: a mid-range double room per night, food and spending money per person per day (casual meals, a drink, a little sightseeing), and your best guess for a return economy flight per person in that month.
Use the IATA code of the main airport or city that UK flights actually go to.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 3000,
      tools: [{
        name: 'ideas', description: 'Return the destination ideas.',
        input_schema: {
          type: 'object', required: ['ideas'], properties: {
            ideas: {
              type: 'array', items: {
                type: 'object', required: ['place', 'country', 'iata', 'kind', 'why', 'weather', 'stay_night', 'daily_pp', 'flight_pp_estimate'], properties: {
                  place: { type: 'string', description: 'Town, city or island people would recognise, e.g. "Tenerife" or "Seville"' },
                  country: { type: 'string' },
                  iata: { type: 'string', description: 'Three-letter IATA code of the arrival airport or city' },
                  kind: { type: 'string', enum: KINDS, description: 'Which picture fits best. coast: sea, harbours, beaches in Europe. tropical: palms, warm islands (Canaries, Caribbean, Asia). desert: Morocco, Egypt, Dubai, Jordan. city: city breaks. mountains: snowy alpine peaks, so only for cold mountain places. snow: skiing and winter wonderland. countryside: green hills, vineyards, rural. lakes: lakeside places.' },
                  why: { type: 'string', description: 'One short, specific line on why it suits them, max 90 characters, no hype' },
                  weather: { type: 'string', description: 'Typical weather that month, e.g. "22°C, mostly sunny"' },
                  stay_night: { type: 'number', description: 'Mid-range double room per night, GBP' },
                  daily_pp: { type: 'number', description: 'Food and spending per person per day, GBP' },
                  flight_pp_estimate: { type: 'number', description: 'Return economy flight per person, GBP' },
                },
              },
            },
          },
        },
      }],
      tool_choice: { type: 'tool', name: 'ideas' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('AI: ' + (j?.error?.message || r.status));
  const out = (j.content || []).find((c: any) => c.type === 'tool_use')?.input?.ideas || [];
  return out.filter((c: Cand) => /^[A-Z]{3}$/.test(String(c.iata || '').toUpperCase())).map((c: Cand) => ({ ...c, iata: c.iata.toUpperCase(), kind: KINDS.includes(c.kind) ? c.kind : 'coast' }));
}

/* ---------- real flight prices (Travelpayouts / Aviasales data, cached from recent searches) ---------- */
const nightsBetween = (a: string, b: string) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 864e5);
const nextMonth = (ym: string) => { const [y, m] = ym.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; };

async function flights(a: Ask, dest: string, raw: Record<string, unknown>) {
  const token = env('TRAVELPAYOUTS_TOKEN'); if (!token) return null;
  const q = (ret: string) => {
    const u = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
    u.search = new URLSearchParams({ origin: a.origin, destination: dest, departure_at: a.month, return_at: ret, one_way: 'false', currency: 'gbp', sorting: 'price', limit: '100', market: 'uk' }).toString();
    return fetch(u, { headers: { 'X-Access-Token': token } }).then(r => r.json()).catch(e => ({ error: String(e) }));
  };
  const res = await Promise.all([q(a.month), q(nextMonth(a.month))]);
  if (a.debug) raw[dest] = res;
  const all = res.flatMap((x: any) => Array.isArray(x?.data) ? x.data : []).filter((f: any) => f.departure_at && f.return_at && f.price > 0 && f.departure_at.slice(0, 7) === a.month);
  if (!all.length) return null;
  // closest trip length first, then price; accept within 2 nights of what they asked for
  const fit = all.map((f: any) => ({ f, gap: Math.abs(nightsBetween(f.departure_at, f.return_at) - a.nights) })).filter(x => x.gap <= 2)
    .sort((x, y) => x.gap - y.gap || x.f.price - y.f.price);
  const best = (fit[0] || null)?.f; if (!best) return null;
  const marker = env('TRAVELPAYOUTS_MARKER');
  let link = '';
  if (best.link) { link = 'https://www.aviasales.com' + (best.link.startsWith('/') ? '' : '/') + best.link; if (marker) link += (link.includes('?') ? '&' : '?') + 'marker=' + encodeURIComponent(marker); }
  return { price: Math.round(best.price), depart: best.departure_at.slice(0, 10), back: best.return_at.slice(0, 10), nights: nightsBetween(best.departure_at, best.return_at), direct: !best.transfers && !best.return_transfers, airline: best.airline || '', link };
}

/* ---------- glue ---------- */
function firstFriday(ym: string) { const d = new Date(ym + '-01T00:00:00Z'); while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function searchLink(a: Ask, dest: string, depart: string, nights: number) {
  // Aviasales search URL: ORIGIN + DDMM + DEST + DDMM(return) + passengers
  const d = new Date(depart + 'T00:00:00Z'), b = new Date(d.getTime() + nights * 864e5);
  const dm = (x: Date) => String(x.getUTCDate()).padStart(2, '0') + String(x.getUTCMonth() + 1).padStart(2, '0');
  const marker = env('TRAVELPAYOUTS_MARKER');
  return `https://www.aviasales.com/search/${a.origin}${dm(d)}${dest}${dm(b)}${a.people}` + (marker ? `?marker=${encodeURIComponent(marker)}` : '');
}

export async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!(await signedIn(req))) return json({ error: 'Sign in to Bagsy first.' }, 401);
    if (!env('ANTHROPIC_API_KEY')) return json({ error: 'The finder isn’t set up yet (no AI key).' }, 500);
    const b = await req.json().catch(() => ({}));
    const a: Ask = {
      vibe: String(b.vibe || 'somewhere warm').slice(0, 120),
      month: /^\d{4}-\d{2}$/.test(b.month) ? b.month : new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 7),
      nights: Math.min(21, Math.max(1, Math.round(+b.nights || 7))),
      origin: /^[A-Z]{3}$/.test(String(b.origin || '').toUpperCase()) ? String(b.origin).toUpperCase() : 'LON',
      originName: String(b.originName || b.origin || 'London').slice(0, 40),
      budget: Math.min(20000, Math.max(50, Math.round(+b.budget || 600))),
      people: Math.min(4, Math.max(1, Math.round(+b.people || 2))),
      notes: String(b.notes || '').slice(0, 200),
      debug: !!b.debug,
    };
    const cands = await candidates(a);
    const raw: Record<string, unknown> = {};
    const priced = await Promise.all(cands.map(async c => {
      const f = await flights(a, c.iata, raw).catch(() => null);
      const nights = f ? f.nights : a.nights;
      const flight = f ? f.price : Math.round(c.flight_pp_estimate);
      const stayPP = Math.round(c.stay_night * nights / (a.people === 1 ? 1 : 2));
      const foodPP = Math.round(c.daily_pp * nights);
      const total = flight + stayPP + foodPP;
      const depart = f ? f.depart : firstFriday(a.month);
      return {
        place: c.place, country: c.country, iata: c.iata, kind: c.kind, why: c.why, weather: c.weather,
        start: depart, nights,
        flight: { pp: flight, live: !!f, direct: f ? f.direct : null, airline: f ? f.airline : '', link: f && f.link ? f.link : searchLink(a, c.iata, depart, nights) },
        stay: { night: Math.round(c.stay_night), pp: stayPP },
        spend: { daily: Math.round(c.daily_pp), pp: foodPP },
        total, over: Math.max(0, total - a.budget),
      };
    }));
    // in budget first (live prices before estimates), then the nearest misses
    const ok = priced.filter(p => !p.over).sort((x, y) => Number(y.flight.live) - Number(x.flight.live) || y.total - x.total);
    const near = priced.filter(p => p.over).sort((x, y) => x.over - y.over);
    const ideas = [...ok.slice(0, 5), ...near].slice(0, 5);
    return json({ ideas, asked: a, inBudget: ok.length, ...(a.debug ? { candidates: cands, raw } : {}) });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || 'Something went wrong' }, 500);
  }
}

Deno.serve(handler);
