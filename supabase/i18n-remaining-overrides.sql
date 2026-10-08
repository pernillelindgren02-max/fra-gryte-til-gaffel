-- i18n remaining sections: Explore (JSON), Onboarding, Tips, Notifications
-- ADDITIVE — preserves Norwegian. Run after:
--   supabase/i18n-bilingual.sql
--   supabase/i18n-auto-override.sql (recipes)
-- Safe / idempotent.

-- ------------------------------------------------------------
-- 1) Onboarding — auto + override flags
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.onboarding_steps') is null then
    raise notice 'skip onboarding_steps overrides: table missing';
    return;
  end if;

  alter table public.onboarding_steps
    add column if not exists title_en_auto text,
    add column if not exists title_en_override boolean not null default false,
    add column if not exists body_en_auto text,
    add column if not exists body_en_override boolean not null default false;

  update public.onboarding_steps
  set title_en_override = true
  where coalesce(nullif(trim(title_en), ''), '') is not null
    and title_en_override = false;

  update public.onboarding_steps
  set body_en_override = true
  where coalesce(nullif(trim(body_en), ''), '') is not null
    and body_en_override = false;
end $$;

-- ------------------------------------------------------------
-- 2) Tip categories
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.tip_categories') is null then
    raise notice 'skip tip_categories overrides: table missing';
    return;
  end if;

  alter table public.tip_categories
    add column if not exists name_en_auto text,
    add column if not exists name_en_override boolean not null default false;

  update public.tip_categories
  set name_en_override = true
  where coalesce(nullif(trim(name_en), ''), '') is not null
    and name_en_override = false;

  update public.tip_categories set name_en_auto = 'Camping stove'
    where slug = 'primus' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Small kitchen'
    where slug = 'lite-kjokken' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Gear'
    where slug = 'utstyr' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Technique'
    where slug = 'teknikk' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Less washing-up'
    where slug = 'lite-oppvask' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Outdoors'
    where slug = 'tur' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.tip_categories set name_en_auto = 'Student kitchen'
    where slug = 'studentkjokken' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
end $$;

-- ------------------------------------------------------------
-- 3) Tip articles
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.tip_articles') is null then
    raise notice 'skip tip_articles overrides: table missing';
    return;
  end if;

  alter table public.tip_articles
    add column if not exists title_en_auto text,
    add column if not exists title_en_override boolean not null default false,
    add column if not exists excerpt_en_auto text,
    add column if not exists excerpt_en_override boolean not null default false;

  update public.tip_articles
  set title_en_override = true
  where coalesce(nullif(trim(title_en), ''), '') is not null
    and title_en_override = false;

  update public.tip_articles
  set excerpt_en_override = true
  where coalesce(nullif(trim(excerpt_en), ''), '') is not null
    and excerpt_en_override = false;

  update public.tip_articles set
    title_en_auto = 'Camping stove for beginners',
    excerpt_en_auto = 'A calm start: lighting, cooking and extinguishing without stress.'
  where slug = 'primus-for-nybegynnere'
    and coalesce(nullif(trim(title_en_auto), ''), '') is null;

  update public.tip_articles set
    title_en_auto = 'Less washing-up on the trail',
    excerpt_en_auto = 'One pot, smarter order — and an almost dry dishcloth.'
  where slug = 'mindre-oppvask-paa-tur'
    and coalesce(nullif(trim(title_en_auto), ''), '') is null;

  update public.tip_articles set
    title_en_auto = 'Student kitchen survival guide',
    excerpt_en_auto = 'When the kitchen is tiny and time is short — how to still cook real food.'
  where slug = 'studentkjokkenets-overlevelse'
    and coalesce(nullif(trim(title_en_auto), ''), '') is null;
end $$;

-- ------------------------------------------------------------
-- 4) Tip blocks — payload auto/override
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.tip_blocks') is null then
    raise notice 'skip tip_blocks overrides: table missing';
    return;
  end if;

  alter table public.tip_blocks
    add column if not exists payload_en_auto jsonb,
    add column if not exists payload_en_override boolean not null default false;

  update public.tip_blocks
  set payload_en_override = true
  where payload_en is not null
    and payload_en <> '{}'::jsonb
    and payload_en_override = false;
end $$;

-- ------------------------------------------------------------
-- 5) Tip images
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.tip_images') is null then
    raise notice 'skip tip_images overrides: table missing';
    return;
  end if;

  alter table public.tip_images
    add column if not exists caption_en_auto text,
    add column if not exists caption_en_override boolean not null default false;

  update public.tip_images
  set caption_en_override = true
  where coalesce(nullif(trim(caption_en), ''), '') is not null
    and caption_en_override = false;
end $$;

-- ------------------------------------------------------------
-- 6) Notifications — auto + override + bilingual send RPC
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.notifications') is null then
    raise notice 'skip notifications overrides: table missing';
    return;
  end if;

  alter table public.notifications
    add column if not exists title_en_auto text,
    add column if not exists title_en_override boolean not null default false,
    add column if not exists body_en_auto text,
    add column if not exists body_en_override boolean not null default false;

  update public.notifications
  set title_en_override = true
  where coalesce(nullif(trim(title_en), ''), '') is not null
    and title_en_override = false;

  update public.notifications
  set body_en_override = true
  where coalesce(nullif(trim(body_en), ''), '') is not null
    and body_en_override = false;
end $$;

create or replace function public.admin_send_notification_bilingual(
  p_recipe_id text,
  p_title_no text,
  p_body_no text,
  p_title_en text default '',
  p_body_en text default '',
  p_title_en_auto text default '',
  p_body_en_auto text default '',
  p_title_en_override boolean default false,
  p_body_en_override boolean default false
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

  if p_title_no is null or length(trim(p_title_no)) = 0 then
    raise exception 'title required';
  end if;

  insert into public.notifications (
    recipe_id, deep_link,
    title, body,
    title_no, body_no,
    title_en, body_en,
    title_en_auto, body_en_auto,
    title_en_override, body_en_override,
    created_by, sent_at
  )
  values (
    nullif(trim(p_recipe_id), ''),
    case
      when nullif(trim(p_recipe_id), '') is null then null
      else '/oppskrift/' || trim(p_recipe_id)
    end,
    trim(p_title_no),
    coalesce(p_body_no, ''),
    trim(p_title_no),
    coalesce(p_body_no, ''),
    case when p_title_en_override then trim(coalesce(p_title_en, '')) else '' end,
    case when p_body_en_override then trim(coalesce(p_body_en, '')) else '' end,
    coalesce(p_title_en_auto, ''),
    coalesce(p_body_en_auto, ''),
    coalesce(p_title_en_override, false),
    coalesce(p_body_en_override, false),
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

revoke all on function public.admin_send_notification_bilingual(
  text, text, text, text, text, text, text, boolean, boolean
) from public;
grant execute on function public.admin_send_notification_bilingual(
  text, text, text, text, text, text, text, boolean, boolean
) to authenticated;

-- Explore: bilingual labels live in explore_settings.sections JSON
-- (blurbNo/blurbEn/titleEn*/categories/sections). No schema change required.
