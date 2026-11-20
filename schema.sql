-- Bagsy Trips: database setup.
-- Paste all of this into Supabase → SQL Editor → New query, then press Run. Safe to run once on a new project.

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  avatar jsonb,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  place text not null,
  kind text,
  start_date date not null,
  nights int not null default 7,
  partner_name text default '',
  invite_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.parts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  name text not null,
  cost numeric(10,2) not null default 0,
  owner uuid references auth.users on delete set null,
  for_partner boolean not null default false,
  due date not null,
  method text not null default 'none',
  freq text not null default 'week',
  amount numeric(10,2) not null default 0,
  into_label text not null default '',
  checks boolean not null default true,
  schedule_from date not null default current_date,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  part_id uuid not null references public.parts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  check_date date,
  created_at timestamptz not null default now()
);

create table public.check_replies (
  trip_id uuid not null references public.trips on delete cascade,
  part_id uuid not null references public.parts on delete cascade,
  due_date date not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  reply text not null check (reply in ('yes','notyet')),
  created_at timestamptz not null default now(),
  primary key (part_id, due_date)
);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  user_id uuid default auth.uid() references auth.users on delete set null,
  kind text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index on public.parts (trip_id);
create index on public.logs (trip_id);
create index on public.activity (trip_id, created_at desc);

-- ---------- helpers ----------
create or replace function public.is_member(t uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid());
$$;

create or replace function public.shares_trip(other uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from trip_members a join trip_members b on a.trip_id = b.trip_id
    where a.user_id = auth.uid() and b.user_id = other);
$$;

-- new sign-ups get an empty profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- whoever creates a trip is its first member
create or replace function public.add_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into trip_members (trip_id, user_id) values (new.id, new.created_by) on conflict do nothing;
  return new;
end $$;
create trigger on_trip_created after insert on public.trips
  for each row execute function public.add_creator();

-- join a trip with its invite code; the joiner takes over the parts set aside for the partner
create or replace function public.join_trip(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into t from trips where invite_code = upper(trim(code));
  if t is null then raise exception 'That code doesn''t match a trip'; end if;
  if exists (select 1 from trip_members where trip_id = t and user_id = auth.uid()) then return t; end if;
  insert into trip_members (trip_id, user_id) values (t, auth.uid());
  update parts set owner = auth.uid(), for_partner = false where trip_id = t and for_partner;
  insert into activity (trip_id, user_id, kind, data) values (t, auth.uid(), 'joined', '{}');
  return t;
end $$;
grant execute on function public.join_trip(text) to authenticated;

-- peek at a trip before joining (place and who invited you)
create or replace function public.invite_preview(code text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object('place', t.place, 'start_date', t.start_date, 'from', p.name)
  from trips t left join profiles p on p.id = t.created_by
  where t.invite_code = upper(trim(code));
$$;
grant execute on function public.invite_preview(text) to authenticated;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.parts enable row level security;
alter table public.logs enable row level security;
alter table public.check_replies enable row level security;
alter table public.activity enable row level security;

create policy "see self and trip partners" on public.profiles for select using (id = auth.uid() or public.shares_trip(id));
create policy "edit own profile" on public.profiles for update using (id = auth.uid());
create policy "create own profile" on public.profiles for insert with check (id = auth.uid());

create policy "members see trips" on public.trips for select using (created_by = auth.uid() or public.is_member(id));
create policy "anyone signed in creates trips" on public.trips for insert with check (created_by = auth.uid());
create policy "members edit trips" on public.trips for update using (public.is_member(id));
create policy "creator deletes trips" on public.trips for delete using (created_by = auth.uid());

create policy "members see members" on public.trip_members for select using (public.is_member(trip_id));
create policy "leave a trip" on public.trip_members for delete using (user_id = auth.uid());

create policy "members use parts" on public.parts for all using (public.is_member(trip_id)) with check (public.is_member(trip_id));
create policy "members use logs" on public.logs for all using (public.is_member(trip_id)) with check (public.is_member(trip_id));
create policy "members use replies" on public.check_replies for all using (public.is_member(trip_id)) with check (public.is_member(trip_id));
create policy "members use activity" on public.activity for all using (public.is_member(trip_id)) with check (public.is_member(trip_id));
