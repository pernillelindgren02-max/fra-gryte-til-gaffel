-- Folders only (favorites already exist in your project)
-- Paste into Supabase → SQL Editor → Run
-- Creates public.folders + public.folder_recipes with RLS

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

drop policy if exists "folders_select_own" on public.folders;
drop policy if exists "folders_insert_own" on public.folders;
drop policy if exists "folders_update_own" on public.folders;
drop policy if exists "folders_delete_own" on public.folders;

create policy "folders_select_own"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "folders_insert_own"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "folders_update_own"
  on public.folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "folders_delete_own"
  on public.folders for delete
  using (auth.uid() = user_id);

create table if not exists public.folder_recipes (
  folder_id uuid not null references public.folders (id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (folder_id, recipe_id)
);

alter table public.folder_recipes enable row level security;

drop policy if exists "folder_recipes_select_own" on public.folder_recipes;
drop policy if exists "folder_recipes_insert_own" on public.folder_recipes;
drop policy if exists "folder_recipes_delete_own" on public.folder_recipes;

create policy "folder_recipes_select_own"
  on public.folder_recipes for select
  using (
    exists (
      select 1 from public.folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );

create policy "folder_recipes_insert_own"
  on public.folder_recipes for insert
  with check (
    exists (
      select 1 from public.folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );

create policy "folder_recipes_delete_own"
  on public.folder_recipes for delete
  using (
    exists (
      select 1 from public.folders f
      where f.id = folder_id and f.user_id = auth.uid()
    )
  );
