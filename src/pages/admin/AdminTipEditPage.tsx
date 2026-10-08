import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecipes } from '../../context/RecipesContext'
import { slugifyId } from '../../lib/adminRecipes'
import {
  createTipArticle,
  fetchAllTipsAdmin,
  fetchTipByIdAdmin,
  fetchTipCategories,
  replaceArticleTopics,
  replaceRelatedArticles,
  replaceRelatedRecipes,
  replaceTipBlocks,
  replaceTipImages,
  tipImagePublicUrl,
  updateTipArticle,
  uploadTipImage,
} from '../../lib/tipsApi'
import {
  TIP_BLOCK_LABELS,
  TIP_BLOCK_TYPES,
  type TipArticleListItem,
  type TipBlock,
  type TipBlockPayload,
  type TipBlockType,
  type TipCategory,
  type TipImage,
  type TipStatus,
} from '../../lib/tipsTypes'
import {
  suggestTipBlockPayloadEn,
  suggestTipExcerptEn,
  suggestTipTitleEn,
} from '../../i18n/editorialAuto'
import {
  BilingualHint,
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import { toUserSaveError } from '../../lib/userErrors'
import './Admin.css'

type DraftBlock = {
  key: string
  block_type: TipBlockType
  payload: TipBlockPayload
  payloadEn: TipBlockPayload
  payloadEnAuto: TipBlockPayload
  payloadEnOverride: boolean
}

function emptyPayload(type: TipBlockType): TipBlockPayload {
  switch (type) {
    case 'steps':
    case 'checklist':
    case 'equipment':
    case 'pro_tips':
    case 'not_needed':
      return { title: TIP_BLOCK_LABELS[type], items: [''] }
    case 'image':
      return { url: '', caption: '' }
    case 'quote':
      return { text: '', cite: '' }
    case 'tip':
    case 'warning':
      return { title: TIP_BLOCK_LABELS[type], text: '' }
    default:
      return { text: '' }
  }
}

function fromBlocks(blocks: TipBlock[], articleSlug = ''): DraftBlock[] {
  return [...blocks]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => ({
      key: b.id,
      block_type: b.block_type,
      payload: { ...(b.payloadNo ?? b.payload) },
      payloadEn: { ...(b.payloadEn ?? {}) },
      payloadEnAuto: {
        ...(b.payloadEnAuto ??
          suggestTipBlockPayloadEn(articleSlug, b.sort_order) ??
          {}),
      },
      payloadEnOverride: Boolean(b.payloadEnOverride),
    }))
}

