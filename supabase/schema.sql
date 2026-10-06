-- Fra gryte til gaffel — personal data schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Recipes themselves stay in the app (src/data/recipes.ts); only recipe_id is stored here.

-- Favorites
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Folders (collections)
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

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

-- Recipes inside folders
create table if not exists public.folder_recipes (
  folder_id uuid not null references public.folders (id) on delete cascade,
  recipe_id text not null,
  created_at timestamptz not null default now(),
  primary key (folder_id, recipe_id)
);

alter table public.folder_recipes enable row level security;

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

-- Private notes per recipe
create table if not exists public.recipe_notes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_notes enable row level security;

create policy "recipe_notes_select_own"
  on public.recipe_notes for select
  using (auth.uid() = user_id);

create policy "recipe_notes_insert_own"
  on public.recipe_notes for insert
  with check (auth.uid() = user_id);

create policy "recipe_notes_update_own"
  on public.recipe_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recipe_notes_delete_own"
  on public.recipe_notes for delete
  using (auth.uid() = user_id);
