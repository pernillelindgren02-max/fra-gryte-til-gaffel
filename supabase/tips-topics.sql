-- Tips topics: extend tip_categories + multi-assign junction
-- Run after tips-og-triks.sql (+ i18n bilingual columns if present)
-- Does NOT delete articles when deactivating a topic.

alter table public.tip_categories
  add column if not exists is_active boolean not null default true;

alter table public.tip_categories
  add column if not exists name_no text,
  add column if not exists name_en text,
  add column if not exists name_en_auto text,
  add column if not exists name_en_override boolean not null default false;

update public.tip_categories
set name_no = coalesce(nullif(trim(name_no), ''), name)
where name_no is null or trim(name_no) = '';

-- Migrate legacy slugs → stable filter IDs
update public.tip_categories set slug = 'student_kitchen', name = 'Studentkjøkken', name_no = 'Studentkjøkken'
  where slug in ('studentkjokken', 'student_kitchen');
update public.tip_categories set slug = 'camping', name = 'På tur', name_no = 'På tur'
  where slug in ('tur', 'camping');
update public.tip_categories set slug = 'less_dishes', name = 'Lite oppvask', name_no = 'Lite oppvask'
  where slug in ('lite-oppvask', 'less_dishes');
update public.tip_categories set slug = 'camping_stove', name = 'Primus', name_no = 'Primus'
  where slug in ('primus', 'camping_stove');
update public.tip_categories set slug = 'gear', name = 'Utstyr', name_no = 'Utstyr'
  where slug in ('utstyr', 'gear');
update public.tip_categories set slug = 'technique', name = 'Teknikk', name_no = 'Teknikk'
  where slug in ('teknikk', 'technique');
update public.tip_categories set slug = 'small_kitchen', name = 'Små kjøkken', name_no = 'Små kjøkken'
  where slug in ('lite-kjokken', 'small_kitchen');

-- Seed any missing canonical topics (idempotent by slug)
insert into public.tip_categories (slug, name, name_no, name_en, name_en_auto, name_en_override, sort_order, is_active)
select v.slug, v.name_no, v.name_no, v.name_en, v.name_en, true, v.sort_order, true
from (values
  ('student_kitchen', 'Studentkjøkken', 'Student kitchen', 1),
  ('camping', 'På tur', 'Camping / outdoors', 2),
  ('few_ingredients', 'Få ingredienser', 'Few ingredients', 3),
  ('less_dishes', 'Lite oppvask', 'Less washing-up', 4),
  ('camping_stove', 'Primus', 'Camping stove', 5),
  ('gear', 'Utstyr', 'Gear', 6),
  ('technique', 'Teknikk', 'Technique', 7),
  ('cheap_food', 'Billig mat', 'Budget food', 8),
  ('small_kitchen', 'Små kjøkken', 'Small kitchens', 9),
  ('keeps_well', 'Mat som holder seg', 'Food that keeps', 10),
  ('leftovers', 'Restemat', 'Leftovers', 11)
) as v(slug, name_no, name_en, sort_order)
where not exists (
  select 1 from public.tip_categories c where c.slug = v.slug
);

-- Multi-topic assignment (filter on category ids, not display text)
create table if not exists public.tip_article_topics (
  article_id uuid not null references public.tip_articles (id) on delete cascade,
  category_id uuid not null references public.tip_categories (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (article_id, category_id)
);

create index if not exists tip_article_topics_category_idx
  on public.tip_article_topics (category_id);

alter table public.tip_article_topics enable row level security;

drop policy if exists "tip_article_topics_select" on public.tip_article_topics;
drop policy if exists "tip_article_topics_admin" on public.tip_article_topics;

create policy "tip_article_topics_select"
  on public.tip_article_topics for select
  using (
    exists (
      select 1 from public.tip_articles a
      where a.id = article_id and (a.status = 'published' or public.is_admin())
    )
  );

create policy "tip_article_topics_admin"
  on public.tip_article_topics for all
  using (public.is_admin())
  with check (public.is_admin());

-- Backfill junction from legacy single category_id
insert into public.tip_article_topics (article_id, category_id, sort_order)
select a.id, a.category_id, 1
from public.tip_articles a
where a.category_id is not null
  and not exists (
    select 1 from public.tip_article_topics t
    where t.article_id = a.id and t.category_id = a.category_id
  );
