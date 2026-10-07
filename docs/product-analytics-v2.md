# Product analytics v2 — Innsikt workspace

Admin-only product analytics for Fra gryte til gaffel. Extends the **single** stack (`trackEvent` → `analytics_events`). Fail-silent. No ads. Private recipe notes = **metadata only, never text**. Intentional feedback uses separate `product_feedback` + «Gi tilbakemelding».

**Do not push to GitHub/Netlify until Pernille says so.**

---

## First audit (v1 → v2)

| Item | Verdict | Notes |
|------|---------|--------|
| Single `trackEvent` / `analytics_events` | ✅ | Extended, not duplicated |
| Fail-silent / never blocks UI | ✅ | try/catch + fire-and-forget insert |
| Admin-only Innsikt + RLS `is_admin()` | ✅ | Select hardened; insert anon/auth |
| Private notes never text | ✅ | `note_save` char_bucket only; sanitizer strips note keys |
| Search privacy (buckets) | ✅ | Extended with optional `validated_term` vs known vocab |
| Local buffer for Try Live | ✅ | `fgtg-analytics-buffer-v1` |
| Periods today/7/30 | ✅ → ✅ | +90d, all, custom |
| Recipe rates (unique sessions) | ⚠️ → ✅ | v1 used raw counts; v2 unique viewers/actors + min sample |
| Funnels / retention / paths | ❌ → ✅ | Client aggregates |
| Feedback system | ❌ → ✅ | `product_feedback` + rules sentiment |
| env/dev vs prod | ❌ → ✅ | Column + Admin filter |
| route_view / path analysis | ❌ → ✅ | `trackRouteView` |
| Explore card impressions/CTR | ❌ | **Skipped** — high volume / low value without sampling |
| Heatmaps | ❌ | **Skipped** — action rankings instead |
| Third-party AI on feedback | ❌ | **Not wired** — architecture documented; rules v1 only |
| Share UI event | ⚠️ | Event exists; no share control yet |
| `shopping_add_missing` | ⚠️ | Event reserved; limited wiring |

---

## 1. Taxonomy

**Events** (extend `ANALYTICS_EVENTS` in `src/lib/analytics.ts`):

| Event | Purpose |
|-------|---------|
| `session_start` | Tab session |
| `route_view` | Path transitions (`path` / `from_path`) |
| `explore_*` | Utforsk view/search/filter/category/recipe_click |
| `recipe_*` | View, favorite ±, shopping, share*, spotify, portions |
| `pantry_*` | View, item ±, match open |
| `shopping_*` | View, remove, add_missing* |
| `favorites_*` | View, folder create/open (no names) |
| `note_save` | Metadata only (`char_bucket`) |
| `tips_*` | Landing + article (`slug`) |
| `onboarding_*` | Step / complete / skip / replay |
| `feedback_submit` | Intentional feedback sent (no body in event props) |
| `tech_client_error` | Scope + short kind |

**Tables:** `analytics_events` (+ `env`, `path`, `from_path`) · `product_feedback` (analyzable body)

**Properties policy:** scalars ≤80 chars; forbidden keys (`note`, `body`, `folder_name`, secrets…); search terms only if `validatedSearchTerm` matches public vocabulary.

---

## 2. Dashboard structure

**Admin → Innsikt** tabs:

Oversikt · Brukerflyt · Oppskrifter · Utforsk · Hjemme · Søk · Handleliste · Favoritter · Tips · Onboarding · Tilbakemeldinger · Teknisk · Retention

Controls: period (today/7/30/90/all/custom) · env (all/prod/dev) · exclude test (prod only) · CSV export · recipe sort + min-sample filter · recipe drill-down.

---

## 3. Graphs / metrics

- KPI cards with previous-period % when data exists  
- Daily session bars  
- Feature adoption % (unique sessions / all sessions)  
- Action ranking (sessions + share of sessions)  
- Recipe list: **count + rate** everywhere (`50 lagret · 35.2%`)  
- Mini bar charts for categories, search buckets, time-to-action  
- Funnel steps with from-prev / from-start %  
- Retention table D1/D7/D30  

Rates use **unique sessions** as numerator/denominator (not raw repeats).

---

## 4. Funnels

| Funnel | Steps |
|--------|-------|
| Discovery | Utforsk → søk/filter/kategori → recipe_click → fav/shop |
| Hjemme | view → item_add → match_open → shopping |
| Søk | search → open from search → favorite after |
| Oppskrift | view → engage → favorite → shopping |
| Onboarding | step_view → complete |

---

## 5. Retention

Anonymous-session cohorts by first-seen day. D1 / D7 / D30 shown when cohort is old enough; else «—». Skip heavy cross-device identity (no invasive fingerprint).

---

## 6. Recipe metrics

