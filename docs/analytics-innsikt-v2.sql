-- Analytics Innsikt v2 — ADDITIVE (does not destroy v1 data)
-- Requires: admin-bootstrap.sql (is_admin), analytics.sql (analytics_events)
-- Run in Supabase → SQL Editor after analytics.sql

-- Environment + path columns on existing events (nullable → safe backfill)
alter table public.analytics_events
  add column if not exists env text not null default 'prod'
    check (env in ('dev', 'prod'));

alter table public.analytics_events
  add column if not exists path text;

alter table public.analytics_events
  add column if not exists from_path text;

create index if not exists analytics_events_env_created_idx
  on public.analytics_events (env, created_at desc);

create index if not exists analytics_events_path_idx
  on public.analytics_events (path)
  where path is not null;

-- Intentional product feedback (analyzable text — NOT private recipe notes)
create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  anonymous_session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  env text not null default 'prod' check (env in ('dev', 'prod')),
  category text not null default 'general'
    check (category in ('general', 'bug', 'idea', 'recipe', 'other')),
  body text not null check (char_length(trim(body)) between 3 and 2000),
  page_path text,
  recipe_id text,
  -- Rule-based tags / sentiment (no third-party AI by default)
  tags text[] not null default '{}',
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'archived'))
);

create index if not exists product_feedback_created_idx
  on public.product_feedback (created_at desc);

create index if not exists product_feedback_env_idx
  on public.product_feedback (env, created_at desc);

alter table public.product_feedback enable row level security;

drop policy if exists "feedback_insert_own_or_anon" on public.product_feedback;
drop policy if exists "feedback_select_admin" on public.product_feedback;
drop policy if exists "feedback_update_admin" on public.product_feedback;
drop policy if exists "feedback_delete_admin" on public.product_feedback;

create policy "feedback_insert_own_or_anon"
  on public.product_feedback for insert
  with check (
    char_length(anonymous_session_id) between 8 and 80
    and char_length(trim(body)) between 3 and 2000
    and (user_id is null or user_id = auth.uid())
  );

create policy "feedback_select_admin"
  on public.product_feedback for select
  using (public.is_admin());

create policy "feedback_update_admin"
  on public.product_feedback for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "feedback_delete_admin"
  on public.product_feedback for delete
  using (public.is_admin());

-- Harden events insert: keep anon insert, require env
drop policy if exists "analytics_insert_own_or_anon" on public.analytics_events;
create policy "analytics_insert_own_or_anon"
  on public.analytics_events for insert
  with check (
    char_length(anonymous_session_id) between 8 and 80
    and env in ('dev', 'prod')
    and (user_id is null or user_id = auth.uid())
  );

-- Daily series for charts (admin)
create or replace function public.analytics_daily_series(
  p_from timestamptz,
  p_to timestamptz,
  p_env text default null,
  p_event text default null
)
returns table (day date, event_count bigint, unique_sessions bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (e.created_at at time zone 'UTC')::date as day,
    count(*)::bigint,
    count(distinct e.anonymous_session_id)::bigint
  from public.analytics_events e
  where public.is_admin()
    and e.created_at >= p_from
    and e.created_at < p_to
    and (p_env is null or e.env = p_env)
    and (p_event is null or e.event_name = p_event)
  group by 1
  order by 1;
$$;

revoke all on function public.analytics_daily_series(timestamptz, timestamptz, text, text) from public;
grant execute on function public.analytics_daily_series(timestamptz, timestamptz, text, text) to authenticated;
