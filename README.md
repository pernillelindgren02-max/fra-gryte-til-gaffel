# Fra gryte til gaffel

Norsk, mobilvennlig oppskriftsapp for begrensede kjøkken — én kokeplate, ingen ovn nødvendig. Tagline: *God mat trenger ikke et fullt kjøkken.*

## Hva som finnes

- Utforsk med søk, filtre (bunnark) og kuraterte seksjoner
- Oppskrifter lastes som **publiserte** rader fra Supabase (lokal fallback hvis DB er tom/ute)
- Detaljside med ingredienser, steg og praktiske tagger
- Handleliste (localStorage): legg til oppskrifter, kombiner mengder, huk av kjøpt
- Valgfri konto via **Supabase**: favoritter, mapper og private notater
- Privat admin på `/admin` (ingen knapp i app-UI) når `profiles.is_admin`

Handlelisten lagres i nettleseren (`localStorage`). Favoritter/mapper/notater bruker `recipe_id`.

## Kom i gang (uten konto)

```bash
npm install
npm run dev
```

Åpne [http://127.0.0.1:4317](http://127.0.0.1:4317).

Uten Supabase-nøkler kjører appen som før; favoritter/mapper/notater ber deg sette opp konto.

## Supabase (tilkobling + konto)

1. Opprett et prosjekt på [supabase.com](https://supabase.com).
2. Under **Project Settings → API**, kopier **Project URL** og **publishable / anon public** key.
3. Åpne **`.env.local`** i prosjektroten og lim inn:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

4. Lagre og **start Vite på nytt** (`npm run dev`).
5. Åpne nettleserkonsollen: du skal se `[Supabase] Tilkobling OK (auth.getSession).`

For favoritter/mapper/notater: kjør `supabase/schema.sql` i SQL Editor.

For oppskriftsadmin (publisering / bilder):

1. Kjør `supabase/admin-bootstrap.sql`, deretter `supabase/recipes-admin.sql`.
2. Logg inn via **Konto**, kopier din User UID i Supabase Auth, og sett `is_admin` (se kommentaren i bootstrap-filen — lim inn UID i SQL Editor, ikke i chat).
3. Logg ut/inn, åpne **http://127.0.0.1:4317/admin**, klikk **Importer lokale**.

Steg-for-steg: `docs/admin-plan.md` i Context-mappen.

I Supabase Auth kan du skru av e-postbekreftelse under Authentication → Providers → Email hvis du vil teste raskt lokalt.

## Stack

- React + Vite + TypeScript
- React Router
- Vanlig CSS med CSS-variabler
- Supabase Auth + Postgres (RLS) for personlige data

## Scripts

| Kommando          | Beskrivelse        |
|-------------------|--------------------|
| `npm run dev`     | Utviklingsserver   |
| `npm run build`   | Produksjonsbygg    |
| `npm run preview` | Forhåndsvis bygg   |
