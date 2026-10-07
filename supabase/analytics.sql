-- Product analytics (admin-only aggregates)
-- Requires public.is_admin() from admin-bootstrap.sql
-- Run in Supabase → SQL Editor
-- Privacy: never store note text, folder names, passwords, or secrets.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  created_at timestamptz not null default now(),
  anonymous_session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  recipe_id text,
  source text,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_recipe_idx
  on public.analytics_events (recipe_id)
  where recipe_id is not null;

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_insert_own_or_anon" on public.analytics_events;
drop policy if exists "analytics_select_admin" on public.analytics_events;
drop policy if exists "analytics_delete_admin" on public.analytics_events;

-- Anyone can insert events for product analytics.
-- If user_id is set, it must match the authenticated user (or be null for anonymous).
create policy "analytics_insert_own_or_anon"
  on public.analytics_events for insert
  with check (
    char_length(anonymous_session_id) between 8 and 80
    and (
      user_id is null
      or user_id = auth.uid()
    )
  );

-- Only admins can read (aggregates in Admin → Innsikt)
create policy "analytics_select_admin"
  on public.analytics_events for select
  using (public.is_admin());

create policy "analytics_delete_admin"
  on public.analytics_events for delete
  using (public.is_admin());

-- Overview counts for a period (admin only)
create or replace function public.analytics_overview(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  event_name text,
  event_count bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.event_name,
    count(*)::bigint as event_count,
    count(distinct e.anonymous_session_id)::bigint as unique_sessions
  from public.analytics_events e
  where public.is_admin()
    and (p_from is null or e.created_at >= p_from)
    and (p_to is null or e.created_at < p_to)
  group by e.event_name
  order by event_count desc;
$$;

revoke all on function public.analytics_overview(timestamptz, timestamptz) from public;
grant execute on function public.analytics_overview(timestamptz, timestamptz) to authenticated;

-- Top recipes by views (admin only)
create or replace function public.analytics_top_recipes(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 20
)
returns table (
  recipe_id text,
  views bigint,
  favorites bigint,
  shopping_adds bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.recipe_id,
    count(*) filter (where e.event_name = 'recipe_view')::bigint as views,
    count(*) filter (where e.event_name = 'recipe_favorite_add')::bigint as favorites,
    count(*) filter (where e.event_name = 'recipe_shopping_add')::bigint as shopping_adds,
    count(distinct e.anonymous_session_id)::bigint as unique_sessions
  from public.analytics_events e
  where public.is_admin()
    and e.recipe_id is not null
    and (p_from is null or e.created_at >= p_from)
    and (p_to is null or e.created_at < p_to)
    and e.event_name in (
      'recipe_view',
      'recipe_favorite_add',
      'recipe_shopping_add'
    )
  group by e.recipe_id
  order by views desc, favorites desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

revoke all on function public.analytics_top_recipes(timestamptz, timestamptz, integer) from public;
grant execute on function public.analytics_top_recipes(timestamptz, timestamptz, integer) to authenticated;
