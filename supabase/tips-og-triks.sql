-- Tips og triks — editorial field-guide articles
-- Requires public.is_admin() from admin-bootstrap.sql
-- Run in Supabase → SQL Editor

-- Categories
create table if not exists public.tip_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Articles
create table if not exists public.tip_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  category_id uuid references public.tip_categories (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  hero_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tip_articles_status_order_idx
  on public.tip_articles (status, sort_order);

create index if not exists tip_articles_featured_idx
  on public.tip_articles (is_featured)
  where is_featured = true and status = 'published';

-- Modular content blocks (structured payloads, not freeform HTML)
create table if not exists public.tip_blocks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.tip_articles (id) on delete cascade,
  block_type text not null,
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tip_blocks_article_order_idx
  on public.tip_blocks (article_id, sort_order);

-- Extra images beyond hero (optional supporting gallery)
create table if not exists public.tip_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.tip_articles (id) on delete cascade,
  url text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tip_images_article_order_idx
  on public.tip_images (article_id, sort_order);

-- Related recipes (by recipe id/slug used in the app)
create table if not exists public.tip_related_recipes (
  article_id uuid not null references public.tip_articles (id) on delete cascade,
  recipe_id text not null,
  sort_order integer not null default 0,
  primary key (article_id, recipe_id)
);

-- Related tip articles
create table if not exists public.tip_related_articles (
  article_id uuid not null references public.tip_articles (id) on delete cascade,
  related_article_id uuid not null references public.tip_articles (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (article_id, related_article_id),
  check (article_id <> related_article_id)
);

-- RLS
alter table public.tip_categories enable row level security;
alter table public.tip_articles enable row level security;
alter table public.tip_blocks enable row level security;
alter table public.tip_images enable row level security;
alter table public.tip_related_recipes enable row level security;
alter table public.tip_related_articles enable row level security;

-- Categories: public read, admin write
drop policy if exists "tip_categories_select" on public.tip_categories;
drop policy if exists "tip_categories_admin" on public.tip_categories;
create policy "tip_categories_select"
  on public.tip_categories for select using (true);
create policy "tip_categories_admin"
  on public.tip_categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- Articles: published readable; admin full
drop policy if exists "tip_articles_select_published" on public.tip_articles;
drop policy if exists "tip_articles_select_admin" on public.tip_articles;
drop policy if exists "tip_articles_admin_write" on public.tip_articles;
create policy "tip_articles_select_published"
  on public.tip_articles for select
  using (status = 'published');
create policy "tip_articles_select_admin"
  on public.tip_articles for select
  using (public.is_admin());
create policy "tip_articles_admin_write"
  on public.tip_articles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Blocks / images / related: readable when parent article is published OR admin
drop policy if exists "tip_blocks_select" on public.tip_blocks;
drop policy if exists "tip_blocks_admin" on public.tip_blocks;
create policy "tip_blocks_select"
  on public.tip_blocks for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.tip_articles a
      where a.id = article_id and a.status = 'published'
    )
  );
create policy "tip_blocks_admin"
  on public.tip_blocks for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tip_images_select" on public.tip_images;
drop policy if exists "tip_images_admin" on public.tip_images;
create policy "tip_images_select"
  on public.tip_images for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.tip_articles a
      where a.id = article_id and a.status = 'published'
    )
  );
create policy "tip_images_admin"
  on public.tip_images for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tip_related_recipes_select" on public.tip_related_recipes;
drop policy if exists "tip_related_recipes_admin" on public.tip_related_recipes;
create policy "tip_related_recipes_select"
  on public.tip_related_recipes for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.tip_articles a
      where a.id = article_id and a.status = 'published'
    )
  );
create policy "tip_related_recipes_admin"
  on public.tip_related_recipes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tip_related_articles_select" on public.tip_related_articles;
drop policy if exists "tip_related_articles_admin" on public.tip_related_articles;
create policy "tip_related_articles_select"
  on public.tip_related_articles for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.tip_articles a
      where a.id = article_id and a.status = 'published'
    )
  );
create policy "tip_related_articles_admin"
  on public.tip_related_articles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Storage bucket for tip images
