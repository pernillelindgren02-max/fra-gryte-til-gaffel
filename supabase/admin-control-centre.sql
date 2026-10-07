-- Admin control centre — run AFTER admin-bootstrap.sql + recipes-admin.sql
-- Supabase → SQL Editor → Run

-- ------------------------------------------------------------
-- Recipes: portions + notify stub
-- ------------------------------------------------------------
alter table public.recipes
  add column if not exists servings integer not null default 2
    check (servings > 0);

alter table public.recipes
  add column if not exists notify_on_publish boolean not null default false;

-- ------------------------------------------------------------
-- Explore settings (single-row keyed table)
-- ------------------------------------------------------------
create table if not exists public.explore_settings (
  id text primary key default 'default',
  featured_ids jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  blurb text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.explore_settings (id, featured_ids, sections, blurb)
values (
  'default',
  '[]'::jsonb,
  '[
    {"id":"quick-easy","title":"Raskt og enkelt","mode":"auto","recipe_ids":[]},
    {"id":"primus","title":"Perfekt på primus","mode":"auto","recipe_ids":[]},
    {"id":"breakfast","title":"Frokost","mode":"auto","recipe_ids":[]},
    {"id":"dinner","title":"Middag","mode":"auto","recipe_ids":[]}
  ]'::jsonb,
  ''
)
on conflict (id) do nothing;

alter table public.explore_settings enable row level security;

drop policy if exists "explore_settings_select_public" on public.explore_settings;
drop policy if exists "explore_settings_admin_write" on public.explore_settings;
drop policy if exists "explore_settings_admin_update" on public.explore_settings;
drop policy if exists "explore_settings_admin_insert" on public.explore_settings;

create policy "explore_settings_select_public"
  on public.explore_settings for select
  using (true);

create policy "explore_settings_admin_insert"
  on public.explore_settings for insert
  with check (public.is_admin());

create policy "explore_settings_admin_update"
  on public.explore_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- App copy (key → text)
-- ------------------------------------------------------------
create table if not exists public.app_copy (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.app_copy (key, value) values
  ('explore.tagline', 'En gryte unna noe godt'),
  ('explore.search_placeholder', 'Søk etter oppskrift eller ingrediens'),
  ('explore.empty_results', 'Ingen oppskrifter matcher søket eller filtrene. Prøv andre ord eller åpne filtre og nullstill valg.'),
  ('explore.cloud_fallback', 'Kunne ikke hente oppskrifter fra skyen — viser lokal kopi.'),
  ('favoritter.helper', 'Lagre favoritter og mapper, pluss private notater på oppskrifter.'),
  ('favoritter.empty', 'Ingen lagrede oppskrifter ennå.'),
  ('handleliste.empty', 'Handlelisten er tom.'),
  ('hjemme.empty', 'Ingen ingredienser ennå.')
on conflict (key) do nothing;

alter table public.app_copy enable row level security;

drop policy if exists "app_copy_select_public" on public.app_copy;
drop policy if exists "app_copy_admin_insert" on public.app_copy;
drop policy if exists "app_copy_admin_update" on public.app_copy;
drop policy if exists "app_copy_admin_delete" on public.app_copy;

create policy "app_copy_select_public"
  on public.app_copy for select
  using (true);

create policy "app_copy_admin_insert"
  on public.app_copy for insert
  with check (public.is_admin());

create policy "app_copy_admin_update"
  on public.app_copy for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "app_copy_admin_delete"
  on public.app_copy for delete
  using (public.is_admin());

-- ------------------------------------------------------------
-- App theme (single row of safe colour tokens)
-- ------------------------------------------------------------
create table if not exists public.app_theme (
  id text primary key default 'default',
  tokens jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_theme (id, tokens)
values (
  'default',
  '{
    "terracotta":"#c8544f",
    "teal":"#255957",
    "olive":"#859400",
    "warmOrange":"#ee7939",
    "softYellow":"#eacd6a",
    "paleGreen":"#d5dba2",
    "bg":"#f7f3eb",
    "card":"#eef1df",
    "logoBlob":"#d5dba2"
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.app_theme enable row level security;

drop policy if exists "app_theme_select_public" on public.app_theme;
drop policy if exists "app_theme_admin_insert" on public.app_theme;
drop policy if exists "app_theme_admin_update" on public.app_theme;

create policy "app_theme_select_public"
  on public.app_theme for select
  using (true);

create policy "app_theme_admin_insert"
  on public.app_theme for insert
  with check (public.is_admin());

create policy "app_theme_admin_update"
  on public.app_theme for update
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Profiles: admins can list others' is_admin; NO self-promotion via client
-- ------------------------------------------------------------
drop policy if exists "profiles_select_admin_all" on public.profiles;
drop policy if exists "profiles_update_admin_others" on public.profiles;

-- Admins may read all profiles (for Brukere overview)
create policy "profiles_select_admin_all"
  on public.profiles for select
  using (public.is_admin());

-- Admins may update OTHER users' profiles only (never own row → no self-promotion)
create policy "profiles_update_admin_others"
  on public.profiles for update
  using (public.is_admin() and id <> auth.uid())
  with check (public.is_admin() and id <> auth.uid());

-- ------------------------------------------------------------
-- Admin user list (email + dates only — no notes/favorites/folders)
-- ------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    coalesce(p.is_admin, false)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ------------------------------------------------------------
-- Minimal admin settings (key/value)
-- ------------------------------------------------------------
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.admin_settings (key, value) values
  ('migration_confirmed', 'false'::jsonb),
  ('show_cloud_fallback_banner', 'true'::jsonb)
on conflict (key) do nothing;

alter table public.admin_settings enable row level security;

drop policy if exists "admin_settings_select_admin" on public.admin_settings;
drop policy if exists "admin_settings_admin_write" on public.admin_settings;
drop policy if exists "admin_settings_admin_update" on public.admin_settings;
drop policy if exists "admin_settings_admin_insert" on public.admin_settings;

create policy "admin_settings_select_admin"
  on public.admin_settings for select
  using (public.is_admin());

create policy "admin_settings_admin_insert"
  on public.admin_settings for insert
  with check (public.is_admin());

create policy "admin_settings_admin_update"
  on public.admin_settings for update
  using (public.is_admin())
  with check (public.is_admin());
