import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { InlineError } from '../components/InlineError'
import { RecipeLink } from '../components/RecipeLink'
import { TipBlocks } from '../components/TipBlocks'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { useRecipes } from '../context/RecipesContext'
import { localizeTipArticle } from '../i18n/localizeTips'
import { trackEvent } from '../lib/analytics'
import { fetchTipBySlug } from '../lib/tipsApi'
import type { TipArticle } from '../lib/tipsTypes'
import { USER_ERRORS } from '../lib/userErrors'
import './TipArticlePage.css'

export function TipArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { locale } = useLocale()
  const { recipes } = useRecipes()
  const [rawArticle, setRawArticle] = useState<TipArticle | null>(null)
  const article = useMemo(
    () => (rawArticle ? localizeTipArticle(rawArticle, locale) : null),
    [rawArticle, locale],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroFailed, setHeroFailed] = useState(false)
  const allowDraft =
    isAdmin && searchParams.get('forhandsvis') === '1'

  async function load() {
    if (!slug) return
    setLoading(true)
    setError(null)
    setHeroFailed(false)
    try {
      const row = await fetchTipBySlug(slug, { allowDraft })
      setRawArticle(row)
      if (!row) setError(null)
    } catch {
      setError(USER_ERRORS.load)
      setRawArticle(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [slug, allowDraft])

  useEffect(() => {
    if (!article || allowDraft) return
    trackEvent('tips_article_view', {
      source: 'tips',
      properties: { slug: article.slug },
    })
  }, [article?.id, allowDraft])

  const relatedRecipes = (article?.related_recipe_ids ?? [])
    .map((id) => recipes.find((r) => r.id === id))
    .filter(Boolean)

  if (loading) {
    return (
      <div className="tip-article tip-article--loading" aria-busy="true">
        <div className="tip-article__skel-hero" />
        <div className="tip-article__skel-line" />
        <div className="tip-article__skel-line tip-article__skel-line--short" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="tip-article">
        <button
          type="button"
          className="tip-article__back"
          onClick={() => navigate(-1)}
        >
          ← Tilbake
        </button>
        <InlineError message={error} onRetry={() => void load()} />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="tip-article">
        <EmptyState
          title="Fant ikke artikkelen"
          lead="Lenken kan være utdatert, eller artikkelen er ikke publisert."
          actionLabel="Alle tips"
          to="/tips"
        />
      </div>
    )
  }

  const showHero = article.hero_image_url && !heroFailed

  return (
    <article className="tip-article">
      <button
        type="button"
        className="tip-article__back"
        onClick={() => navigate(-1)}
      >
        ← Tilbake
      </button>

      {article.category ? (
        <p className="tip-article__cat">{article.category.name}</p>
      ) : null}

      <h1 className="tip-article__title">{article.title}</h1>

      {showHero ? (
        <div className="tip-article__hero">
          <img
            src={article.hero_image_url!}
            alt=""
            onError={() => setHeroFailed(true)}
          />
        </div>
      ) : null}

      {article.excerpt ? (
        <p className="tip-article__excerpt">{article.excerpt}</p>
      ) : null}

      <TipBlocks blocks={article.blocks} />

      {article.images.length > 0 ? (
        <section className="tip-article__gallery" aria-label="Bilder">
          {article.images.map((img) => (
            <figure key={img.id}>
              <img
                src={img.url}
                alt={img.caption || ''}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {img.caption ? <figcaption>{img.caption}</figcaption> : null}
            </figure>
          ))}
        </section>
      ) : null}

      {relatedRecipes.length > 0 ? (
        <section className="tip-article__related">
          <h2>Relaterte oppskrifter</h2>
          <ul>
            {relatedRecipes.map((r) =>
              r ? (
                <li key={r.id}>
                  <RecipeLink recipeId={r.id} entrySource="tips">
                    {r.name}
                  </RecipeLink>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      {(article.related_articles?.length ?? 0) > 0 ? (
        <section className="tip-article__related">
          <h2>Les også</h2>
          <ul>
            {article.related_articles!.map((a) => (
              <li key={a.id}>
                <Link to={`/tips/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link to="/tips" className="tip-article__back-link">
        ← Alle tips
      </Link>
    </article>
  )
}
