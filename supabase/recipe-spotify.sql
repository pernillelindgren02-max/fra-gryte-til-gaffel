-- Optional Spotify mood fields for «Sett stemningen» on recipe detail.
-- Run in Supabase → SQL Editor after recipes-admin.sql.
-- Safe to re-run (IF NOT EXISTS / additive columns).

alter table public.recipes
  add column if not exists spotify_title text,
  add column if not exists spotify_artist text,
  add column if not exists spotify_url text,
  add column if not exists spotify_code_image text;

comment on column public.recipes.spotify_title is 'Optional mood track title for Sett stemningen';
comment on column public.recipes.spotify_artist is 'Optional mood track artist';
comment on column public.recipes.spotify_url is 'Spotify open.spotify.com or spotify: URI';
comment on column public.recipes.spotify_code_image is 'Optional Spotify Code image path in recipe-images bucket';
