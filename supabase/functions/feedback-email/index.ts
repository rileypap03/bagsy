// Emails Paul when someone sends feedback from the You tab.
// Called by a Supabase database webhook on INSERT into public.feedback.
// Secrets: BREVO_API_KEY (Brevo → SMTP & API → API keys). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
const TO = 'rileypap03@gmail.com';
const FROM = { name: 'Bagsy', email: 'rileypap03@gmail.com' };

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const r = payload?.record;
    if (payload?.table !== 'feedback' || !r?.body) return new Response('ignored', { status: 200 });

    const url = Deno.env.get('SUPABASE_URL')!, key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const h = { apikey: key, Authorization: `Bearer ${key}` };
    let name = 'Someone', email = '';
    try {
      const p = await (await fetch(`${url}/rest/v1/profiles?id=eq.${r.user_id}&select=name`, { headers: h })).json();
      if (p?.[0]?.name) name = p[0].name;
      const u = await (await fetch(`${url}/auth/v1/admin/users/${r.user_id}`, { headers: h })).json();
      if (u?.email) email = u.email;
    } catch (_) { /* send anyway */ }

    const kind = (String(r.body).match(/^(Something’s confusing|Something’s broken|An idea): /) || [])[1] || 'Feedback';
    const text = String(r.body).replace(/^(Something’s confusing|Something’s broken|An idea): /, '');
    const when = new Date(r.created_at || Date.now()).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' });

    const html = `<div style="font-family:-apple-system,Segoe UI,Inter,sans-serif;max-width:520px;color:#111214">
<p style="margin:0 0 4px;color:#5E636A;font-size:13px">${esc(kind)} · ${esc(when)}</p>
<h2 style="margin:0 0 16px;font-size:20px">${esc(name)} sent feedback</h2>
<div style="background:#F1F3F2;border-radius:12px;padding:16px;font-size:16px;line-height:1.5;white-space:pre-wrap">${esc(text)}</div>
<p style="margin:16px 0 0;color:#5E636A;font-size:13px">${esc(email)}${email ? ' · ' : ''}${esc(r.device || '')} · version ${esc(r.version || '?')}</p>
</div>`;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': Deno.env.get('BREVO_API_KEY')!, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: FROM, to: [{ email: TO, name: 'Paul' }],
        ...(email ? { replyTo: { email, name } } : {}),
        subject: `Bagsy feedback from ${name}: ${kind}`,
        htmlContent: html,
      }),
    });
    if (!res.ok) return new Response(`brevo ${res.status}: ${await res.text()}`, { status: 502 });
    return new Response('sent', { status: 200 });
  } catch (e) {
    return new Response(`error: ${e}`, { status: 500 });
  }
});
