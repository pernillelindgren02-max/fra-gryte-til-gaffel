> **v2:** see [`product-analytics-v2.md`](./product-analytics-v2.md) — Innsikt workspace upgrade (rates, funnels, feedback, env).

# Product analytics — Fra gryte til gaffel

Admin-only aggregated product insights for product development (not ads).  
Events never block the UI; failures are silent. **No private note text, folder names, passwords, or secrets.**

**Audit finding:** No prior analytics system (no `trackEvent`, Innsikt, or analytics tables). Built as a single new stack — no duplicates.

Foundation / architecture audits are parked as stubs (`pre-launch-audit.md`, `pre-launch-architecture-audit.md`).

---

## 1. Full event list

| Event | When |
|-------|------|
| `session_start` | Once per tab (app open) |
| `explore_view` | Utforsk route |
| `explore_search` | Debounced search (length bucket only) |
| `explore_filter_apply` | Filter sheet applied |
| `explore_category_open` | Category chip opened |
| `recipe_view` | Recipe detail opened (+ entry source) |
| `recipe_favorite_add` / `recipe_favorite_remove` | Heart / save sheet |
| `recipe_shopping_add` | Added to handleliste |
| `recipe_share` | Reserved — no share UI yet |
| `recipe_spotify_open` | «Åpne i Spotify» |
| `recipe_portions_change` | Portion stepper |
| `pantry_view` | Hjemme route |
| `pantry_item_add` / `pantry_item_remove` | Pantry chips (no ingredient names) |
| `pantry_match_open` | Open recipe from Hjemme match |
| `shopping_view` | Handleliste route |
| `shopping_recipe_remove` | Remove recipe from list |
| `shopping_add_missing` | Reserved — no dedicated control yet |
| `favorites_view` | Favoritter route |
| `favorites_folder_create` | New folder (no name) |
| `favorites_folder_open` | Folder opened (`default` / `custom` only) |
| `note_save` | Note saved (char bucket only — **never text**) |
| `tips_landing_view` | Tips landing |
| `tips_article_view` | Tip article (`slug` only) |
| `onboarding_step_view` | Step index shown |
| `onboarding_complete` / `onboarding_skip` | Finish / skip |
| `onboarding_replay` | «Slik fungerer appen» |

---

## 2. What each stores

Table `analytics_events`:

- `event_name`, `created_at`
- `anonymous_session_id` (local opaque id)
- `user_id` (optional, only if logged in — must match auth on insert)
- `recipe_id` (optional)
- `source` (short: explore, recipe, pantry, tips, …)
- `properties` JSON — allowlisted scalars only (buckets, counts, ids/slugs)

Sanitizer strips keys like `note`, `body`, `folder_name`, `password`, `email`, `secret`, long free text.

---

## 3. Privacy protections

- Insert RLS: anon/auth can insert; `user_id` must be null or `auth.uid()`
- Select/delete: **`is_admin()` only**
- No note text, folder names, raw search strings
- Search → `query_bucket` (`1-3`, `4-8`, …)
- Notes → `char_bucket` (`short` / `long`)
- Fail-silent; local buffer for Try Live when cloud insert fails
- Admin Innsikt shows aggregates, not user profiles

---

## 4. Innsikt structure

**Admin → Innsikt** (`/admin/innsikt`) — gated like all admin.

Tabs: Oversikt · Oppskrifter · Utforsk · Hjemme · Søk · Tips og triks · Onboarding

---

## 5. Date ranges

I dag · 7 dager · 30 dager · Alt

---

## 6. SQL file(s)

- Repo: `supabase/analytics.sql`
- Store: `docs/analytics.sql`

Creates table, indexes, RLS, RPCs `analytics_overview` / `analytics_top_recipes` (admin).

Requires `public.is_admin()`.

---

## 7. How to generate test events

1. Use the app: Utforsk → søk/filter/kategori → oppskrift → favoritt/handleliste/Spotify/porsjoner; Hjemme; Tips; onboarding replay.
2. DevTools console (dev build):

```js
__fgtgTrack('recipe_view', { recipeId: 'pokebowl-laks', source: 'explore' })
__fgtgAnalyticsBuffer()?.length
```

---

## 8. How to verify collection

1. Run `supabase/analytics.sql` in Supabase.
2. Use the app → Table Editor → `analytics_events` (as admin) or SQL `select event_name, count(*) from analytics_events group by 1`.
3. Admin → Innsikt → Oppdater (sky when RLS OK; else local buffer message).
4. Console: `__fgtgAnalyticsBuffer()` in DEV.

---

## 9. Intentionally NOT collected

- Note bodies / titles as free text  
- Folder names  
- Raw search queries  
- Emails, passwords, tokens  
- Precise GPS / device fingerprinting  
- Per-user behaviour profiles or surveillance timelines  
- Ad/attribution SDKs  

Reserved unwired: `recipe_share`, `shopping_add_missing` (no UI yet).

---

## 10. Launch checklist

| Item | Status |
|------|--------|
| Central `trackEvent` | ✅ |
| Fail-silent / non-blocking | ✅ |
| Admin-only read RLS | ✅ |
| Innsikt UI + periods | ✅ |
| No note text to admin | ✅ |
| SQL seeded in repo + store | ✅ |
| SQL run in production Supabase | ⚠️ Must run before cloud Innsikt |
| Share / missing-ingredients events | ⚠️ Reserved until UI exists |
| Duplicate analytics systems | ✅ None found / none added |

---

## 11. Confirm no private notes visible to Admin

**Confirmed.** `note_save` stores only `char_bucket`. Forbidden property keys block `note` / `body` / `text`. Innsikt has no note content view.

---

## 12. Confirm nothing pushed to GitHub

**Confirmed.** No commit / push in this session. HEAD unchanged vs remote.

---

## Try Live

- App: [Explore](http://127.0.0.1:4317/)
- Innsikt (admin): [Admin Innsikt](http://127.0.0.1:4317/admin/innsikt)

Screenshots in `media/`: `analytics-innsikt-preview.png`, `analytics-innsikt-gate.png`, `analytics-recipe-view.png`, `analytics-tips-view.png`.
