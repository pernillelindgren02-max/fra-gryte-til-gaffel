-- First-time onboarding steps (admin-editable)
-- Requires public.is_admin() from admin-bootstrap.sql
-- Run in Supabase → SQL Editor

create table if not exists public.onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_steps_active_order_idx
  on public.onboarding_steps (is_active, sort_order);

alter table public.onboarding_steps enable row level security;

drop policy if exists "onboarding_select_active" on public.onboarding_steps;
drop policy if exists "onboarding_select_admin" on public.onboarding_steps;
drop policy if exists "onboarding_insert_admin" on public.onboarding_steps;
drop policy if exists "onboarding_update_admin" on public.onboarding_steps;
drop policy if exists "onboarding_delete_admin" on public.onboarding_steps;

-- Anyone can read active steps (first-time + replay)
create policy "onboarding_select_active"
  on public.onboarding_steps for select
  using (is_active = true);

create policy "onboarding_select_admin"
  on public.onboarding_steps for select
  using (public.is_admin());

create policy "onboarding_insert_admin"
  on public.onboarding_steps for insert
  with check (public.is_admin());

create policy "onboarding_update_admin"
  on public.onboarding_steps for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "onboarding_delete_admin"
  on public.onboarding_steps for delete
  using (public.is_admin());

-- Dedicated public bucket for onboarding illustrations
insert into storage.buckets (id, name, public)
values ('onboarding', 'onboarding', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "onboarding_public_read" on storage.objects;
drop policy if exists "onboarding_admin_insert" on storage.objects;
drop policy if exists "onboarding_admin_update" on storage.objects;
drop policy if exists "onboarding_admin_delete" on storage.objects;

create policy "onboarding_public_read"
  on storage.objects for select
  using (bucket_id = 'onboarding');

create policy "onboarding_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'onboarding' and public.is_admin());

create policy "onboarding_admin_update"
  on storage.objects for update
  using (bucket_id = 'onboarding' and public.is_admin())
  with check (bucket_id = 'onboarding' and public.is_admin());

create policy "onboarding_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'onboarding' and public.is_admin());

-- Seed four defaults once (skip if any rows already exist)
insert into public.onboarding_steps (title, body, image_url, sort_order, is_active)
select * from (
  values
    (
      'Fra gryte til gaffel',
      'Enkle oppskrifter for begrenset kjøkken — én kokeplate, mindre mas.',
      '/images/onboarding/step-1.svg',
      1,
      true
    ),
    (
      'Mindre styr',
      'Filtrer på tid, utstyr og humør. Finn noe godt uten å overtenke.',
      '/images/onboarding/step-2.svg',
      2,
      true
    ),
    (
      'Bruk det du har',
      'Skriv inn det du har hjemme — vi foreslår retter som matcher.',
      '/images/onboarding/step-3.svg',
      3,
      true
    ),
    (
      'Fra idé til middag',
      'Lagre favoritter, lag handleliste og kom i gang når du er klar.',
      '/images/onboarding/step-4.svg',
      4,
      true
    )
) as seed(title, body, image_url, sort_order, is_active)
where not exists (select 1 from public.onboarding_steps limit 1);