insert into storage.buckets (id, name, public)
values ('tips', 'tips', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "tips_public_read" on storage.objects;
drop policy if exists "tips_admin_insert" on storage.objects;
drop policy if exists "tips_admin_update" on storage.objects;
drop policy if exists "tips_admin_delete" on storage.objects;

create policy "tips_public_read"
  on storage.objects for select
  using (bucket_id = 'tips');

create policy "tips_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'tips' and public.is_admin());

create policy "tips_admin_update"
  on storage.objects for update
  using (bucket_id = 'tips' and public.is_admin())
  with check (bucket_id = 'tips' and public.is_admin());

create policy "tips_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'tips' and public.is_admin());

-- Seed categories once
insert into public.tip_categories (slug, name, sort_order)
select * from (
  values
    ('primus', 'Primus', 1),
    ('lite-kjokken', 'Lite kjøkken', 2),
    ('utstyr', 'Utstyr', 3),
    ('teknikk', 'Teknikk', 4),
    ('lite-oppvask', 'Lite oppvask', 5),
    ('tur', 'Tur', 6),
    ('studentkjokken', 'Studentkjøkken', 7)
) as seed(slug, name, sort_order)
where not exists (select 1 from public.tip_categories limit 1);

-- Seed a few example articles once (ids stable via slug)
do $$
declare
  cat_primus uuid;
  cat_oppvask uuid;
  cat_student uuid;
  a1 uuid;
  a2 uuid;
  a3 uuid;
begin
  if exists (select 1 from public.tip_articles limit 1) then
    return;
  end if;

  select id into cat_primus from public.tip_categories where slug = 'primus';
  select id into cat_oppvask from public.tip_categories where slug = 'lite-oppvask';
  select id into cat_student from public.tip_categories where slug = 'studentkjokken';

  insert into public.tip_articles (
    slug, title, excerpt, category_id, status, is_featured, sort_order,
    hero_image_url, published_at
  ) values (
    'primus-for-nybegynnere',
    'Primus for nybegynnere',
    'Trygg start: tenning, koking og slukking uten stress.',
    cat_primus, 'published', true, 1,
    '/images/tips/primus-hero.svg',
    now()
  ) returning id into a1;

  insert into public.tip_articles (
    slug, title, excerpt, category_id, status, is_featured, sort_order,
    hero_image_url, published_at
  ) values (
    'mindre-oppvask-paa-tur',
    'Mindre oppvask på tur',
    'Én gryte, smartere rekkefølge — og nesten tørr oppvaskklut.',
    cat_oppvask, 'published', false, 2,
    '/images/tips/oppvask-hero.svg',
    now()
  ) returning id into a2;

  insert into public.tip_articles (
    slug, title, excerpt, category_id, status, is_featured, sort_order,
    hero_image_url, published_at
  ) values (
    'studentkjokkenets-overlevelse',
    'Studentkjøkkenets overlevelsesguide',
    'Når kjøkkenet er lite og tid er knapp — slik lager du likevel skikkelig mat.',
    cat_student, 'published', false, 3,
    '/images/tips/student-hero.svg',
    now()
  ) returning id into a3;

  -- Article 1 blocks
  insert into public.tip_blocks (article_id, block_type, sort_order, payload) values
    (a1, 'intro', 1, '{"text":"Du trenger ikke være friluftsekspert for å mestre primusen. Her er det som faktisk betyr noe første gangene."}'::jsonb),
    (a1, 'tip', 2, '{"title":"Tips","text":"Sett primusen i le for vinden før du tenner. Det sparer både gass og nerver."}'::jsonb),
    (a1, 'steps', 3, '{"title":"Slik gjør du","items":["Sjekk at ventilen er lukket før du kobler gass.","Åpne forsiktig, tenn, juster flammen til jevn blå.","Kok med lokk — det går raskere og bruker mindre gass.","Slukk: skru av gassen først, la brenneren kjøle seg."]}'::jsonb),
    (a1, 'warning', 4, '{"title":"Unngå","text":"Ikke fyll eller bytt gasspatron inne i telt. Gjør det ute, med god avstand til flammer."}'::jsonb),
    (a1, 'equipment', 5, '{"title":"Utstyr","items":["Primus / gassbrenner","Gasspatron","Gryte med lokk","Lighter eller fyrstikker"]}'::jsonb),
    (a1, 'not_needed', 6, '{"title":"Dette trenger du egentlig ikke","items":["Ekstra «tur-spesial»-kokekarsett","Tre ulike gryter","Vindskjerm i overpriset aluminium — en steinmur funker ofte"]}'::jsonb),
    (a1, 'pro_tips', 7, '{"title":"Pro-tips","items":["Varm vann til te mens du spiser — da er oppvaskvannet klart etterpå.","Merk gassnivået etter tur, så du ikke starter neste tur tom."]}'::jsonb);

  insert into public.tip_blocks (article_id, block_type, sort_order, payload) values
    (a2, 'intro', 1, '{"text":"Oppvask er det som stjeler mest stemning på tur. Planlegg rekkefølgen — og la gryta jobbe for deg."}'::jsonb),
    (a2, 'checklist', 2, '{"title":"Før du starter","items":["Kok det feteste først (mindre liming på slutten)","Ha en bolle til skylling klar","Bruk så lite såpe som mulig"]}'::jsonb),
    (a2, 'tip', 3, '{"title":"Tips","text":"Tørk gryta med brødskorpe eller papir før vask — da er det nesten rent allerede."}'::jsonb),
    (a2, 'quote', 4, '{"text":"Den beste oppvasken er den du aldri trengte.","cite":"Feltregel"}'::jsonb),
    (a2, 'warning', 5, '{"title":"Unngå","text":"Ikke hell fettsky rett i bekken. Samle det og ta det med, eller la det stivne og pakk det."}'::jsonb);

  insert into public.tip_blocks (article_id, block_type, sort_order, payload) values
    (a3, 'intro', 1, '{"text":"Én kokeplate, lite benkeplate, mange romkamerater. Her er grepet som faktisk fungerer."}'::jsonb),
    (a3, 'text', 2, '{"text":"Tenk i «én-panne-retter» og lag litt ekstra til lunch dagen etter. Det sparer både tid og oppvask."}'::jsonb),
    (a3, 'equipment', 3, '{"title":"Minimums-kit","items":["God stekepanne","Én kasserolle","Skarp kniv","Skjærebrett som får plass i vasken"]}'::jsonb),
    (a3, 'not_needed', 4, '{"title":"Dette trenger du egentlig ikke","items":["Airfryer (enda)","Seks ulike krydderkverner","Marmelade-sett i tre etasjer"]}'::jsonb),
    (a3, 'pro_tips', 5, '{"title":"Pro-tips","items":["Stek løk og hvitløk først — resten smaker ferdig.","Bruk ovnen når du kan: den gir deg hendene fri."]}'::jsonb);

  insert into public.tip_related_articles (article_id, related_article_id, sort_order) values
    (a1, a2, 1),
    (a2, a1, 1),
    (a3, a2, 1);
end $$;
