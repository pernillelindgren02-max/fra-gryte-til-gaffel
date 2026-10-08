-- i18n automatic English + Admin override flags — ADDITIVE
-- Run after supabase/i18n-bilingual.sql
-- Preserves all existing Norwegian content.
-- Safe / idempotent: IF NOT EXISTS + to_regclass guards.

do $$
begin
  if to_regclass('public.recipes') is null then
    raise notice 'skip recipes auto/override: table missing';
    return;
  end if;

  alter table public.recipes
    add column if not exists name_en_auto text,
    add column if not exists name_en_override boolean not null default false,
    add column if not exists short_description_en_auto text,
    add column if not exists short_description_en_override boolean not null default false;

  -- Historical name_en / short_description_en → treat as manual overrides
  update public.recipes
  set name_en_override = true
  where coalesce(nullif(trim(name_en), ''), '') is not null
    and name_en_override = false;

  update public.recipes
  set short_description_en_override = true
  where coalesce(nullif(trim(short_description_en), ''), '') is not null
    and short_description_en_override = false;

  -- Seed curated automatic titles when empty (offline defaults; no API)
  update public.recipes set name_en_auto = 'Salmon poke bowl'
    where id = 'pokebowl-laks' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'One-pot lasagna'
    where id = 'lasagnegryte' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Creamy one-pot chorizo pasta'
    where id = 'kremet-pasta-chorizo' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Gnocchi with chicken and mushrooms'
    where id = 'gnocchi-kylling-sopp' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Noodles with peanut sauce'
    where id = 'nudler-peanottsaus' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Creamy lentil pot with sweet potato and feta'
    where id = 'linsegryte-sotpotet-feta' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Easy gyros'
    where id = 'enkel-gyros' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Pancakes with warm blueberry jam'
    where id = 'pannekaker-blabaer' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Turkish eggs light'
    where id = 'tyrkiske-egg-light' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Halloumi & honey toast'
    where id = 'halloumi-honey-toast' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Crispy rice bowl with egg'
    where id = 'crispy-rice-bowl' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Apple pie oats'
    where id = 'apple-pie-oats' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Carrot cake oats'
    where id = 'carrot-cake-oats' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Shakshuka'
    where id = 'shakshuka' and coalesce(nullif(trim(name_en_auto), ''), '') is null;
  update public.recipes set name_en_auto = 'Apple crumble porridge'
    where id = 'eplecrumble-grot' and coalesce(nullif(trim(name_en_auto), ''), '') is null;

  update public.recipes set short_description_en_auto = 'Fresh salmon, rice and toppings with chili mayo. 2 servings.'
    where id = 'pokebowl-laks' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'All the flavour of lasagna in one pot — no oven. 2 servings.'
    where id = 'lasagnegryte' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Quick pasta dinner with spicy chorizo and crème fraîche. 2 servings.'
    where id = 'kremet-pasta-chorizo' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Gnocchi pan-fried with chicken, mushrooms and cream. 2 servings.'
    where id = 'gnocchi-kylling-sopp' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Creamy peanut noodles with chili and lime — ready in 15 minutes. 2 servings.'
    where id = 'nudler-peanottsaus' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Warming pot with chicken, red lentils and sweet potato. 2 servings.'
    where id = 'linsegryte-sotpotet-feta' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Seared meat in pita with yoghurt, feta and fresh vegetables. 2 servings.'
    where id = 'enkel-gyros' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Thin pancakes served with homemade blueberry jam. 2 servings.'
    where id = 'pannekaker-blabaer' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Soft-boiled eggs on yoghurt with chili butter and bread. 2 servings.'
    where id = 'tyrkiske-egg-light' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Fried halloumi on toast with yoghurt, honey and chili. 2 servings.'
    where id = 'halloumi-honey-toast' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Crispy fried rice with egg, avocado and chili mayo. 2 servings.'
    where id = 'crispy-rice-bowl' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Oat porridge topped with caramelised apples and yoghurt. 2 servings.'
    where id = 'apple-pie-oats' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Carrot porridge with cinnamon and yoghurt — like carrot cake for breakfast. 2 servings.'
    where id = 'carrot-cake-oats' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Eggs poached in spiced tomato sauce with pepper and feta. 2 servings.'
    where id = 'shakshuka' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;
  update public.recipes set short_description_en_auto = 'Oat porridge with fried apples and a crunchy crumble topping. 2 servings.'
    where id = 'eplecrumble-grot' and coalesce(nullif(trim(short_description_en_auto), ''), '') is null;

  comment on column public.recipes.name_en is
    'Manual English title override. Empty when using automatic/default.';
  comment on column public.recipes.name_en_auto is
    'Stored automatic/default English title (offline curated).';
  comment on column public.recipes.name_en_override is
    'True when name_en is an Admin manual override.';
  comment on column public.recipes.short_description_en is
    'Manual English short description override.';
  comment on column public.recipes.short_description_en_auto is
    'Stored automatic/default English short description.';
  comment on column public.recipes.short_description_en_override is
    'True when short_description_en is an Admin manual override.';
end $$;
