import { useEffect, useState } from 'react'
import { useOnboarding } from '../../context/OnboardingContext'
import {
  deleteOnboardingStep,
  fetchAllOnboardingSteps,
  onboardingImagePublicUrl,
  removeOnboardingImage,
  reorderOnboardingSteps,
  updateOnboardingStep,
  uploadOnboardingImage,
  upsertOnboardingStep,
} from '../../lib/onboardingApi'
import type { OnboardingStep } from '../../lib/onboardingDefaults'
import {
  suggestOnboardingBodyEn,
  suggestOnboardingTitleEn,
} from '../../i18n/editorialAuto'
import {
  BilingualHint,
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import { toUserSaveError } from '../../lib/userErrors'
import './Admin.css'

export function AdminOnboardingPage() {
  const { openPreview, refreshSteps } = useOnboarding()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [lang, setLang] = useState<ContentLangTab>('no')

  async function reload() {
    setLoading(true)
    try {
      const rows = await fetchAllOnboardingSteps()
      setSteps(rows)
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

  function patchLocal(id: string, patch: Partial<OnboardingStep>) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    )
  }

  async function saveStep(step: OnboardingStep) {
    setSaving(true)
    try {
      await updateOnboardingStep(step.id, {
        title: step.titleNo || step.title,
        titleNo: step.titleNo || step.title,
        titleEn: step.titleEn,
        titleEnAuto: step.titleEnAuto,
        titleEnOverride: step.titleEnOverride,
        body: step.bodyNo || step.body,
        bodyNo: step.bodyNo || step.body,
        bodyEn: step.bodyEn,
        bodyEnAuto: step.bodyEnAuto,
        bodyEnOverride: step.bodyEnOverride,
        image_url: step.image_url,
        sort_order: step.sort_order,
        is_active: step.is_active,
      })
      await refreshSteps()
      setMessage('Steg lagret.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onToggleActive(step: OnboardingStep) {
    const next = !step.is_active
    patchLocal(step.id, { is_active: next })
    setSaving(true)
    try {
      await updateOnboardingStep(step.id, { is_active: next })
      await refreshSteps()
      setMessage(next ? 'Steg aktivert.' : 'Steg skjult (deaktivert).')
    } catch (err) {
      patchLocal(step.id, { is_active: step.is_active })
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setSteps(next)
    setSaving(true)
    try {
      await reorderOnboardingSteps(next.map((s) => s.id))
      await refreshSteps()
      setMessage('Rekkefølge oppdatert.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
      void reload()
    } finally {
      setSaving(false)
    }
  }

  async function onUpload(step: OnboardingStep, file: File | null) {
    if (!file) return
    setSaving(true)
    try {
      const path = await uploadOnboardingImage(step.id, file)
      const url = onboardingImagePublicUrl(path)
      patchLocal(step.id, { image_url: url })
      await updateOnboardingStep(step.id, { image_url: path })
      await refreshSteps()
      setMessage('Bilde lastet opp.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onClearImage(step: OnboardingStep) {
    setSaving(true)
    try {
      if (step.image_url) await removeOnboardingImage(step.image_url)
      patchLocal(step.id, { image_url: null })
      await updateOnboardingStep(step.id, { image_url: null })
      await refreshSteps()
      setMessage('Bilde fjernet.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onAddStep() {
    setSaving(true)
    try {
      const created = await upsertOnboardingStep({
        title: 'Nytt steg',
        titleNo: 'Nytt steg',
        titleEn: '',
        titleEnAuto: '',
        titleEnOverride: false,
        body: '',
        bodyNo: '',
        bodyEn: '',
        bodyEnAuto: '',
        bodyEnOverride: false,
        image_url: null,
        sort_order: steps.length + 1,
        is_active: true,
      })
      setSteps((prev) => [...prev, created])
      await refreshSteps()
      setMessage('Nytt steg lagt til.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(step: OnboardingStep) {
    if (!window.confirm(`Slette «${step.titleNo || step.title}» for godt?`))
      return
    setSaving(true)
    try {
      await deleteOnboardingStep(step.id)
      setSteps((prev) => prev.filter((s) => s.id !== step.id))
      await refreshSteps()
      setMessage('Steg slettet.')
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
          <p className="admin__eyebrow">Onboarding</p>
          <h1 className="admin__title">Første gangs opplevelse</h1>
        </div>
        <div className="admin__header-actions">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => {
              void refreshSteps()
              openPreview()
            }}
          >
            Forhåndsvis
          </button>
          <button
            type="button"
            className="admin__btn"
            disabled={saving}
            onClick={() => void onAddStep()}
          >
            Nytt steg
          </button>
        </div>
      </header>

      <p className="admin__muted">
        Aktive steg vises for nye brukere. Deaktiver for å skjule uten å slette.
        Forhåndsvis endrer ikke din egen «har sett onboarding»-flagg i
        localStorage.
      </p>

      <LangTabs value={lang} onChange={setLang} />
      <BilingualHint>
        {lang === 'no'
          ? 'Norsk er hovedinnhold for hvert steg.'
          : 'English: automatic/default first. Saving custom EN marks Manual override.'}
      </BilingualHint>

      {message && <p className="admin__message">{message}</p>}

      {steps.length === 0 ? (
        <p className="admin__muted">
          Ingen steg i databasen ennå. Kjør <code>supabase/onboarding.sql</code>{' '}
          eller legg til et steg.
        </p>
      ) : null}

      {steps.map((step, index) => {
        const titleNo = step.titleNo || step.title
        const bodyNo = step.bodyNo || step.body
        const titleAuto =
          step.titleEnAuto || suggestOnboardingTitleEn(step.id, titleNo)
        const bodyAuto =
          step.bodyEnAuto || suggestOnboardingBodyEn(step.id, titleNo)
        return (
          <fieldset key={step.id} className="admin-form__block">
            <legend>
              Steg {index + 1}{' '}
              {!step.is_active ? (
                <span className="admin__muted">(skjult)</span>
              ) : null}
            </legend>

            <div className="admin-form__reorder admin-form__reorder--row">
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={index === 0 || saving}
                onClick={() => void onMove(index, -1)}
              >
                ↑ Opp
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={index === steps.length - 1 || saving}
                onClick={() => void onMove(index, 1)}
              >
                ↓ Ned
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={saving}
                onClick={() => void onToggleActive(step)}
              >
                {step.is_active ? 'Deaktiver' : 'Aktiver'}
              </button>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={saving}
                onClick={() => void onDelete(step)}
              >
                Slett
              </button>
            </div>

            <BilingualTextInput
              lang={lang}
              labelNo="Tittel (NO)"
              labelEn="Title (EN)"
              valueNo={titleNo}
              valueEn={step.titleEn}
              autoEn={titleAuto}
              isOverride={step.titleEnOverride}
              onChangeNo={(value) =>
                patchLocal(step.id, {
                  title: value,
                  titleNo: value,
                  titleEnAuto: suggestOnboardingTitleEn(step.id, value),
                  bodyEnAuto: suggestOnboardingBodyEn(step.id, value),
                })
              }
              onChangeEn={(value) =>
                patchLocal(step.id, {
                  titleEn: value,
                  titleEnOverride: true,
                  titleEnAuto: titleAuto,
                })
              }
              onClearOverride={() =>
                patchLocal(step.id, {
                  titleEn: '',
                  titleEnOverride: false,
                  titleEnAuto: suggestOnboardingTitleEn(step.id, titleNo),
                })
              }
            />
            <BilingualTextInput
              lang={lang}
              labelNo="Tekst (NO)"
              labelEn="Body (EN)"
              valueNo={bodyNo}
              valueEn={step.bodyEn}
              autoEn={bodyAuto}
              isOverride={step.bodyEnOverride}
              multiline
              onChangeNo={(value) =>
                patchLocal(step.id, {
                  body: value,
                  bodyNo: value,
                })
              }
              onChangeEn={(value) =>
                patchLocal(step.id, {
                  bodyEn: value,
                  bodyEnOverride: true,
                  bodyEnAuto: bodyAuto,
                })
              }
              onClearOverride={() =>
                patchLocal(step.id, {
                  bodyEn: '',
                  bodyEnOverride: false,
                  bodyEnAuto: suggestOnboardingBodyEn(step.id, titleNo),
                })
              }
            />

            <div className="admin-form__onboarding-image">
              {step.image_url ? (
                <img
                  src={step.image_url}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const empty = e.currentTarget.nextElementSibling
                    if (empty instanceof HTMLElement) empty.hidden = false
                  }}
                />
              ) : null}
              <div
                className="admin-form__onboarding-image-empty"
                hidden={Boolean(step.image_url)}
              >
                Ingen bilde
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  void onUpload(step, e.target.files?.[0] ?? null)
                }
              />
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                disabled={saving || !step.image_url}
                onClick={() => void onClearImage(step)}
              >
                Fjern bilde
              </button>
            </div>

            <button
              type="button"
              className="admin__btn"
              disabled={saving}
              onClick={() => void saveStep(step)}
            >
              Lagre steg
            </button>
          </fieldset>
        )
      })}
    </div>
  )
}