export function AdminTipEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { recipes } = useRecipes()

  const [categories, setCategories] = useState<TipCategory[]>([])
  const [allArticles, setAllArticles] = useState<TipArticleListItem[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleEnAuto, setTitleEnAuto] = useState('')
  const [titleEnOverride, setTitleEnOverride] = useState(false)
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [excerptEnAuto, setExcerptEnAuto] = useState('')
  const [excerptEnOverride, setExcerptEnOverride] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [status, setStatus] = useState<TipStatus>('draft')
  const [featured, setFeatured] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [heroUrl, setHeroUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<DraftBlock[]>([])
  const [images, setImages] = useState<
    Array<{
      key: string
      url: string
      caption: string
      captionEn: string
      captionEnAuto: string
      captionEnOverride: boolean
    }>
  >([])
  const [relatedRecipes, setRelatedRecipes] = useState<string[]>([])
  const [relatedArticles, setRelatedArticles] = useState<string[]>([])
  const [articleId, setArticleId] = useState<string | null>(isNew ? null : id!)
  const [lang, setLang] = useState<ContentLangTab>('no')

  useEffect(() => {
    void (async () => {
      try {
        const [cats, arts] = await Promise.all([
          fetchTipCategories({ includeInactive: true }),
          fetchAllTipsAdmin(),
        ])
        setCategories(cats.filter((c) => c.isActive !== false))
        setAllArticles(arts)
      } catch {
        /* local defaults via API */
      }
    })()
  }, [])

  useEffect(() => {
    if (isNew) return
    void (async () => {
      setLoading(true)
      try {
        const row = await fetchTipByIdAdmin(id!)
        if (!row) {
          setMessage('Fant ikke artikkelen.')
          return
        }
        setArticleId(row.id)
        setTitle(row.titleNo || row.title)
        setTitleEn(row.titleEn)
        setTitleEnAuto(row.titleEnAuto || suggestTipTitleEn(row.slug, row.titleNo || row.title))
        setTitleEnOverride(row.titleEnOverride)
        setSlug(row.slug)
        setExcerpt(row.excerptNo || row.excerpt)
        setExcerptEn(row.excerptEn)
        setExcerptEnAuto(
          row.excerptEnAuto ||
            suggestTipExcerptEn(row.slug, row.excerptNo || row.excerpt),
        )
        setExcerptEnOverride(row.excerptEnOverride)
        setCategoryId(row.category_id ?? '')
        setTopicIds(
          row.topicIds?.length
            ? row.topicIds
            : row.category_id
              ? [row.category_id]
              : [],
        )
        setStatus(row.status)
        setFeatured(row.is_featured)
        setSortOrder(row.sort_order)
        setHeroUrl(row.hero_image_url)
        setBlocks(fromBlocks(row.blocks, row.slug))
        setImages(
          row.images.map((img: TipImage) => ({
            key: img.id,
            url: img.url,
            caption: img.captionNo || img.caption,
            captionEn: img.captionEn,
            captionEnAuto: img.captionEnAuto,
            captionEnOverride: img.captionEnOverride,
          })),
        )
        setRelatedRecipes(row.related_recipe_ids)
        setRelatedArticles(row.related_article_ids)
      } catch (err) {
        setMessage(toUserSaveError(err, 'admin'))
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isNew])

  function patchBlock(key: string, patch: Partial<DraftBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    )
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setBlocks(next)
  }

  async function onUploadHero(file: File | null) {
    if (!file || !articleId) {
      setMessage('Lagre artikkelen først, deretter last opp bilde.')
      return
    }
    setSaving(true)
    try {
      const path = await uploadTipImage(articleId, file, 'hero')
      const url = tipImagePublicUrl(path)
      setHeroUrl(url)
      await updateTipArticle(articleId, { hero_image_url: path })
      setMessage('Hero-bilde lastet opp.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onUploadExtra(file: File | null) {
    if (!file || !articleId) {
      setMessage('Lagre artikkelen først, deretter last opp bilde.')
      return
    }
    setSaving(true)
    try {
      const path = await uploadTipImage(articleId, file, 'extra')
      const url = tipImagePublicUrl(path) ?? path
      setImages((prev) => [
        ...prev,
        {
          key: `img-${Date.now()}`,
          url,
          caption: '',
          captionEn: '',
          captionEnAuto: '',
          captionEnOverride: false,
        },
      ])
      setMessage('Bilde lagt til — husk å lagre.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function saveAll() {
    setSaving(true)
    setMessage(null)
    try {
      const slugFinal = (slug.trim() || slugifyId(title) || 'tips').slice(0, 80)
      const titleNo = title.trim() || 'Uten tittel'
      const titleAuto =
        titleEnAuto || suggestTipTitleEn(slugFinal, titleNo)
      const excerptAuto =
        excerptEnAuto || suggestTipExcerptEn(slugFinal, excerpt.trim())
      const payload = {
        title: titleNo,
        title_no: titleNo,
        title_en: titleEnOverride ? titleEn.trim() : '',
        title_en_auto: titleAuto,
        title_en_override: titleEnOverride && Boolean(titleEn.trim()),
        slug: slugFinal,
        excerpt: excerpt.trim(),
        excerpt_no: excerpt.trim(),
        excerpt_en: excerptEnOverride ? excerptEn.trim() : '',
        excerpt_en_auto: excerptAuto,
        excerpt_en_override: excerptEnOverride && Boolean(excerptEn.trim()),
        category_id: topicIds[0] || categoryId || null,
        topic_ids: topicIds,
        status,
        is_featured: featured,
        sort_order: sortOrder,
        hero_image_url: heroUrl,
      }

      let currentId = articleId
      if (isNew || !currentId) {
        const created = await createTipArticle(payload)
        currentId = created.id
        setArticleId(created.id)
        navigate(`/admin/tips/${created.id}`, { replace: true })
      } else {
        await updateTipArticle(currentId, payload)
      }

      try {
        await replaceArticleTopics(currentId, topicIds)
      } catch {
        /* tip_article_topics may be missing until SQL migration */
      }

      await replaceTipBlocks(
        currentId,
        blocks.map((b, i) => ({
          block_type: b.block_type,
          sort_order: i + 1,
          payload: b.payload,
          payload_no: b.payload,
          payload_en: b.payloadEnOverride ? b.payloadEn : {},
          payload_en_auto:
            b.payloadEnAuto ||
            suggestTipBlockPayloadEn(slugFinal, i + 1) ||
            {},
          payload_en_override: b.payloadEnOverride,
        })),
      )
      await replaceTipImages(
        currentId,
        images
          .filter((img) => img.url)
          .map((img, i) => ({
            url: img.url,
            caption: img.caption,
            caption_no: img.caption,
            caption_en: img.captionEnOverride ? img.captionEn : '',
            caption_en_auto: img.captionEnAuto,
            caption_en_override: img.captionEnOverride,
            sort_order: i + 1,
          })),
      )
      await replaceRelatedRecipes(currentId, relatedRecipes)
      await replaceRelatedArticles(currentId, relatedArticles)
      setMessage('Lagret.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Tips og triks</p>
          <h1 className="admin__title">
            {isNew ? 'Ny artikkel' : 'Rediger artikkel'}
          </h1>
        </div>
        <div className="admin__header-actions">
          {slug ? (
            <Link
              to={`/tips/${slug}?forhandsvis=1`}
              target="_blank"
              rel="noreferrer"
              className="admin__btn admin__btn--ghost"
            >
              Forhåndsvis
            </Link>
          ) : null}
          <Link to="/admin/tips" className="admin__btn admin__btn--ghost">
            Til liste
          </Link>
          <button
            type="button"
            className="admin__btn"
            disabled={saving}
            onClick={() => void saveAll()}
          >
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
        </div>
      </header>

      {message ? <p className="admin__message">{message}</p> : null}

      <LangTabs value={lang} onChange={setLang} />
      <BilingualHint>
        {lang === 'no'
          ? 'Norsk er hovedinnhold for tittel, beskrivelse og blokker.'
          : 'English: automatic/default first. Custom EN marks Manual override. Clear restores automatic.'}
      </BilingualHint>

      <fieldset className="admin-form__block">
        <legend>Grunninfo</legend>
        <BilingualTextInput
          lang={lang}
          labelNo="Tittel (NO)"
          labelEn="Title (EN)"
          valueNo={title}
          valueEn={titleEn}
          autoEn={titleEnAuto || suggestTipTitleEn(slug, title)}
          isOverride={titleEnOverride}
          onChangeNo={(value) => {
            setTitle(value)
            setTitleEnAuto(suggestTipTitleEn(slug || slugifyId(value), value))
            if (isNew && !slug) setSlug(slugifyId(value))
          }}
          onChangeEn={(value) => {
            setTitleEn(value)
            setTitleEnOverride(true)
          }}
          onClearOverride={() => {
            setTitleEn('')
            setTitleEnOverride(false)
            setTitleEnAuto(suggestTipTitleEn(slug, title))
          }}
        />
        <label className="admin-form__field">
          <span>Slug (deep link)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(slugifyId(e.target.value))}
          />
        </label>
        <BilingualTextInput
          lang={lang}
          labelNo="Kort beskrivelse (NO)"
          labelEn="Excerpt (EN)"
          valueNo={excerpt}
          valueEn={excerptEn}
          autoEn={excerptEnAuto || suggestTipExcerptEn(slug, excerpt)}
          isOverride={excerptEnOverride}
          multiline
          rows={2}
          onChangeNo={(value) => {
            setExcerpt(value)
            setExcerptEnAuto(suggestTipExcerptEn(slug, value))
          }}
          onChangeEn={(value) => {
            setExcerptEn(value)
            setExcerptEnOverride(true)
          }}
          onClearOverride={() => {
            setExcerptEn('')
            setExcerptEnOverride(false)
            setExcerptEnAuto(suggestTipExcerptEn(slug, excerpt))
          }}
        />
        <fieldset className="admin-form__field">
          <legend>Emner / topics (1+)</legend>
          <p className="admin__muted" style={{ marginTop: 0 }}>
            Filter bruker stabile IDer/slug — ikke visningstekst. Første valgte
            er primærkategori på kort.
          </p>
          <ul className="admin-check-list">
            {categories.map((c) => {
              const on = topicIds.includes(c.id)
              return (
                <li key={c.id}>
                  <label className="admin-form__check">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        setTopicIds((prev) => {
                          const next = on
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id]
                          setCategoryId(next[0] ?? '')
                          return next
                        })
                      }}
                    />
                    {c.nameNo || c.name}
                    <span className="admin__muted"> · {c.slug}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
        <label className="admin-form__field">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TipStatus)}
          >
            <option value="draft">Utkast</option>
            <option value="published">Publisert</option>
          </select>
        </label>
        <label className="admin-form__check">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Fremhevet på landing
        </label>
        <label className="admin-form__field">
          <span>Sortering</span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </label>
      </fieldset>

      <fieldset className="admin-form__block">
        <legend>Hero-bilde</legend>
        {heroUrl ? (
          <img src={heroUrl} alt="" className="admin-form__preview" />
        ) : (
          <div className="admin-form__onboarding-image-empty">Ingen hero</div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void onUploadHero(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="admin__btn admin__btn--ghost"
          onClick={() => setHeroUrl(null)}
        >
          Fjern hero
        </button>
      </fieldset>

      <fieldset className="admin-form__block">
        <legend>Ekstra bilder</legend>
        {images.map((img, index) => (
          <div key={img.key} className="admin-form__onboarding-image">
            {img.url ? <img src={img.url} alt="" /> : null}
            <input
              placeholder="Bildetekst"
              value={img.caption}
              onChange={(e) =>
                setImages((prev) =>
                  prev.map((x, i) =>
                    i === index ? { ...x, caption: e.target.value } : x,
                  ),
                )
              }
            />
            <button
              type="button"
              className="admin__btn admin__btn--ghost"
              onClick={() =>
                setImages((prev) => prev.filter((_, i) => i !== index))
              }
            >
              Fjern
            </button>
          </div>
        ))}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void onUploadExtra(e.target.files?.[0] ?? null)}
        />
      </fieldset>

      <fieldset className="admin-form__block">
        <legend>Innholdsblokker</legend>
        <p className="admin__muted">
          Legg til, omarranger og rediger strukturerte blokker — ikke fri HTML.
        </p>
        {blocks.map((block, index) => (
          <div key={block.key} className="admin-tip-block">
            <div className="admin-form__reorder admin-form__reorder--row">
              <select
                value={block.block_type}
                onChange={(e) => {
                  const type = e.target.value as TipBlockType
                  patchBlock(block.key, {
                    block_type: type,
                    payload: emptyPayload(type),
                    payloadEn: {},
                    payloadEnAuto:
                      suggestTipBlockPayloadEn(slug, index + 1) ?? {},
                    payloadEnOverride: false,
                  })
                }}
              >
                {TIP_BLOCK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TIP_BLOCK_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={index === blocks.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                onClick={() =>
                  setBlocks((prev) => prev.filter((b) => b.key !== block.key))
                }
              >
                Fjern
              </button>
            </div>
            <BlockFields
              type={block.block_type}
              payload={
                lang === 'en'
                  ? block.payloadEnOverride
                    ? block.payloadEn
                    : block.payloadEnAuto
                  : block.payload
              }
              onChange={(payload) => {
                if (lang === 'en') {
                  patchBlock(block.key, {
                    payloadEn: payload,
                    payloadEnOverride: true,
                    payloadEnAuto:
                      block.payloadEnAuto ||
                      suggestTipBlockPayloadEn(slug, index + 1) ||
                      {},
                  })
                } else {
                  patchBlock(block.key, { payload })
                }
              }}
            />
            {lang === 'en' && block.payloadEnOverride ? (
              <button
                type="button"
                className="admin__btn admin__btn--ghost admin-form__clear-en"
                onClick={() =>
                  patchBlock(block.key, {
                    payloadEn: {},
                    payloadEnOverride: false,
                    payloadEnAuto:
                      suggestTipBlockPayloadEn(slug, index + 1) ?? {},
                  })
                }
              >
                Clear block override — restore automatic
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="admin__btn admin__btn--ghost"
          onClick={() =>
            setBlocks((prev) => [
              ...prev,
              {
                key: `new-${Date.now()}`,
                block_type: 'text',
                payload: emptyPayload('text'),
                payloadEn: {},
                payloadEnAuto: {},
                payloadEnOverride: false,
              },
            ])
          }
        >
          + Legg til blokk
        </button>
      </fieldset>

      <fieldset className="admin-form__block">
        <legend>Relaterte oppskrifter</legend>
        <div className="admin-check-grid">
          {recipes.slice(0, 40).map((r) => (
            <label key={r.id} className="admin-form__check">
              <input
                type="checkbox"
                checked={relatedRecipes.includes(r.id)}
                onChange={(e) => {
                  setRelatedRecipes((prev) =>
                    e.target.checked
                      ? [...prev, r.id]
                      : prev.filter((x) => x !== r.id),
                  )
                }}
              />
              {r.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="admin-form__block">
        <legend>Relaterte tips-artikler</legend>
        <div className="admin-check-grid">
          {allArticles
            .filter((a) => a.id !== articleId)
            .map((a) => (
              <label key={a.id} className="admin-form__check">
                <input
                  type="checkbox"
                  checked={relatedArticles.includes(a.id)}
                  onChange={(e) => {
                    setRelatedArticles((prev) =>
                      e.target.checked
                        ? [...prev, a.id]
                        : prev.filter((x) => x !== a.id),
                    )
                  }}
                />
                {a.title}
              </label>
            ))}
        </div>
      </fieldset>

      <div className="admin-form__footer">
        <button
          type="button"
          className="admin__btn"
          disabled={saving}
          onClick={() => void saveAll()}
        >
          {saving ? 'Lagrer…' : 'Lagre artikkel'}
        </button>
      </div>
    </div>
  )
}

function BlockFields({
  type,
  payload,
  onChange,
}: {
  type: TipBlockType
  payload: TipBlockPayload
  onChange: (p: TipBlockPayload) => void
}) {
  const itemsText = (payload.items ?? []).join('\n')

  if (
    type === 'steps' ||
    type === 'checklist' ||
    type === 'equipment' ||
    type === 'pro_tips' ||
    type === 'not_needed'
  ) {
    return (
      <>
        <label className="admin-form__field">
          <span>Overskrift</span>
          <input
            value={payload.title ?? ''}
            onChange={(e) => onChange({ ...payload, title: e.target.value })}
          />
        </label>
        <label className="admin-form__field">
          <span>Punkter (én per linje)</span>
          <textarea
            rows={4}
            value={itemsText}
            onChange={(e) =>
              onChange({
                ...payload,
                items: e.target.value.split('\n'),
              })
            }
          />
        </label>
      </>
    )
  }

  if (type === 'image') {
    return (
      <>
        <label className="admin-form__field">
          <span>Bilde-URL</span>
          <input
            value={payload.url ?? ''}
            onChange={(e) => onChange({ ...payload, url: e.target.value })}
          />
        </label>
        <label className="admin-form__field">
          <span>Bildetekst</span>
          <input
            value={payload.caption ?? ''}
            onChange={(e) => onChange({ ...payload, caption: e.target.value })}
          />
        </label>
      </>
    )
  }

  if (type === 'quote') {
    return (
      <>
        <label className="admin-form__field">
          <span>Sitat</span>
          <textarea
            rows={2}
            value={payload.text ?? ''}
            onChange={(e) => onChange({ ...payload, text: e.target.value })}
          />
        </label>
        <label className="admin-form__field">
          <span>Kilde</span>
          <input
            value={payload.cite ?? ''}
            onChange={(e) => onChange({ ...payload, cite: e.target.value })}
          />
        </label>
      </>
    )
  }

  return (
    <>
      {(type === 'tip' || type === 'warning') && (
        <label className="admin-form__field">
          <span>Label</span>
          <input
            value={payload.title ?? ''}
            onChange={(e) => onChange({ ...payload, title: e.target.value })}
          />
        </label>
      )}
      <label className="admin-form__field">
        <span>Tekst</span>
        <textarea
          rows={3}
          value={payload.text ?? ''}
          onChange={(e) => onChange({ ...payload, text: e.target.value })}
        />
      </label>
    </>
  )
}
