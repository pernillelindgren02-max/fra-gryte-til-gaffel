import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../../context/RecipesContext'
import {
  fetchAnalyticsEvents,
  uniqueSessions,
  type AnalyticsEnv,
  type AnalyticsEventRow,
  type AnalyticsPeriod,
} from '../../lib/analytics'
import {
  actionRanking,
  buildFunnel,
  buildHjemmeConversion,
  buildRecipeIntelligence,
  buildSearchFunnel,
  commonPaths,
  computeRetention,
  dailySeries,
  deviceBreakdown,
  eventsToCsv,
  featureAdoption,
  formatCountRate,
  FUNNELS,
  MIN_RECIPE_SAMPLE,
  overviewKpis,
  pantryIngredientPopularity,
  pathTransitions,
  pct,
  ppDelta,
  propString,
  searchIntelligence,
  sortRecipes,
  sourceAttribution,
  technicalHealth,
  timeToActionBuckets,
  type RecipeSortKey,
} from '../../lib/analyticsAggregates'
import {
  fetchProductFeedback,
  updateFeedbackStatus,
  type ProductFeedbackRow,
} from '../../lib/feedbackApi'
import { FEEDBACK_AI_ARCHITECTURE_NOTE } from '../../lib/feedbackAnalysis'
import './Admin.css'

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'today', label: 'I dag' },
  { id: '7d', label: '7 dager' },
  { id: '30d', label: '30 dager' },
  { id: '90d', label: '90 dager' },
  { id: 'all', label: 'Alt' },
  { id: 'custom', label: 'Egendefinert' },
]

type TabId =
  | 'overview'
  | 'flow'
  | 'recipes'
  | 'explore'
  | 'pantry'
  | 'search'
  | 'shopping'
  | 'favorites'
  | 'tips'
  | 'onboarding'
  | 'feedback'
  | 'technical'
  | 'retention'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Oversikt' },
  { id: 'flow', label: 'Brukerflyt' },
  { id: 'recipes', label: 'Oppskrifter' },
  { id: 'explore', label: 'Utforsk' },
  { id: 'pantry', label: 'Hjemme' },
  { id: 'search', label: 'Søk' },
  { id: 'shopping', label: 'Handleliste' },
  { id: 'favorites', label: 'Favoritter' },
  { id: 'tips', label: 'Tips' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'feedback', label: 'Tilbakemeldinger' },
  { id: 'technical', label: 'Teknisk' },
  { id: 'retention', label: 'Retention' },
]

const RECIPE_SORTS: { id: RecipeSortKey; label: string }[] = [
  { id: 'views', label: 'Visninger' },
  { id: 'favorites', label: 'Favoritt-antall' },
  { id: 'fav_rate', label: 'Favoritt-rate' },
  { id: 'shopping', label: 'Handleliste-antall' },
  { id: 'shop_rate', label: 'Handleliste-rate' },
  { id: 'share_rate', label: 'Del-rate' },
  { id: 'repeat_rate', label: 'Gjenbesøk-rate' },
]

