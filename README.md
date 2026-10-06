# Fra gryte til gaffel

Norsk, mobilvennlig oppskriftsapp for begrensede kjøkken — én kokeplate, ingen ovn nødvendig. Tagline: *God mat trenger ikke et fullt kjøkken.*

## Hva som finnes i MVP

- Hjemside med merkevare, kort intro og oppskriftoversikt
- Oppskriftskort (navn, bildeplassholder, tid, antall ingredienser, måltid, primus-indikator)
- Flervalgfiltre (tid, forberedelser, ingredienser, oppbevaring, måltid, pris, oppvask, turvennlighet, vannbehov)
- Nullstill alle filtre
- Detaljside per oppskrift
- 3 midlertidige oppskrifter i `src/data/recipes.ts`

Ingen backend, innlogging eller database.

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Stack

- React + Vite + TypeScript
- React Router
- Vanlig CSS med CSS-variabler

## Scripts

| Kommando        | Beskrivelse              |
|-----------------|--------------------------|
| `npm run dev`   | Utviklingsserver         |
| `npm run build` | Produksjonsbygg          |
| `npm run preview` | Forhåndsvis bygg       |