Per recipe (unique viewers as denominator unless noted):

- Favorite rate = unique favoriters / unique viewers  
- Shopping rate, share rate, Spotify rate, note rate (count-only notes)  
- Repeat-view rate = returning viewers / unique viewers  
- Sort: views, fav count/rate, shop count/rate, share rate, repeat rate  
- **Min sample:** `MIN_RECIPE_SAMPLE = 3` — «Top performing» excludes tiny samples; UI flags `kun 1 seer` / «lite utvalg»  
- **Benchmarks:** ± pp vs app-average rate when enough data  

---

## 7. Hjemme

- Unique view sessions, unique match opens  
- Conversion = opens / Hjemme impressions (session-based)  
- Funnel + `ingredient_key` popularity **only** when add matches known recipe vocabulary  

---

## 8. Search

- Length buckets always  
- `validated_term` only vs recipe names / category labels  
- `zero_results` flag + result_bucket  
- Search conversion funnel when `source`/`via` = search  

---

## 9. Feedback + text analysis

- UI: Konto → **Gi tilbakemelding** (`FeedbackSheet`)  
- Table `product_feedback` (body 3–2000 chars)  
- **v1 analysis:** local keyword sentiment + tags (`feedbackAnalysis.ts`) — **no third-party AI**  
- **AI architecture (not enabled):** Admin opt-in → explicit confirm → edge function with server key → store model tags with provenance. Never silent egress.  

---

## 10. What stays private

| Data | Policy |
|------|--------|
| Private recipe notes | Never text — `note_save` metadata only |
| Folder names | Never — only `default`/`custom` |
| Raw search free text | Never — buckets ± validated public terms |
| Emails / passwords / tokens | Sanitizer + RLS |
| Feedback body | Only via intentional form → `product_feedback` (Admin) |
| Fingerprints | Device class by viewport width only |

---

## 11. Technical health

- `tech_client_error` from `logTechError` (scope + short kind)  
- Counts / sessions / by path  
- Device class aggregates  

---

## 12. Data quality

- Client dedup ~800ms same event+recipe+path  
- Env tagging `dev`/`prod`  
- Admin exclude test data  
- Local buffer when Supabase missing  
- Sample flags on recipe rates  
- Previous-period comparison when range allows  

---

## 13. Env separation

- `analytics_events.env` / `product_feedback.env`  
- Client: `import.meta.env.PROD ? 'prod' : 'dev'`  
- Innsikt filter: Alle / Prod / Dev + «Ekskluder testdata»  

---

## 14. SQL files

| File | Role |
|------|------|
| `supabase/analytics.sql` | v1 table + RLS + overview RPCs |
| `supabase/analytics-innsikt-v2.sql` | **Additive** env/path, `product_feedback`, hardened insert, `analytics_daily_series` |
| Store copy | `docs/analytics-innsikt-v2.sql` (agent store + `/workspace/docs/`) |

Run v1 then v2 in Supabase SQL Editor. Does **not** drop existing events.

---

## 15. Test plan

1. Dev server `:4317` — browse Utforsk → søk → oppskrift → favoritt / handleliste / Spotify / notat  
2. Hjemme: add known ingredient → open match  
3. Konto → Gi tilbakemelding → send; check Tilbakemeldinger tab (local if no SQL)  
4. Console: `window.__fgtgTrack('recipe_view', { recipeId: '…' })`  
5. Admin Innsikt: periods, env filter, recipe sort, min-sample toggle, drill-down, CSV  
6. Confirm note text never in buffer (`__fgtgAnalyticsBuffer`)  
7. After SQL: cloud source label; RLS as non-admin cannot select  

---

## 16. Privacy before launch

- [ ] Run `analytics.sql` + `analytics-innsikt-v2.sql`  
- [ ] Confirm `is_admin()` only for select  
- [ ] Spot-check events: no note/folder/raw search text  
- [ ] Feedback copy discloses Admin may read text  
- [ ] Default Innsikt to prod / exclude dev in production use  
- [ ] No third-party analytics SDKs without explicit decision  

---

## 17. Checklist ✅ / ⚠️ / ❌

See **First audit** table above. Shipped ✅ for core workspace; ⚠️ reserved events / share UI; ❌ skipped impressions heatmaps & silent AI.

---

## 18. Confirm not pushed

**No `git commit` / `git push` / Netlify deploy performed for this Innsikt v2 work** (per Pernille CRITICAL). Cloud-only until she says «Push this to GitHub».

---

## How to generate test events

```js
// Dev console
window.__fgtgTrack('recipe_view', { recipeId: 'some-id', source: 'explore' })
window.__fgtgAnalyticsBuffer()
```

Or use the app normally; local buffer feeds Innsikt without Supabase.