function MiniBars({
  rows,
}: {
  rows: { label: string; value: number; max?: number }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.max ?? r.value))
  return (
    <ul className="innsikt-bars">
      {rows.map((r) => (
        <li key={r.label} className="innsikt-bars__row">
          <span className="innsikt-bars__label">{r.label}</span>
          <span className="innsikt-bars__track">
            <span
              className="innsikt-bars__fill"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </span>
          <span className="innsikt-bars__value">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

function FunnelBlock({
  title,
  steps,
}: {
  title: string
  steps: {
    label: string
    sessions: number
    conversionFromStart: number | null
    conversionFromPrev: number | null
  }[]
}) {
  return (
    <section className="innsikt-panel">
      <h3 className="innsikt-panel__title">{title}</h3>
      <ol className="innsikt-funnel">
        {steps.map((s, i) => (
          <li key={s.label} className="innsikt-funnel__step">
            <span className="innsikt-funnel__n">{i + 1}</span>
            <div>
              <p className="admin-list__name">{s.label}</p>
              <p className="admin-list__meta">
                {s.sessions} unike økter
                {s.conversionFromPrev != null && i > 0
                  ? ` · ${pct(s.conversionFromPrev)} fra forrige`
                  : ''}
                {s.conversionFromStart != null
                  ? ` · ${pct(s.conversionFromStart)} fra start`
                  : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function AdminInnsiktPage() {
  const { recipes } = useRecipes()
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [env, setEnv] = useState<AnalyticsEnv | 'all'>('all')
  const [excludeDev, setExcludeDev] = useState(false)
  const [tab, setTab] = useState<TabId>('overview')
  const [events, setEvents] = useState<AnalyticsEventRow[]>([])
  const [previous, setPrevious] = useState<AnalyticsEventRow[]>([])
  const [source, setSource] = useState<'supabase' | 'local'>('local')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [recipeSort, setRecipeSort] = useState<RecipeSortKey>('views')
  const [topOnly, setTopOnly] = useState(true)
  const [drillRecipe, setDrillRecipe] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ProductFeedbackRow[]>([])
  const [feedbackSource, setFeedbackSource] = useState<'supabase' | 'local'>(
    'local',
  )

  const recipeName = useMemo(() => {
    const map = new Map(recipes.map((r) => [r.id, r.name]))
    return (id: string) => map.get(id) ?? id
  }, [recipes])

  const effectiveEnv: AnalyticsEnv | 'all' = excludeDev ? 'prod' : env

  async function reload() {
    setLoading(true)
    try {
      const custom =
        period === 'custom' && customFrom && customTo
          ? { from: customFrom, to: customTo }
          : undefined
      const result = await fetchAnalyticsEvents({
        period,
        custom,
        env: effectiveEnv,
        includePrevious: true,
      })
      setEvents(result.events)
      setPrevious(result.previous)
      setSource(result.source)
      setMessage(
        result.source === 'local'
          ? 'Viser lokal buffer (kjør supabase/analytics.sql + analytics-innsikt-v2.sql for sky-Innsikt).'
          : null,
      )
      const fb = await fetchProductFeedback({ env: effectiveEnv })
      setFeedback(fb.rows)
      setFeedbackSource(fb.source)
    } catch {
      setEvents([])
      setPrevious([])
      setMessage('Kunne ikke hente Innsikt.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filters
  }, [period, customFrom, customTo, effectiveEnv])

  const sessions = uniqueSessions(events)
  const kpis = useMemo(() => overviewKpis(events, previous), [events, previous])
  const series = useMemo(() => dailySeries(events), [events])
  const { recipes: recipeIntel, benchmarks } = useMemo(
    () => buildRecipeIntelligence(events),
    [events],
  )
  const sortedRecipes = useMemo(
    () => sortRecipes(recipeIntel, recipeSort, { topOnly }),
    [recipeIntel, recipeSort, topOnly],
  )
  const discoveryFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.discovery]),
    [events],
  )
  const hjemmeFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.hjemme]),
    [events],
  )
  const recipeFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.recipe]),
    [events],
  )
  const onboardingFunnel = useMemo(
    () => buildFunnel(events, [...FUNNELS.onboarding]),
    [events],
  )
  const searchFunnel = useMemo(() => buildSearchFunnel(events), [events])
  const hjemmeConv = useMemo(() => buildHjemmeConversion(events), [events])
  const paths = useMemo(() => pathTransitions(events).slice(0, 15), [events])
  const journeys = useMemo(() => commonPaths(events), [events])
  const retention = useMemo(() => computeRetention(events), [events])
  const adoption = useMemo(() => featureAdoption(events), [events])
  const devices = useMemo(() => deviceBreakdown(events), [events])
  const sources = useMemo(() => sourceAttribution(events), [events])
  const tta = useMemo(() => timeToActionBuckets(events), [events])
  const actions = useMemo(() => actionRanking(events), [events])
  const search = useMemo(() => searchIntelligence(events), [events])
  const pantryKeys = useMemo(() => pantryIngredientPopularity(events), [events])
  const tech = useMemo(() => technicalHealth(events), [events])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      if (e.event_name !== 'explore_category_open') continue
      const id = propString(e, 'category_id') ?? 'ukjent'
      map.set(id, (map.get(id) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const tipSlugs = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      if (e.event_name !== 'tips_article_view') continue
      const slug = propString(e, 'slug') ?? e.source ?? 'ukjent'
      map.set(slug, (map.get(slug) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const onboardingSteps = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of events) {
      if (e.event_name !== 'onboarding_step_view') continue
      const step = Number(e.properties?.step_index ?? 0)
      map.set(step, (map.get(step) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([step, count]) => ({ step, count }))
  }, [events])

  const drill = drillRecipe
    ? recipeIntel.find((r) => r.recipe_id === drillRecipe)
    : null

  function downloadCsv() {
    const csv = eventsToCsv(events)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `innsikt-${period}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin innsikt">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Innsikt</p>
          <h1 className="admin__title">Produktanalyse</h1>
        </div>
        <div className="admin__header-actions">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={downloadCsv}
            disabled={events.length === 0}
          >
            Eksporter CSV
          </button>
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => void reload()}
          >
            Oppdater
          </button>
        </div>
      </header>

      <p className="admin__muted">
        Aggregerte hendelser for produktutvikling — ikke annonser, ikke
        enkeltbruker-overvåkning. Private notater: kun metadata. Rater bruker
        unike økter som nevner.
      </p>

      <div className="admin-filter-tabs" role="tablist" aria-label="Periode">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`admin-filter-tabs__btn${period === p.id ? ' admin-filter-tabs__btn--active' : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' ? (
        <div className="innsikt-custom-range">
          <label>
            Fra
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <label>
            Til
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className="innsikt-env-row">
        <div className="admin-filter-tabs" role="tablist" aria-label="Miljø">
          {(
            [
              { id: 'all', label: 'Alle miljø' },
              { id: 'prod', label: 'Prod' },
              { id: 'dev', label: 'Dev' },
            ] as const
          ).map((e) => (
            <button
              key={e.id}
              type="button"
              className={`admin-filter-tabs__btn${env === e.id && !excludeDev ? ' admin-filter-tabs__btn--active' : ''}`}
              onClick={() => {
                setExcludeDev(false)
                setEnv(e.id)
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
        <label className="innsikt-check">
          <input
            type="checkbox"
            checked={excludeDev}
            onChange={(e) => setExcludeDev(e.target.checked)}
          />
          Ekskluder testdata (kun prod)
        </label>
      </div>

      <div
        className="admin-filter-tabs innsikt-section-tabs"
        role="tablist"
        aria-label="Seksjon"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-filter-tabs__btn${tab === t.id ? ' admin-filter-tabs__btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message ? <p className="admin__message">{message}</p> : null}
      <p className="admin__muted">
        Kilde: {source === 'supabase' ? 'Supabase' : 'Lokal buffer'} ·{' '}
        {events.length} hendelser · {sessions} unike økter
        {previous.length > 0 ? ` · forrige periode: ${previous.length}` : ''}
      </p>

      {loading ? <p className="admin__muted">Laster…</p> : null}

      {!loading && events.length === 0 && tab !== 'feedback' ? (
        <p className="admin__muted">
          Ingen hendelser i perioden. Bruk appen eller{' '}
          <code>window.__fgtgTrack</code> i dev — se{' '}
          <code>docs/product-analytics-v2.md</code>.
        </p>
      ) : null}

      {/* —— OVERSIKT —— */}
      {!loading && tab === 'overview' && events.length > 0 ? (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">{kpis.sessions.value}</p>
              <p className="admin-stat__label">Unike økter</p>
              {kpis.sessions.delta ? (
                <p className="innsikt-delta">{kpis.sessions.delta}</p>
              ) : null}
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{kpis.views.value}</p>
              <p className="admin-stat__label">Oppskriftsvisninger</p>
              {kpis.views.delta ? (
                <p className="innsikt-delta">{kpis.views.delta}</p>
              ) : null}
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{kpis.searches.value}</p>
              <p className="admin-stat__label">Søk</p>
              {kpis.searches.delta ? (
                <p className="innsikt-delta">{kpis.searches.delta}</p>
              ) : null}
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">
                {kpis.favRate.rateLabel}
              </p>
              <p className="admin-stat__label">
                Favoritt-rate ({kpis.favRate.unique} / seere)
              </p>
            </div>
          </div>

          <h2 className="admin__section-title">Tidsserie (økter / dag)</h2>
          <MiniBars
            rows={series.map((s) => ({
              label: s.day.slice(5),
              value: s.sessions,
            }))}
          />

          <h2 className="admin__section-title">Feature-adopsjon</h2>
          <ul className="admin-list">
            {adoption.map((a) => (
              <li key={a.feature} className="admin-list__item">
                <div>
                  <p className="admin-list__name">{a.feature}</p>
                  <p className="admin-list__meta">
                    {formatCountRate(a.sessions, a.rate, 'økter')}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="admin__section-title">Handlingsranking</h2>
          <ul className="admin-list">
            {actions.slice(0, 12).map((a) => (
              <li key={a.event_name} className="admin-list__item">
                <div>
                  <p className="admin-list__name">{a.event_name}</p>
                  <p className="admin-list__meta">
                    {a.count} hendelser · {a.sessions} økter · {pct(a.share)} av
                    økter
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* —— BRUKERFLYT —— */}
      {!loading && tab === 'flow' && events.length > 0 ? (
        <>
          <FunnelBlock title="Discovery-funnel" steps={discoveryFunnel} />
          <FunnelBlock title="Oppskrift-funnel" steps={recipeFunnel} />
          <h2 className="admin__section-title">Ruteoverganger</h2>
          {paths.length === 0 ? (
            <p className="admin__muted">
              Ingen <code>route_view</code> ennå — krever AnalyticsBootstrap v2.
            </p>
          ) : (
            <ul className="admin-list">
              {paths.map((p) => (
                <li key={`${p.from}-${p.to}`} className="admin-list__item">
                  <div>
                    <p className="admin-list__name">
                      {p.from} → {p.to}
                    </p>
                    <p className="admin-list__meta">
                      {p.count} · {p.sessions} økter
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <h2 className="admin__section-title">Vanlige stier</h2>
          <ul className="admin-list">
            {journeys.map((j) => (
              <li key={j.path} className="admin-list__item">
                <div>
                  <p className="admin-list__name">{j.path}</p>
                  <p className="admin-list__meta">{j.sessions} økter</p>
                </div>
              </li>
            ))}
          </ul>
          <h2 className="admin__section-title">Tid til handling</h2>
          <MiniBars rows={tta.map((t) => ({ label: t.bucket, value: t.count }))} />
          <h2 className="admin__section-title">Kildeattribusjon (recipe_view)</h2>
          <ul className="admin-list">
            {sources.map((s) => (
              <li key={s.source} className="admin-list__item">
                <div>
                  <p className="admin-list__name">{s.source}</p>
                  <p className="admin-list__meta">
                    {s.views} visninger · {s.sessions} økter
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* —— OPPSKRIFTER —— */}
      {!loading && tab === 'recipes' ? (
        <>
          <p className="admin__muted">
            Rater = unike økter som gjorde handling / unike seere. Topp
            performer krever ≥ {MIN_RECIPE_SAMPLE} unike seere. Snitt: favoritt{' '}
            {benchmarks.fav_rate != null ? pct(benchmarks.fav_rate) : '—'} ·
            handleliste{' '}
            {benchmarks.shop_rate != null ? pct(benchmarks.shop_rate) : '—'}.
          </p>
          <div className="innsikt-toolbar">
            <div className="admin-filter-tabs" role="tablist" aria-label="Sorter">
              {RECIPE_SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`admin-filter-tabs__btn${recipeSort === s.id ? ' admin-filter-tabs__btn--active' : ''}`}
                  onClick={() => setRecipeSort(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className="innsikt-check">
              <input
                type="checkbox"
                checked={topOnly}
                onChange={(e) => setTopOnly(e.target.checked)}
              />
              Kun tilstrekkelig utvalg (≥{MIN_RECIPE_SAMPLE})
            </label>
          </div>

          {drill ? (
            <section className="innsikt-panel innsikt-panel--drill">
              <div className="innsikt-panel__head">
                <h3 className="innsikt-panel__title">
                  {recipeName(drill.recipe_id)}
                </h3>
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  onClick={() => setDrillRecipe(null)}
                >
                  Lukk
                </button>
              </div>
              <ul className="innsikt-rate-grid">
                <li>
                  {drill.views} visninger · {drill.unique_viewers} unike seere
                  {drill.sample_note ? ` (${drill.sample_note})` : ''}
                </li>
                <li>
                  {formatCountRate(
                    drill.unique_favoriters,
                    drill.fav_rate,
                    'lagret',
                    drill.sample_note,
                  )}
                  {ppDelta(drill.fav_rate, benchmarks.fav_rate)
                    ? ` · ${ppDelta(drill.fav_rate, benchmarks.fav_rate)}`
                    : ''}
                </li>
                <li>
                  {formatCountRate(
                    drill.unique_shoppers,
                    drill.shop_rate,
                    'handleliste',
                    drill.sample_note,
                  )}
                  {ppDelta(drill.shop_rate, benchmarks.shop_rate)
                    ? ` · ${ppDelta(drill.shop_rate, benchmarks.shop_rate)}`
                    : ''}
                </li>
                <li>
                  {formatCountRate(
                    drill.unique_sharers,
                    drill.share_rate,
                    'delt',
                    drill.sample_note,
                  )}
                </li>
                <li>
                  {formatCountRate(
                    drill.unique_spotify,
                    drill.spotify_rate,
                    'Spotify',
                    drill.sample_note,
                  )}
                </li>
                <li>
                  {formatCountRate(
                    drill.unique_noters,
                    drill.note_rate,
                    'notat (metadata)',
                    drill.sample_note,
                  )}
                </li>
                <li>
                  {formatCountRate(
                    drill.repeat_viewers,
                    drill.repeat_rate,
                    'gjenbesøk',
                    drill.sample_note,
                  )}
                </li>
                <li>Toppkilde: {drill.top_source ?? '—'}</li>
              </ul>
              <Link
                to={`/oppskrift/${drill.recipe_id}`}
                className="admin__btn admin__btn--ghost"
              >
                Åpne oppskrift
              </Link>
            </section>
          ) : null}

          {sortedRecipes.length === 0 ? (
            <p className="admin__muted">
              Ingen oppskrifter matcher filteret
              {topOnly
                ? ` (prøv å skru av «Kun tilstrekkelig utvalg» — små utvalg vises med advarsel).`
                : '.'}
            </p>
          ) : (
            <ul className="admin-list">
              {sortedRecipes.slice(0, 40).map((row) => (
                <li key={row.recipe_id} className="admin-list__item">
                  <div>
                    <button
                      type="button"
                      className="admin-list__name innsikt-linkish"
                      onClick={() => setDrillRecipe(row.recipe_id)}
                    >
                      {recipeName(row.recipe_id)}
                    </button>
                    <p className="admin-list__meta">
                      {row.views} visn. · {row.unique_viewers} seere ·{' '}
                      {formatCountRate(
                        row.unique_favoriters,
                        row.fav_rate,
                        'lagret',
                        row.sample_note,
                      )}{' '}
                      ·{' '}
                      {formatCountRate(
                        row.unique_shoppers,
                        row.shop_rate,
                        'handleliste',
                        row.sample_note,
                      )}
                      {row.sample_ok &&
                      ppDelta(row.fav_rate, benchmarks.fav_rate)
                        ? ` · ${ppDelta(row.fav_rate, benchmarks.fav_rate)}`
                        : ''}
                      {!row.sample_ok ? (
                        <span className="innsikt-flag"> · lite utvalg</span>
                      ) : null}
                    </p>
                  </div>
                  <Link
                    to={`/oppskrift/${row.recipe_id}`}
                    className="admin__btn admin__btn--ghost"
                  >
                    Åpne
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!topOnly && recipeIntel.some((r) => !r.sample_ok) ? (
            <p className="admin__muted">
              Oppskrifter med &lt; {MIN_RECIPE_SAMPLE} seere er flagget «lite
              utvalg» — 1/1 = 100% krones ikke som topp uten filter.
            </p>
          ) : null}
        </>
      ) : null}

      {/* —— UTFORSK —— */}
      {!loading && tab === 'explore' && events.length > 0 ? (
        <>
          <FunnelBlock title="Discovery" steps={discoveryFunnel} />
          <h2 className="admin__section-title">Kategorier</h2>
          <MiniBars
            rows={categories.map((c) => ({ label: c.label, value: c.count }))}
          />
          <p className="admin__muted">
            Impressions/CTR per kort: hoppet over (høy volum / lav verdi uten
            sampling). Bruker <code>explore_recipe_click</code> +{' '}
            <code>recipe_view</code> source som proxy.
          </p>
        </>
      ) : null}

      {/* —— HJEMME —— */}
      {!loading && tab === 'pantry' && events.length > 0 ? (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">{hjemmeConv.impressions}</p>
              <p className="admin-stat__label">Unike Hjemme-økter</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{hjemmeConv.opens}</p>
              <p className="admin-stat__label">Unike match-åpninger</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">
                {hjemmeConv.rate != null ? pct(hjemmeConv.rate) : '—'}
              </p>
              <p className="admin-stat__label">Hjemme-konvertering</p>
            </div>
          </div>
          <FunnelBlock title="Hjemme-funnel" steps={hjemmeFunnel} />
          <h2 className="admin__section-title">
            Populære ingredienser (kun kjente nøkler)
          </h2>
          {pantryKeys.length === 0 ? (
            <p className="admin__muted">
              Ingen <code>ingredient_key</code> ennå — lagres kun når varen
              matcher kjent vokabular.
            </p>
          ) : (
            <ul className="admin-list">
              {pantryKeys.map((p) => (
                <li key={p.key} className="admin-list__item">
                  <div>
                    <p className="admin-list__name">{p.key}</p>
                    <p className="admin-list__meta">
                      {p.adds} · {p.sessions} økter
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {/* —— SØK —— */}
      {!loading && tab === 'search' && events.length > 0 ? (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">{search.searches}</p>
              <p className="admin-stat__label">Søk (hendelser)</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{search.searchSessions}</p>
              <p className="admin-stat__label">Unike søkeøkter</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{search.zeroResults}</p>
              <p className="admin-stat__label">Nulltreff (flagget)</p>
            </div>
          </div>
          <FunnelBlock title="Søkefunnel" steps={searchFunnel} />
          <p className="admin__muted">
            Raw fri tekst lagres ikke. Validerte termer kun mot kjent vokabular
            (oppskriftsnavn/kategorier). Ellers kun lengde-bøtter.
          </p>
          <h2 className="admin__section-title">Lengde-bøtter</h2>
          <MiniBars
            rows={search.buckets.map((b) => ({
              label: b.label,
              value: b.count,
            }))}
          />
          <h2 className="admin__section-title">Validerte termer</h2>
          {search.validatedTerms.length === 0 ? (
            <p className="admin__muted">Ingen validerte termer ennå.</p>
          ) : (
            <ul className="admin-list">
              {search.validatedTerms.map((t) => (
                <li key={t.term} className="admin-list__item">
                  <div>
                    <p className="admin-list__name">{t.term}</p>
                    <p className="admin-list__meta">
                      {t.count}
                      {t.zero ? ' · nulltreff' : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {/* —— HANDLELISTE —— */}
      {!loading && tab === 'shopping' && events.length > 0 ? (
        <div className="admin-stats">
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                events.filter((e) => e.event_name === 'shopping_view').length
              }
            </p>
            <p className="admin-stat__label">Handleliste-visninger</p>
          </div>
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                new Set(
                  events
                    .filter((e) => e.event_name === 'recipe_shopping_add')
                    .map((e) => e.anonymous_session_id),
                ).size
              }
            </p>
            <p className="admin-stat__label">Unike som la til</p>
          </div>
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                events.filter((e) => e.event_name === 'shopping_recipe_remove')
                  .length
              }
            </p>
            <p className="admin-stat__label">Fjernet oppskrift</p>
          </div>
        </div>
      ) : null}

      {/* —— FAVORITTER —— */}
      {!loading && tab === 'favorites' && events.length > 0 ? (
        <div className="admin-stats">
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                events.filter((e) => e.event_name === 'favorites_view').length
              }
            </p>
            <p className="admin-stat__label">Favoritter åpnet</p>
          </div>
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                new Set(
                  events
                    .filter((e) => e.event_name === 'recipe_favorite_add')
                    .map((e) => e.anonymous_session_id),
                ).size
              }
            </p>
            <p className="admin-stat__label">Unike som lagret</p>
          </div>
          <div className="admin-stat">
            <p className="admin-stat__value">
              {
                events.filter((e) => e.event_name === 'favorites_folder_create')
                  .length
              }
            </p>
            <p className="admin-stat__label">Mapper opprettet (uten navn)</p>
          </div>
        </div>
      ) : null}

      {/* —— TIPS —— */}
      {!loading && tab === 'tips' ? (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">
                {
                  events.filter((e) => e.event_name === 'tips_landing_view')
                    .length
                }
              </p>
              <p className="admin-stat__label">Tips-landing</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">
                {
                  events.filter((e) => e.event_name === 'tips_article_view')
                    .length
                }
              </p>
              <p className="admin-stat__label">Artikkelvisninger</p>
            </div>
          </div>
          <h2 className="admin__section-title">Artikler (slug)</h2>
          {tipSlugs.length === 0 ? (
            <p className="admin__muted">Ingen tipshendelser ennå.</p>
          ) : (
            <ul className="admin-list">
              {tipSlugs.map((t) => (
                <li key={t.label} className="admin-list__item">
                  <p className="admin-list__name">{t.label}</p>
                  <p className="admin-list__meta">{t.count}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {/* —— ONBOARDING —— */}
      {!loading && tab === 'onboarding' ? (
        <>
          <FunnelBlock title="Onboarding-funnel" steps={onboardingFunnel} />
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">
                {
                  events.filter((e) => e.event_name === 'onboarding_complete')
                    .length
                }
              </p>
              <p className="admin-stat__label">Fullført</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">
                {
                  events.filter((e) => e.event_name === 'onboarding_skip')
                    .length
                }
              </p>
              <p className="admin-stat__label">Hoppet over</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">
                {
                  events.filter((e) => e.event_name === 'onboarding_replay')
                    .length
                }
              </p>
              <p className="admin-stat__label">Replay</p>
            </div>
          </div>
          <h2 className="admin__section-title">Steg-indeks</h2>
          <MiniBars
            rows={onboardingSteps.map((s) => ({
              label: `Steg ${s.step + 1}`,
              value: s.count,
            }))}
          />
        </>
      ) : null}

      {/* —— TILBAKEMELDINGER —— */}
      {!loading && tab === 'feedback' ? (
        <>
          <p className="admin__muted">
            Intentional «Gi tilbakemelding» — analysérbar tekst. Private
            oppskriftsnotater er aldri her. {FEEDBACK_AI_ARCHITECTURE_NOTE}
          </p>
          <p className="admin__muted">
            Kilde: {feedbackSource} · {feedback.length} innlegg
          </p>
          {feedback.length === 0 ? (
            <p className="admin__muted">
              Ingen tilbakemeldinger ennå. Brukere finner «Gi tilbakemelding» på
              Konto.
            </p>
          ) : (
            <ul className="admin-list">
              {feedback.map((f) => (
                <li key={f.id} className="admin-list__item innsikt-feedback">
                  <div>
                    <p className="admin-list__name">
                      {f.category} · {f.sentiment ?? '—'} · {f.status}
                    </p>
                    <p className="admin-list__meta">
                      {new Date(f.created_at).toLocaleString('nb-NO')} ·{' '}
                      {f.env}
                      {f.tags?.length ? ` · ${f.tags.join(', ')}` : ''}
                      {f.page_path ? ` · ${f.page_path}` : ''}
                    </p>
                    <p className="innsikt-feedback__body">{f.body}</p>
                  </div>
                  <div className="admin-list__actions">
                    {f.status === 'new' ? (
                      <button
                        type="button"
                        className="admin__btn admin__btn--ghost"
                        onClick={() => {
                          void updateFeedbackStatus(f.id, 'reviewed')
                          setFeedback((prev) =>
                            prev.map((x) =>
                              x.id === f.id ? { ...x, status: 'reviewed' } : x,
                            ),
                          )
                        }}
                      >
                        Merk sett
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {/* —— TEKNISK —— */}
      {!loading && tab === 'technical' ? (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <p className="admin-stat__value">{tech.clientErrors}</p>
              <p className="admin-stat__label">Klientfeil</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{tech.errorSessions}</p>
              <p className="admin-stat__label">Økter med feil</p>
            </div>
            <div className="admin-stat">
              <p className="admin-stat__value">{devices[0]?.device ?? '—'}</p>
              <p className="admin-stat__label">Vanligste enhetsklasse</p>
            </div>
          </div>
          <h2 className="admin__section-title">Enhet (breddeklasse)</h2>
          <ul className="admin-list">
            {devices.map((d) => (
              <li key={d.device} className="admin-list__item">
                <div>
                  <p className="admin-list__name">{d.device}</p>
                  <p className="admin-list__meta">
                    {d.count} · {d.sessions} økter
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <h2 className="admin__section-title">Feil per sti</h2>
          {tech.byPath.length === 0 ? (
            <p className="admin__muted">Ingen tech_client_error ennå.</p>
          ) : (
            <ul className="admin-list">
              {tech.byPath.map((p) => (
                <li key={p.path} className="admin-list__item">
                  <p className="admin-list__name">{p.path}</p>
                  <p className="admin-list__meta">{p.count}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {/* —— RETENTION —— */}
      {!loading && tab === 'retention' ? (
        <>
          <p className="admin__muted">
            Kohorter etter første økt-dag. D1/D7/D30 krever nok historikk —
            ellers «—». Anonyme økter (ikke konto-ID).
          </p>
          {retention.length === 0 ? (
            <p className="admin__muted">For lite data til kohorter.</p>
          ) : (
            <div className="innsikt-table-wrap">
              <table className="innsikt-table">
                <thead>
                  <tr>
                    <th>Kohort</th>
                    <th>Størrelse</th>
                    <th>D1</th>
                    <th>D7</th>
                    <th>D30</th>
                  </tr>
                </thead>
                <tbody>
                  {retention.map((r) => (
                    <tr key={r.cohortDay}>
                      <td>{r.cohortDay}</td>
                      <td>{r.size}</td>
                      <td>{r.d1 == null ? '—' : pct(r.d1)}</td>
                      <td>{r.d7 == null ? '—' : pct(r.d7)}</td>
                      <td>{r.d30 == null ? '—' : pct(r.d30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
