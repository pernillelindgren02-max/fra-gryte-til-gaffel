-- recipe_notes only (favorites/folders already exist)
-- Paste into Supabase → SQL Editor → Run

create table if not exists public.recipe_notes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_notes enable row level security;

drop policy if exists "recipe_notes_select_own" on public.recipe_notes;
drop policy if exists "recipe_notes_insert_own" on public.recipe_notes;
drop policy if exists "recipe_notes_update_own" on public.recipe_notes;
drop policy if exists "recipe_notes_delete_own" on public.recipe_notes;

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
