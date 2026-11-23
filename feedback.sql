-- Feedback from the You tab. Anyone signed in can send; only the project owner reads it (in the Supabase table editor).
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2100),
  version text,
  device text,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "send own feedback" on public.feedback;
create policy "send own feedback" on public.feedback for insert to authenticated with check (user_id = auth.uid());
grant insert on public.feedback to authenticated;
