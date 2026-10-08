import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BilingualHint,
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import { suggestTipCategoryEn } from '../../i18n/editorialAuto'
import { slugifyId } from '../../lib/adminRecipes'
import {
  fetchTipCategories,
  reorderTipCategories,
  setTipCategoryActive,
  upsertTipCategory,
} from '../../lib/tipsApi'
import type { TipCategory } from '../../lib/tipsTypes'
import { TIP_TOPIC_SEEDS } from '../../lib/tipTopics'
import { toUserSaveError } from '../../lib/userErrors'
import './Admin.css'

export function AdminTipTopicsPage() {
  const [items, setItems] = useState<TipCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState<ContentLangTab>('no')
  const [editId, setEditId] = useState<string | null>(null)
  const [nameNo, setNameNo] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameEnAuto, setNameEnAuto] = useState('')
  const [nameEnOverride, setNameEnOverride] = useState(false)
  const [slug, setSlug] = useState('')

  async function reload() {
    setLoading(true)
    try {
      const rows = await fetchTipCategories({ includeInactive: true })
      setItems(rows)
      setMessage(null)
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  function startNew() {
    setEditId(null)
    setNameNo('')
    setNameEn('')
    setNameEnAuto('')
    setNameEnOverride(false)
    setSlug('')
  }

  function startEdit(item: TipCategory) {
    setEditId(item.id)
    setNameNo(item.nameNo || item.name)
    setNameEn(item.nameEn)
    setNameEnAuto(item.nameEnAuto || suggestTipCategoryEn(item.slug, item.nameNo))
    setNameEnOverride(item.nameEnOverride)
    setSlug(item.slug)
  }

  async function save() {
    setBusy(true)
    try {
      const slugFinal =
        slug.trim() ||
        slugifyId(nameNo).replace(/-/g, '_') ||
        'topic'
      const auto = nameEnAuto || suggestTipCategoryEn(slugFinal, nameNo)
      await upsertTipCategory(
        {
          slug: slugFinal,
          name_no: nameNo.trim() || 'Uten navn',
          name_en: nameEnOverride ? nameEn.trim() : '',
          name_en_auto: auto,
          name_en_override: nameEnOverride && Boolean(nameEn.trim()),
          sort_order: editId
            ? items.find((i) => i.id === editId)?.sort_order ?? items.length + 1
            : items.length + 1,
          is_active: true,
        },
        editId ?? undefined,
      )
      setMessage('Emne lagret.')
      startNew()
      await reload()
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(item: TipCategory) {
    setBusy(true)
    try {
      await setTipCategoryActive(item.id, !item.isActive)
      setMessage(item.isActive ? 'Emne skjult.' : 'Emne aktivert.')
      await reload()
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [row] = next.splice(index, 1)
    next.splice(target, 0, row)
    setItems(next)
    setBusy(true)
    try {
      await reorderTipCategories(next.map((i) => i.id))
      setMessage('Rekkefølge oppdatert.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster emner…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Tips og triks</p>
          <h1 className="admin__title">Emner / topics</h1>
        </div>
        <div className="admin__header-actions">
          <Link to="/admin/tips" className="admin__btn admin__btn--ghost">
            Artikler
          </Link>
          <button type="button" className="admin__btn admin__btn--ghost" onClick={startNew}>
            Nytt emne
          </button>
        </div>
      </header>

      <p className="admin__muted">
        Utvider eksisterende <code>tip_categories</code>. Stabile slug-IDer (
        {TIP_TOPIC_SEEDS.slice(0, 3)
          .map((s) => s.slug)
          .join(', ')}
        …). Skjul uten å slette artikler. EN: manual → auto → NO.
      </p>

      {message ? <p className="admin__message">{message}</p> : null}

      <fieldset className="admin-form__block">
        <legend>{editId ? 'Rediger emne' : 'Nytt emne'}</legend>
        <LangTabs value={lang} onChange={setLang} />
        <BilingualHint>
          {lang === 'no'
            ? 'Norsk visningsnavn for filter og kort.'
            : 'English: automatic first. Custom EN = Manual override.'}
        </BilingualHint>
        <BilingualTextInput
          lang={lang}
          labelNo="Navn (NO)"
          labelEn="Name (EN)"
          valueNo={nameNo}
          valueEn={nameEn}
          autoEn={nameEnAuto || suggestTipCategoryEn(slug, nameNo)}
          isOverride={nameEnOverride}
          onChangeNo={(value) => {
            setNameNo(value)
            if (!editId && !slug) setSlug(slugifyId(value).replace(/-/g, '_'))
            setNameEnAuto(suggestTipCategoryEn(slug || slugifyId(value), value))
          }}
          onChangeEn={(value) => {
            setNameEn(value)
            setNameEnOverride(true)
          }}
          onClearOverride={() => {
            setNameEn('')
            setNameEnOverride(false)
            setNameEnAuto(suggestTipCategoryEn(slug, nameNo))
          }}
        />
        <label className="admin-form__field">
          <span>Slug (stabil filter-ID)</span>
          <input
            value={slug}
            onChange={(e) =>
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]+/g, '_')
                  .replace(/^_|_$/g, ''),
              )
            }
          />
        </label>
        <button
          type="button"
          className="admin__btn"
          disabled={busy || !nameNo.trim()}
          onClick={() => void save()}
        >
          {busy ? 'Lagrer…' : 'Lagre emne'}
        </button>
      </fieldset>

      <ul className="admin-list">
        {items.map((item, index) => (
          <li key={item.id} className="admin-list__item">
            <div>
              <p className="admin-list__name">
                {item.nameNo || item.name}
                {!item.isActive ? ' · skjult' : ''}
              </p>
              <p className="admin-list__meta">
                {item.slug}
                {item.nameEnOverride && item.nameEn
                  ? ` · EN: ${item.nameEn}`
                  : item.nameEnAuto
                    ? ` · EN auto: ${item.nameEnAuto}`
                    : ''}{' '}
                · #{item.sort_order}
              </p>
            </div>
            <div className="admin-list__actions">
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={busy || index === 0}
                onClick={() => void move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={busy || index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={busy}
                onClick={() => startEdit(item)}
              >
                Rediger
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={busy}
                onClick={() => void toggleActive(item)}
              >
                {item.isActive ? 'Skjul' : 'Aktiver'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
