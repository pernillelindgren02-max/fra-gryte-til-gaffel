import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  adminListNotifications,
  adminSendNotification,
  type AdminNotificationRow,
} from '../../lib/notificationsApi'
import { fetchAllRecipesForAdmin } from '../../lib/adminRecipes'
import type { RecipeRow } from '../../lib/recipeMapper'
import {
  suggestEnglishDescription,
  suggestEnglishTitle,
} from '../../i18n/autoEnglish'
import {
  suggestNotificationBodyEn,
  suggestNotificationBodyNo,
  suggestNotificationTitleEn,
  suggestNotificationTitleNo,
} from '../../i18n/editorialAuto'
import {
  BilingualHint,
  BilingualTextInput,
  EnSourceBadge,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import './Admin.css'
import { toUserSaveError } from '../../lib/userErrors'

export function AdminNotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const preselect = searchParams.get('recipe') ?? ''

  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [history, setHistory] = useState<AdminNotificationRow[]>([])
  const [recipeId, setRecipeId] = useState(preselect)
  const [titleNo, setTitleNo] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleEnAuto, setTitleEnAuto] = useState('')
  const [titleEnOverride, setTitleEnOverride] = useState(false)
  const [bodyNo, setBodyNo] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyEnAuto, setBodyEnAuto] = useState('')
  const [bodyEnOverride, setBodyEnOverride] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<ContentLangTab>('no')

  const published = useMemo(
    () => recipes.filter((r) => r.is_published),
    [recipes],
  )

  function applyRecipeDefaults(recipe: RecipeRow) {
    const nameNo = String(recipe.name_no ?? recipe.name ?? '').trim()
    const nameEn =
      (recipe.name_en_override && recipe.name_en
        ? recipe.name_en
        : recipe.name_en_auto ||
          suggestEnglishTitle(recipe.id, nameNo) ||
          recipe.name_en ||
          nameNo) || ''
    const shortNo = String(
      recipe.short_description_no ?? recipe.short_description ?? '',
    ).trim()
    const shortEn =
      (recipe.short_description_en_override && recipe.short_description_en
        ? recipe.short_description_en
        : recipe.short_description_en_auto ||
          suggestEnglishDescription(recipe.id, shortNo) ||
          recipe.short_description_en ||
          '') || ''

    const tNo = suggestNotificationTitleNo(nameNo)
    const tEn = suggestNotificationTitleEn(nameEn)
    const bNo = suggestNotificationBodyNo(nameNo, shortNo)
    const bEn = suggestNotificationBodyEn(nameEn, shortEn)

    setTitleNo(tNo)
    setTitleEn('')
    setTitleEnAuto(tEn)
    setTitleEnOverride(false)
    setBodyNo(bNo)
    setBodyEn('')
    setBodyEnAuto(bEn)
    setBodyEnOverride(false)
  }

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [rows, past] = await Promise.all([
          fetchAllRecipesForAdmin(),
          adminListNotifications().catch(() => [] as AdminNotificationRow[]),
        ])
        if (!active) return
        setRecipes(rows)
        setHistory(past)
        if (preselect) {
          const recipe = rows.find((r) => r.id === preselect && r.is_published)
          if (recipe) {
            setRecipeId(recipe.id)
            applyRecipeDefaults(recipe)
          }
        }
      } catch (err) {
        if (active) {
          setMessage(toUserSaveError(err, 'admin'))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [preselect])

  function onPickRecipe(id: string) {
    setRecipeId(id)
    const recipe = published.find((r) => r.id === id)
    if (recipe) applyRecipeDefaults(recipe)
    setPreviewing(false)
    if (id) setSearchParams({ recipe: id })
    else setSearchParams({})
  }

  async function onSend() {
    if (!titleNo.trim()) {
      setMessage('Tittel (NO) er påkrevd.')
      return
    }
    const effectiveEnTitle = titleEnOverride
      ? titleEn.trim()
      : titleEnAuto.trim()
    if (
      !window.confirm(
        `Sende varslet til brukere som har varsler på?\n\nNO: «${titleNo.trim()}»\nEN: «${effectiveEnTitle || '(Norwegian fallback)'}»`,
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await adminSendNotification({
        recipeId: recipeId || null,
        title: titleNo.trim(),
        body: bodyNo.trim(),
        titleNo: titleNo.trim(),
        titleEn: titleEnOverride ? titleEn.trim() : '',
        titleEnAuto: titleEnAuto.trim(),
        titleEnOverride: titleEnOverride && Boolean(titleEn.trim()),
        bodyNo: bodyNo.trim(),
        bodyEn: bodyEnOverride ? bodyEn.trim() : '',
        bodyEnAuto: bodyEnAuto.trim(),
        bodyEnOverride: bodyEnOverride && Boolean(bodyEn.trim()),
      })
      const past = await adminListNotifications()
      setHistory(past)
      setMessage(
        `Sendt til ${result.recipient_count} bruker${result.recipient_count === 1 ? '' : 'e'} (kun i appen — ingen push ennå).`,
      )
      setPreviewing(false)
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster…</p>
      </div>
    )
  }

  const previewTitleEn = titleEnOverride ? titleEn : titleEnAuto
  const previewBodyEn = bodyEnOverride ? bodyEn : bodyEnAuto

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Varsler</p>
          <h1 className="admin__title">Send in-app-varsel</h1>
          <p className="admin__muted">
            Sendes bare når du trykker Send. Ingen auto-send ved publisering.
            Native push kommer senere via Edge Function + push_tokens.
          </p>
        </div>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <div className="admin-form">
        <label className="admin-form__field">
          <span>Publisert oppskrift</span>
          <select
            value={recipeId}
            onChange={(e) => onPickRecipe(e.target.value)}
          >
            <option value="">— Velg —</option>
            {published.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>

        <LangTabs value={lang} onChange={setLang} />
        <BilingualHint>
          {lang === 'no'
            ? 'Norsk tittel/tekst lagres alltid (legacy title/body + _no).'
            : 'English auto comes from the recipe’s resolved EN title/description. Override for a custom message.'}
        </BilingualHint>

        <BilingualTextInput
          lang={lang}
          labelNo="Tittel (NO)"
          labelEn="Title (EN)"
          valueNo={titleNo}
          valueEn={titleEn}
          autoEn={titleEnAuto}
          isOverride={titleEnOverride}
          onChangeNo={(value) => {
            setTitleNo(value)
            setPreviewing(false)
          }}
          onChangeEn={(value) => {
            setTitleEn(value)
            setTitleEnOverride(true)
            setPreviewing(false)
          }}
          onClearOverride={() => {
            setTitleEn('')
            setTitleEnOverride(false)
            setPreviewing(false)
          }}
        />

        <BilingualTextInput
          lang={lang}
          labelNo="Kort melding (NO)"
          labelEn="Short message (EN)"
          valueNo={bodyNo}
          valueEn={bodyEn}
          autoEn={bodyEnAuto}
          isOverride={bodyEnOverride}
          multiline
          onChangeNo={(value) => {
            setBodyNo(value)
            setPreviewing(false)
          }}
          onChangeEn={(value) => {
            setBodyEn(value)
            setBodyEnOverride(true)
            setPreviewing(false)
          }}
          onClearOverride={() => {
            setBodyEn('')
            setBodyEnOverride(false)
            setPreviewing(false)
          }}
        />

        <div className="admin-form__footer">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => setPreviewing(true)}
            disabled={!titleNo.trim()}
          >
            Forhåndsvis
          </button>
          <button
            type="button"
            className="admin__btn"
            disabled={busy || !titleNo.trim() || !previewing}
            onClick={() => void onSend()}
          >
            {busy ? 'Sender…' : 'Send'}
          </button>
        </div>
        {!previewing && titleNo.trim() && (
          <p className="admin__muted">
            Forhåndsvis først, deretter Send (bekreftelse).
          </p>
        )}

        {previewing ? (
          <div className="admin-form__block">
            <legend>Forhåndsvisning</legend>
            <p>
              <strong>NO</strong> {titleNo}
            </p>
            <p className="admin__muted">{bodyNo}</p>
            <p className="admin-form__label-row">
              <strong>EN</strong>{' '}
              <EnSourceBadge isOverride={titleEnOverride} />
            </p>
            <p>{previewTitleEn || titleNo}</p>
            <p className="admin__muted">{previewBodyEn || bodyNo}</p>
          </div>
        ) : null}
      </div>

      <h2 className="admin__subtitle">Tidligere varsler</h2>
      {history.length === 0 ? (
        <p className="admin__muted">Ingen sendt ennå.</p>
      ) : (
        <ul className="admin-list">
          {history.map((row) => (
            <li key={row.id} className="admin-list__item">
              <div>
                <p className="admin-list__name">{row.title}</p>
                <p className="admin-list__meta">
                  {row.body}
                  {row.title_en ? ` · EN: ${row.title_en}` : ''}
                </p>
                <p className="admin-list__meta">
                  {new Date(row.sent_at).toLocaleString('nb-NO')} ·{' '}
                  {row.recipient_count} mottakere · {row.read_count} lest
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
