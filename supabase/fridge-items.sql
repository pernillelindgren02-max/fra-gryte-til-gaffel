-- Fridge inventory (Kjøleskap) — additive schema for optional cloud sync.
-- Runtime MVP stores fridge in localStorage (`fgtg-hjemme-pantry-v1`).
-- Run this in Supabase SQL Editor when you want per-user cloud backup.
-- Safe to re-run: IF NOT EXISTS + drop/recreate policies.

create table if not exists public.fridge_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  ingredient_id text not null,
  name text not null,
  -- Optional amount. Existing rows / unknown qty: both null.
  quantity numeric null,
  -- Allowed: stk | g | kg | ml | dl | l  (null when quantity is null)
  unit text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, ingredient_id),
  constraint fridge_items_unit_check
    check (
      unit is null
      or unit in ('stk', 'g', 'kg', 'ml', 'dl', 'l')
    ),
  constraint fridge_items_qty_unit_pair
    check (
      (quantity is null and unit is null)
      or (quantity is not null and unit is not null and quantity >= 0)
    )
);

create index if not exists fridge_items_user_idx
  on public.fridge_items (user_id);

alter table public.fridge_items enable row level security;

drop policy if exists "fridge_items_select_own" on public.fridge_items;
create policy "fridge_items_select_own"
  on public.fridge_items for select
  using (auth.uid() = user_id);

drop policy if exists "fridge_items_insert_own" on public.fridge_items;
create policy "fridge_items_insert_own"
  on public.fridge_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "fridge_items_update_own" on public.fridge_items;
create policy "fridge_items_update_own"
  on public.fridge_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "fridge_items_delete_own" on public.fridge_items;
create policy "fridge_items_delete_own"
  on public.fridge_items for delete
  using (auth.uid() = user_id);

-- Optional: shopping-list check overrides (manual vs auto) for future sync.
create table if not exists public.shopping_check_overrides (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null,
  -- 'checked' = manual check; 'unchecked' = manual uncheck (overrides fridge enough)
  override text not null check (override in ('checked', 'unchecked')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.shopping_check_overrides enable row level security;

drop policy if exists "shopping_check_overrides_select_own" on public.shopping_check_overrides;
create policy "shopping_check_overrides_select_own"
  on public.shopping_check_overrides for select
  using (auth.uid() = user_id);

drop policy if exists "shopping_check_overrides_insert_own" on public.shopping_check_overrides;
create policy "shopping_check_overrides_insert_own"
  on public.shopping_check_overrides for insert
  with check (auth.uid() = user_id);

drop policy if exists "shopping_check_overrides_update_own" on public.shopping_check_overrides;
create policy "shopping_check_overrides_update_own"
  on public.shopping_check_overrides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "shopping_check_overrides_delete_own" on public.shopping_check_overrides;
create policy "shopping_check_overrides_delete_own"
  on public.shopping_check_overrides for delete
  using (auth.uid() = user_id);
