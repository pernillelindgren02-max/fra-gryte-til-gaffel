-- Recipes table + RLS + Storage bucket for admin-managed library
-- Requires public.is_admin() from admin-bootstrap.sql
-- Run in Supabase → SQL Editor after admin-bootstrap.sql

create table if not exists public.recipes (
  id text primary key,
  name text not null,
  short_description text not null default '',
  meal_type text not null,
  time_minutes integer not null check (time_minutes > 0),
  preparation_level text not null,
  storage_need text not null,
  price_level text not null,
  dishwashing_level text not null,
  camping_stove_suitability text not null,
  water_need text not null,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  practical_tags jsonb not null default '[]'::jsonb,
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_published_idx
  on public.recipes (is_published);

alter table public.recipes enable row level security;

drop policy if exists "recipes_select_published" on public.recipes;
drop policy if exists "recipes_select_admin" on public.recipes;
drop policy if exists "recipes_insert_admin" on public.recipes;
drop policy if exists "recipes_update_admin" on public.recipes;
drop policy if exists "recipes_delete_admin" on public.recipes;

-- Logged-out + normal users: published only
create policy "recipes_select_published"
  on public.recipes for select
  using (is_published = true);

-- Admins: all rows
create policy "recipes_select_admin"
  on public.recipes for select
  using (public.is_admin());

create policy "recipes_insert_admin"
  on public.recipes for insert
  with check (public.is_admin());

create policy "recipes_update_admin"
  on public.recipes for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "recipes_delete_admin"
  on public.recipes for delete
  using (public.is_admin());

-- Storage bucket (public read for recipe images)
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "recipe_images_public_read" on storage.objects;
drop policy if exists "recipe_images_admin_insert" on storage.objects;
drop policy if exists "recipe_images_admin_update" on storage.objects;
drop policy if exists "recipe_images_admin_delete" on storage.objects;

create policy "recipe_images_public_read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "recipe_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'recipe-images' and public.is_admin());

create policy "recipe_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'recipe-images' and public.is_admin())
  with check (bucket_id = 'recipe-images' and public.is_admin());

create policy "recipe_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'recipe-images' and public.is_admin());
