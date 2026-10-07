-- In-app notifications (+ push_tokens stub for later APNs/FCM)
-- Requires: admin-bootstrap.sql (is_admin), recipes-admin.sql (recipes)
-- Run in Supabase → SQL Editor after those files.
-- Tables are created first; policies/functions only after all relations exist.

-- ------------------------------------------------------------
-- 1) Tables (create all before policies / FKs that cross-reference)
-- ------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notify_new_recipes boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references public.recipes (id) on delete set null,
  deep_link text,
  title text not null,
  body text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Additive for existing projects that already created notifications without deep_link
alter table public.notifications
  add column if not exists deep_link text;

create table if not exists public.notification_recipients (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, token)
);

-- ------------------------------------------------------------
-- 2) Indexes
-- ------------------------------------------------------------
create index if not exists notifications_sent_at_idx
  on public.notifications (sent_at desc);

create index if not exists notification_recipients_user_unread_idx
  on public.notification_recipients (user_id, read_at);

-- ------------------------------------------------------------
-- 3) RLS + policies (only after all tables exist)
-- ------------------------------------------------------------
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.push_tokens enable row level security;

drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
drop policy if exists "notif_prefs_insert_own" on public.notification_preferences;
drop policy if exists "notif_prefs_update_own" on public.notification_preferences;

create policy "notif_prefs_select_own"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "notif_prefs_insert_own"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "notif_prefs_update_own"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_select_recipient" on public.notifications;
drop policy if exists "notifications_select_admin" on public.notifications;
drop policy if exists "notifications_insert_admin" on public.notifications;

create policy "notifications_select_recipient"
  on public.notifications for select
  using (
    exists (
      select 1
      from public.notification_recipients r
      where r.notification_id = id
        and r.user_id = auth.uid()
    )
  );

create policy "notifications_select_admin"
  on public.notifications for select
  using (public.is_admin());

create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (public.is_admin());

drop policy if exists "notif_recipients_select_own" on public.notification_recipients;
drop policy if exists "notif_recipients_update_own" on public.notification_recipients;
drop policy if exists "notif_recipients_insert_admin" on public.notification_recipients;

create policy "notif_recipients_select_own"
  on public.notification_recipients for select
  using (auth.uid() = user_id);

create policy "notif_recipients_update_own"
  on public.notification_recipients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notif_recipients_insert_admin"
  on public.notification_recipients for insert
  with check (public.is_admin());

drop policy if exists "push_tokens_select_own" on public.push_tokens;
drop policy if exists "push_tokens_insert_own" on public.push_tokens;
drop policy if exists "push_tokens_update_own" on public.push_tokens;
drop policy if exists "push_tokens_delete_own" on public.push_tokens;
drop policy if exists "push_tokens_select_admin" on public.push_tokens;

create policy "push_tokens_select_own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_insert_own"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_update_own"
  on public.push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_tokens_delete_own"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

create policy "push_tokens_select_admin"
  on public.push_tokens for select
  using (public.is_admin());

-- ------------------------------------------------------------
-- 4) Seed prefs + signup trigger
-- ------------------------------------------------------------
insert into public.notification_preferences (user_id, notify_new_recipes)
select id, true from auth.users
on conflict (user_id) do nothing;

create or replace function public.ensure_notification_preference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id, notify_new_recipes)
  values (new.id, true)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_notif_prefs on auth.users;
create trigger on_auth_user_notif_prefs
  after insert on auth.users
  for each row execute function public.ensure_notification_preference();

-- ------------------------------------------------------------
-- 5) Admin RPCs (after all tables exist)
-- ------------------------------------------------------------
create or replace function public.admin_send_notification(
  p_recipe_id text,
  p_title text,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'title required';
  end if;

  insert into public.notifications (recipe_id, deep_link, title, body, created_by, sent_at)
  values (
    nullif(trim(p_recipe_id), ''),
    case
      when nullif(trim(p_recipe_id), '') is null then null
      else '/oppskrift/' || trim(p_recipe_id)
    end,
    trim(p_title),
    coalesce(p_body, ''),
    auth.uid(),
    now()
  )
  returning id into v_id;

  insert into public.notification_recipients (notification_id, user_id)
  select v_id, p.user_id
  from public.notification_preferences p
  where p.notify_new_recipes = true
  on conflict do nothing;

  get diagnostics v_count = row_count;

  return jsonb_build_object(
    'notification_id', v_id,
    'recipient_count', v_count
  );
end;
$$;

revoke all on function public.admin_send_notification(text, text, text) from public;
grant execute on function public.admin_send_notification(text, text, text) to authenticated;

create or replace function public.admin_list_notifications()
returns table (
  id uuid,
  recipe_id text,
  deep_link text,
  title text,
  body text,
  sent_at timestamptz,
  recipient_count bigint,
  read_count bigint
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
    n.id,
    n.recipe_id,
    coalesce(
      n.deep_link,
      case
        when n.recipe_id is null then null
        else '/oppskrift/' || n.recipe_id
      end
    ) as deep_link,
    n.title,
    n.body,
    n.sent_at,
    (select count(*) from public.notification_recipients r where r.notification_id = n.id),
    (select count(*) from public.notification_recipients r
      where r.notification_id = n.id and r.read_at is not null)
  from public.notifications n
  order by n.sent_at desc
  limit 50;
end;
$$;

revoke all on function public.admin_list_notifications() from public;
grant execute on function public.admin_list_notifications() to authenticated;
