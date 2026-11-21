-- Bagsy update, 21 Nov 2026 (evening): short breaks and surprise trips.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once. Nothing to fill in.

-- ---------- trip type: a holiday or a short break ----------
alter table public.trips add column if not exists trip_type text not null default 'holiday';
alter table public.trips add column if not exists surprise boolean not null default false;

-- ---------- surprises ----------
-- The trip itself stays private to the person planning it (they're its only member).
-- This row says who it's for and what they've been told. The person it's for never reads this table directly:
-- they get my_surprises() below, which only ever hands over the dates, the hint and, after the reveal, the place.
create table if not exists public.surprises (
  trip_id uuid primary key references public.trips on delete cascade,
  from_user uuid not null default auth.uid() references auth.users on delete cascade,
  to_user uuid references auth.users on delete set null,
  hint text not null default '',
  save_date_at timestamptz,
  revealed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.surprises enable row level security;

-- you can only send a surprise to someone you already share a trip with
create or replace function public.shares_trip_with(other uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from trip_members a join trip_members b on a.trip_id = b.trip_id
                 where a.user_id = auth.uid() and b.user_id = other)
$$;
revoke execute on function public.shares_trip_with(uuid) from public, anon;
grant execute on function public.shares_trip_with(uuid) to authenticated;

drop policy if exists "planner manages surprise" on public.surprises;
create policy "planner manages surprise" on public.surprises for all
  using (from_user = auth.uid())
  with check (from_user = auth.uid() and public.is_member(trip_id) and (to_user is null or public.shares_trip_with(to_user)));
grant select, insert, update, delete on public.surprises to authenticated;
grant select, insert, update, delete on public.surprises to service_role;

-- what the person a surprise is for can see: dates (once a save-the-date or the reveal is sent),
-- the hint, and the place and scene only after the reveal. Never the parts or the money.
drop function if exists public.my_surprises();
create function public.my_surprises()
returns table (trip_id uuid, from_user uuid, from_name text, place text, kind text, trip_type text,
               start_date date, nights int, hint text, save_date_at timestamptz, revealed_at timestamptz)
language sql security definer stable set search_path = public as $$
  select s.trip_id, s.from_user, p.name,
         case when s.revealed_at is not null then t.place end,
         case when s.revealed_at is not null then t.kind end,
         t.trip_type, t.start_date, t.nights, s.hint, s.save_date_at, s.revealed_at
  from surprises s join trips t on t.id = s.trip_id left join profiles p on p.id = s.from_user
  where s.to_user = auth.uid() and (s.revealed_at is not null or s.save_date_at is not null)
$$;
revoke execute on function public.my_surprises() from public, anon;
grant execute on function public.my_surprises() to authenticated;

-- tell the person it's for when a save-the-date or the reveal goes out
create or replace function public.push_surprise() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev text;
begin
  if new.to_user is null then return new; end if;
  if new.revealed_at is not null and (tg_op = 'INSERT' or old.revealed_at is null) then ev := 'reveal';
  elsif new.save_date_at is not null and (tg_op = 'INSERT' or old.save_date_at is null) then ev := 'savedate';
  end if;
  if ev is not null then
    begin perform public.call_push(jsonb_build_object('type','surprise','event',ev,'record',to_jsonb(new)));
    exception when others then null; end;
  end if;
  return new;
end $$;
drop trigger if exists on_surprise_push on public.surprises;
create trigger on_surprise_push after insert or update on public.surprises for each row execute function public.push_surprise();
