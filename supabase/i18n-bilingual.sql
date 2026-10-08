-- i18n bilingual content — ADDITIVE migration (preserves existing Norwegian)
-- Requires: admin-bootstrap.sql (profiles), recipes-admin.sql
-- Optional tables: onboarding_steps, tip_*, notifications (skipped if missing)
-- Safe / idempotent: IF NOT EXISTS + information_schema guards.
-- tip_blocks text lives in payload jsonb — there is NO body/caption column.

-- ------------------------------------------------------------
-- Helpers: only touch tables/columns that exist
-- ------------------------------------------------------------

-- 1) Profile language preference
do $$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'skip profiles: table missing';
    return;
  end if;

  alter table public.profiles
    add column if not exists preferred_locale text;

  -- Add check only if not already present
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_preferred_locale_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_preferred_locale_check
      check (preferred_locale is null or preferred_locale in ('no', 'en'));
  end if;

  drop policy if exists "profiles_update_own_locale" on public.profiles;
  create policy "profiles_update_own_locale"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

  comment on column public.profiles.preferred_locale is
    'User UI language: no | en. Null = unset (app defaults to no).';
end $$;

-- ------------------------------------------------------------
-- 2) Recipes — bilingual titles, descriptions, steps
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.recipes') is null then
    raise notice 'skip recipes: table missing';
    return;
  end if;

  alter table public.recipes
    add column if not exists name_no text,
    add column if not exists name_en text,
    add column if not exists short_description_no text,
    add column if not exists short_description_en text,
    add column if not exists steps_no jsonb,
    add column if not exists steps_en jsonb;

  -- Migrate legacy → _no only when _no empty (never overwrite filled NO)
  update public.recipes
  set
    name_no = coalesce(nullif(trim(name_no), ''), name),
    short_description_no = coalesce(
      nullif(trim(short_description_no), ''),
      short_description
    ),
    steps_no = case
      when steps_no is null or steps_no = '[]'::jsonb then steps
      else steps_no
    end
  where true;

  -- Keep legacy columns as Norwegian mirrors
  update public.recipes
  set
    name = coalesce(nullif(trim(name_no), ''), name),
    short_description = coalesce(
      nullif(trim(short_description_no), ''),
      short_description
    ),
    steps = coalesce(steps_no, steps)
  where true;

  -- Ingredients JSON: id + name_no from legacy name; name_en empty if missing
  update public.recipes
  set ingredients = (
    select coalesce(
      jsonb_agg(
        jsonb_strip_nulls(
          jsonb_build_object(
            'id', coalesce(
              nullif(elem->>'id', ''),
              lower(regexp_replace(
                translate(
                  coalesce(elem->>'name_no', elem->>'name', ''),
                  'æøåÆØÅ',
                  'aoaAOA'
                ),
                '[^a-zA-Z0-9]+',
                '-',
                'g'
              ))
            ),
            'name_no', coalesce(nullif(elem->>'name_no', ''), elem->>'name', ''),
            'name_en', coalesce(elem->>'name_en', ''),
            'name', coalesce(nullif(elem->>'name_no', ''), elem->>'name', ''),
            'quantity', elem->'quantity',
            'unit', elem->'unit'
          )
        )
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(ingredients, '[]'::jsonb)) as elem
  )
  where ingredients is not null;
end $$;

-- ------------------------------------------------------------
-- 3) Onboarding steps — title/body exist on this table
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.onboarding_steps') is null then
    raise notice 'skip onboarding_steps: table missing';
    return;
  end if;

  alter table public.onboarding_steps
    add column if not exists title_no text,
    add column if not exists title_en text,
    add column if not exists body_no text,
    add column if not exists body_en text;

  update public.onboarding_steps
  set
    title_no = coalesce(nullif(trim(title_no), ''), title),
    body_no = coalesce(nullif(trim(body_no), ''), body)
  where true;
end $$;

-- ------------------------------------------------------------
-- 4) Tips — categories / articles / blocks / images
-- ------------------------------------------------------------

