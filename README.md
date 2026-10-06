# Fra gryte til gaffel

Norsk, mobilvennlig oppskriftsapp for begrensede kjøkken — én kokeplate, ingen ovn nødvendig. Tagline: *God mat trenger ikke et fullt kjøkken.*

## Hva som finnes

- Utforsk med søk, filtre (bunnark) og kuraterte seksjoner
- 15 oppskrifter i `src/data/recipes.ts` med illustrasjoner
- Detaljside med ingredienser, steg og praktiske tagger
- Handleliste (localStorage): legg til oppskrifter, kombiner mengder, huk av kjøpt
- Valgfri konto via **Supabase**: favoritter, mapper og private notater

Oppskriftene ligger lokalt i appen. Supabase lagrer kun `recipe_id` per bruker.
Handlelisten lagres i nettleseren (`localStorage`) og overlever oppfriskning.

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

For favoritter/mapper/notater: kjør også `supabase/schema.sql` i SQL Editor.

Detaljer: se `docs/accounts-setup.md` i prosjektets Context-mappe (eller README her).

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
