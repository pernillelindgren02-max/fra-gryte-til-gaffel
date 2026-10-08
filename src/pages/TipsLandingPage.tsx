import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackToExplore } from '../components/BackToExplore'
import { ClearableSearchInput } from '../components/ClearableSearchInput'
import { EmptyState } from '../components/EmptyState'
import { InlineError } from '../components/InlineError'
import { TipsTopicSheet } from '../components/TipsTopicSheet'
import { useLocale } from '../context/LocaleContext'
import {
  localizeTipCategory,
  localizeTipListItem,
} from '../i18n/localizeTips'
import { searchQueryBucket, trackEvent } from '../lib/analytics'
import { fetchPublishedTips, fetchTipCategories } from '../lib/tipsApi'
import type { TipArticleListItem, TipCategory } from '../lib/tipsTypes'
import { USER_ERRORS } from '../lib/userErrors'
import { filterTipsByTopicIds, searchTips } from '../utils/searchTips'
import './TipsLandingPage.css'

function TopicsIcon() {
  return (
    <svg
      className="tips-search__topics-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TipCardImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className="tips-card__fallback" aria-hidden="true" />
  }
  return (
    <img
      src={src}
      alt={title}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

export function TipsLandingPage() {
  const { locale, t } = useLocale()
  const [rawItems, setRawItems] = useState<TipArticleListItem[]>([])
  const [topics, setTopics] = useState<TipCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [topicSheetOpen, setTopicSheetOpen] = useState(false)

  const items = useMemo(
    () => rawItems.map((item) => localizeTipListItem(item, locale)),
    [rawItems, locale],
  )

  const displayTopics = useMemo(
    () =>
      topics
        .filter((c) => c.isActive !== false)
        .map((c) => localizeTipCategory(c, locale)),
    [topics, locale],
  )

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [rows, cats] = await Promise.all([
        fetchPublishedTips(),
        fetchTipCategories({ includeInactive: false }),
      ])
      setRawItems(rows)
      setTopics(cats)
    } catch {
      setError(USER_ERRORS.load)
      setRawItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const byTopic = filterTipsByTopicIds(items, selectedTopicIds)
    return searchTips(byTopic, searchQuery, locale)
  }, [items, selectedTopicIds, searchQuery, locale])

  const hasConstraints =
    searchQuery.trim().length > 0 || selectedTopicIds.length > 0

  const featured = !hasConstraints
    ? filtered.find((a) => a.is_featured) ??
      (filtered.length > 0 ? filtered[0] : null)
    : null
  const rest = featured
    ? filtered.filter((a) => a.id !== featured.id)
    : filtered

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    const timer = window.setTimeout(() => {
      trackEvent('tips_search_used', {
        source: 'tips',
        properties: {
          query_bucket: searchQueryBucket(q),
          q_len: Math.min(q.length, 64),
          result_count: filtered.length,
          topic_filter_count: selectedTopicIds.length,
        },
      })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [searchQuery, filtered.length, selectedTopicIds.length])

  function openTopics() {
    setTopicSheetOpen(true)
    trackEvent('tips_topic_filter_opened', { source: 'tips' })
  }

  function toggleTopic(id: string) {
    setSelectedTopicIds((prev) => {
      if (prev.includes(id)) {
        trackEvent('tips_topic_removed', {
          source: 'tips',
          properties: { topic_id: id },
        })
        return prev.filter((x) => x !== id)
      }
      trackEvent('tips_topic_selected', {
        source: 'tips',
        properties: { topic_id: id },
      })
      return [...prev, id]
    })
  }

  function clearFilters() {
    setSelectedTopicIds([])
    setSearchQuery('')
    trackEvent('tips_filters_cleared', { source: 'tips' })
  }

  function clearTopicsOnly() {
    setSelectedTopicIds([])
    trackEvent('tips_filters_cleared', {
      source: 'tips',
      properties: { scope: 'topics' },
    })
  }

  function onArticleClick(articleId: string) {
    if (!hasConstraints) return
    trackEvent('tips_article_opened_from_filter', {
      source: 'tips',
      properties: {
        article_id: articleId,
        has_search: searchQuery.trim() ? 1 : 0,
        topic_count: selectedTopicIds.length,
      },
    })
  }

  const selectedTopicChips = displayTopics.filter((c) =>
    selectedTopicIds.includes(c.id),
  )

  return (
    <div className="tips-landing">
      <BackToExplore />
      <header className="tips-landing__header">
        <p className="tips-landing__eyebrow">{t('tips.eyebrow')}</p>
        <h1 className="tips-landing__title">{t('tips.title')}</h1>
        <p className="tips-landing__lead">{t('tips.lead')}</p>
      </header>

      <div className="tips-search">
        <ClearableSearchInput
          className="tips-search__clearable"
          label={t('tips.searchLabel')}
          placeholder={t('tips.searchPlaceholder')}
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        <button
          type="button"
          className={`tips-search__topics-btn${selectedTopicIds.length > 0 ? ' tips-search__topics-btn--active' : ''}`}
          aria-label={
            selectedTopicIds.length > 0
              ? `${t('tips.topics')}, ${selectedTopicIds.length}`
              : t('tips.topics')
          }
          onClick={openTopics}
        >
          <TopicsIcon />
          {selectedTopicIds.length > 0 ? (
            <span className="tips-search__topics-dot" aria-hidden="true" />
          ) : null}
        </button>
      </div>

      {selectedTopicChips.length > 0 ? (
        <div className="tips-filter-bar">
          <div className="tips-filter-bar__head">
            <p className="tips-filter-bar__label">
              {t('tips.topics')} ({selectedTopicChips.length})
            </p>
            <button
              type="button"
              className="tips-filter-bar__clear"
              onClick={clearTopicsOnly}
            >
              {t('tips.clearFilters')}
            </button>
          </div>
          <ul className="tips-filter-chips">
            {selectedTopicChips.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  className="tips-filter-chip"
                  onClick={() => toggleTopic(topic.id)}
                  aria-label={`${t('tips.removeTopic')} ${topic.name}`}
                >
                  <span>{topic.name}</span>
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
          title={t('tips.empty')}
          lead={t('tips.lead')}
          actionLabel={t('nav.explore')}
          to="/"
        />
      ) : null}

      {!loading && !error && items.length > 0 && filtered.length === 0 ? (
        <EmptyState
          lead={t('tips.noMatch')}
          actionLabel={t('tips.clearFilters')}
          onActionClick={clearFilters}
        />
      ) : null}

      {!loading && featured ? (
        <Link
          to={`/tips/${featured.slug}`}
          className="tips-featured"
          onClick={() => onArticleClick(featured.id)}
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
            ) : featured.topics[0] ? (
              <span className="tips-cat">{featured.topics[0].name}</span>
            ) : null}
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <span className="tips-featured__cta">{t('tips.read')}</span>
          </div>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <section
          className="tips-grid"
          aria-label={hasConstraints ? t('tips.results') : t('tips.more')}
        >
          {rest.map((article) => (
            <Link
              key={article.id}
              to={`/tips/${article.slug}`}
              className="tips-card"
              onClick={() => onArticleClick(article.id)}
            >
              <div className="tips-card__media">
                <TipCardImage
                  src={article.hero_image_url}
                  title={article.title}
                />
              </div>
              {article.category ? (
                <span className="tips-cat">{article.category.name}</span>
              ) : article.topics[0] ? (
                <span className="tips-cat">{article.topics[0].name}</span>
              ) : null}
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </section>
      ) : null}

      <TipsTopicSheet
        open={topicSheetOpen}
        topics={displayTopics}
        selectedIds={selectedTopicIds}
        onToggle={toggleTopic}
        onClear={clearTopicsOnly}
        onClose={() => setTopicSheetOpen(false)}
      />
    </div>
  )
}
