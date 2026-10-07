-- Admin bootstrap — profiles.is_admin
-- Run in Supabase → SQL Editor.
-- Does NOT grant admin until you paste your own User UID below.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin_flag" on public.profiles;

-- Anyone authenticated can read their own profile (needed for is_admin check in the app).
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Helper used by RLS on recipes / storage
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who already exist
insert into public.profiles (id, is_admin)
select id, false from auth.users
on conflict (id) do nothing;

-- ============================================================
-- MAKE YOURSELF ADMIN (do this yourself — do not put secrets in chat)
-- 1. Supabase → Authentication → Users → copy your User UID
-- 2. Replace PASTE_YOUR_USER_UID_HERE below (keep the quotes)
-- 3. Run ONLY this update (or the whole file again)
-- ============================================================
-- update public.profiles
-- set is_admin = true
-- where id = 'PASTE_YOUR_USER_UID_HERE';
