-- Bagsy update, 21 Nov 2026: push notifications and deposits.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- Before running: replace PUSH_SECRET_HERE with the same PUSH_SECRET you set on the "push" Edge Function.

-- ---------- deposits (e.g. package holidays: pay a deposit first, the balance later) ----------
alter table public.parts add column if not exists deposit numeric(10,2) not null default 0;
alter table public.parts add column if not exists deposit_due date;

-- ---------- notification settings per person ----------
alter table public.profiles add column if not exists notify jsonb not null default '{"checks":true,"partner":true,"behind":true}';

-- ---------- each phone that has said yes to notifications ----------
create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "own phones" on public.push_subs;
create policy "own phones" on public.push_subs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subs to authenticated;

-- reminders already sent, so nobody gets the same one twice (only the server reads this)
create table if not exists public.push_sent (key text primary key, sent_at timestamptz not null default now());
alter table public.push_sent enable row level security;
revoke all on public.push_sent from anon, authenticated;

-- ---------- where the push function lives, and its password ----------
create extension if not exists pg_net;
create extension if not exists pg_cron;
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'bagsy_push_url') then
    perform vault.create_secret('https://ukhqvahpbrymcyqnpiqr.supabase.co/functions/v1/push', 'bagsy_push_url'); end if;
  if not exists (select 1 from vault.secrets where name = 'bagsy_push_secret') then
    perform vault.create_secret('PUSH_SECRET_HERE', 'bagsy_push_secret'); end if;
end $$;

create or replace function public.call_push(payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare u text; s text;
begin
  select decrypted_secret into u from vault.decrypted_secrets where name = 'bagsy_push_url';
  select decrypted_secret into s from vault.decrypted_secrets where name = 'bagsy_push_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(url := u, body := payload,
    headers := jsonb_build_object('Content-Type','application/json','x-bagsy-secret', s),
    timeout_milliseconds := 20000);
end $$;
revoke execute on function public.call_push(jsonb) from public, anon, authenticated;

-- when someone logs a saving, pays a part in full or joins, tell the others on the trip
create or replace function public.push_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind in ('log','packed','joined') then
    begin perform public.call_push(jsonb_build_object('type','activity','record', to_jsonb(new)));
    exception when others then null; end;   -- a notification problem never stops a saving being logged
  end if;
  return new;
end $$;
drop trigger if exists on_activity_push on public.activity;
create trigger on_activity_push after insert on public.activity for each row execute function public.push_activity();

-- every day at 9am UK winter time / 10am summer time: payday checks, deposits due, and (Sundays) anything behind
select cron.unschedule('bagsy-daily-push') where exists (select 1 from cron.job where jobname = 'bagsy-daily-push');
select cron.schedule('bagsy-daily-push', '0 9 * * *', $$ select public.call_push('{"type":"daily"}'::jsonb) $$);
