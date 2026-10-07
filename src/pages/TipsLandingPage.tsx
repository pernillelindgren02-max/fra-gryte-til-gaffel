import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { InlineError } from '../components/InlineError'
import { fetchPublishedTips } from '../lib/tipsApi'
import type { TipArticleListItem } from '../lib/tipsTypes'
import { USER_ERRORS } from '../lib/userErrors'
import './TipsLandingPage.css'

function TipCardImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className="tips-card__fallback" aria-hidden="true" />
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

export function TipsLandingPage() {
  const [items, setItems] = useState<TipArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchPublishedTips()
      setItems(rows)
    } catch {
      setError(USER_ERRORS.load)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const featured =
    items.find((a) => a.is_featured) ?? (items.length > 0 ? items[0] : null)
  const rest = featured
    ? items.filter((a) => a.id !== featured.id)
    : items

  return (
    <div className="tips-landing">
      <header className="tips-landing__header">
        <p className="tips-landing__eyebrow">Feltguide</p>
        <h1 className="tips-landing__title">Tips og triks</h1>
        <p className="tips-landing__lead">
          Korte, praktiske artikler for lite kjøkken, primus og tur — skrevet
          for å brukes, ikke skumles.
        </p>
      </header>

      {error ? (
        <InlineError message={error} onRetry={() => void load()} />
      ) : null}

      {loading ? (
        <div className="tips-landing__skeleton" aria-busy="true">
          <div className="tips-landing__skel-featured" />
          <div className="tips-landing__skel-grid">
            <div />
            <div />
          </div>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Ingen tips publisert ennå"
          lead="Kom tilbake snart — eller sjekk Utforsk for oppskrifter i mellomtiden."
          actionLabel="Til Utforsk"
          to="/"
        />
      ) : null}

      {!loading && featured ? (
        <Link
          to={`/tips/${featured.slug}`}
          className="tips-featured"
        >
          <div className="tips-featured__media">
            <TipCardImage
              src={featured.hero_image_url}
              title={featured.title}
            />
          </div>
          <div className="tips-featured__body">
            {featured.category ? (
              <span className="tips-cat">{featured.category.name}</span>
            ) : null}
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <span className="tips-featured__cta">Les artikkelen</span>
          </div>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <section className="tips-grid" aria-label="Flere tips">
          {rest.map((article) => (
            <Link
              key={article.id}
              to={`/tips/${article.slug}`}
              className="tips-card"
            >
              <div className="tips-card__media">
                <TipCardImage
                  src={article.hero_image_url}
                  title={article.title}
                />
              </div>
              {article.category ? (
                <span className="tips-cat">{article.category.name}</span>
              ) : null}
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  )
}