-- tip_categories.name → name_no
do $$
begin
  if to_regclass('public.tip_categories') is null then
    raise notice 'skip tip_categories: table missing';
    return;
  end if;

  alter table public.tip_categories
    add column if not exists name_no text,
    add column if not exists name_en text;

  update public.tip_categories
  set name_no = coalesce(nullif(trim(name_no), ''), name)
  where true;
end $$;

-- tip_articles: title, excerpt (not body)
do $$
begin
  if to_regclass('public.tip_articles') is null then
    raise notice 'skip tip_articles: table missing';
    return;
  end if;

  alter table public.tip_articles
    add column if not exists title_no text,
    add column if not exists title_en text,
    add column if not exists excerpt_no text,
    add column if not exists excerpt_en text;

  update public.tip_articles
  set
    title_no = coalesce(nullif(trim(title_no), ''), title),
    excerpt_no = coalesce(nullif(trim(excerpt_no), ''), excerpt)
  where true;
end $$;

-- tip_blocks: content is payload jsonb — NO body/caption columns
-- Use payload_no / payload_en. Drop mistaken empty body_*/caption_* if a prior
-- failed run added them and they are unused.
do $$
begin
  if to_regclass('public.tip_blocks') is null then
    raise notice 'skip tip_blocks: table missing';
    return;
  end if;

  alter table public.tip_blocks
    add column if not exists payload_no jsonb,
    add column if not exists payload_en jsonb;

  -- Copy legacy payload → payload_no when empty
  update public.tip_blocks
  set payload_no = coalesce(payload_no, payload)
  where payload_no is null
     or payload_no = '{}'::jsonb;

  -- Mirror NO back to payload for older clients
  update public.tip_blocks
  set payload = coalesce(payload_no, payload)
  where true;

  -- Clean up columns from earlier incorrect migration attempt (only if empty)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tip_blocks'
      and column_name = 'body_no'
  ) then
    -- Only drop if no non-empty values were stored
    if not exists (
      select 1 from public.tip_blocks
      where nullif(trim(coalesce(body_no, '')), '') is not null
    ) then
      alter table public.tip_blocks drop column if exists body_no;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tip_blocks'
      and column_name = 'body_en'
  ) then
    if not exists (
      select 1 from public.tip_blocks
      where nullif(trim(coalesce(body_en, '')), '') is not null
    ) then
      alter table public.tip_blocks drop column if exists body_en;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tip_blocks'
      and column_name = 'caption_no'
  ) then
    if not exists (
      select 1 from public.tip_blocks
      where nullif(trim(coalesce(caption_no, '')), '') is not null
    ) then
      alter table public.tip_blocks drop column if exists caption_no;
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tip_blocks'
      and column_name = 'caption_en'
  ) then
    if not exists (
      select 1 from public.tip_blocks
      where nullif(trim(coalesce(caption_en, '')), '') is not null
    ) then
      alter table public.tip_blocks drop column if exists caption_en;
    end if;
  end if;
end $$;

-- tip_images: caption column exists
do $$
begin
  if to_regclass('public.tip_images') is null then
    raise notice 'skip tip_images: table missing';
    return;
  end if;

  alter table public.tip_images
    add column if not exists caption_no text,
    add column if not exists caption_en text;

  update public.tip_images
  set caption_no = coalesce(nullif(trim(caption_no), ''), caption)
  where true;
end $$;

-- ------------------------------------------------------------
-- 5) Notifications — title/body exist on this table
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.notifications') is null then
    raise notice 'skip notifications: table missing';
    return;
  end if;

  alter table public.notifications
    add column if not exists title_no text,
    add column if not exists title_en text,
    add column if not exists body_no text,
    add column if not exists body_en text;

  update public.notifications
  set
    title_no = coalesce(nullif(trim(title_no), ''), title),
    body_no = coalesce(nullif(trim(body_no), ''), body)
  where true;
end $$;

-- ------------------------------------------------------------
-- 6) Explore settings — bilingual labels live in JSON
--     (app reads label_no / label_en; falls back to label)
-- No schema change required.
-- ------------------------------------------------------------
