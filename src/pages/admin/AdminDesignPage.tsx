import { useEffect, useMemo, useState } from 'react'
import { fetchAppTheme, saveAppTheme } from '../../lib/siteContentApi'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type AppThemeTokens,
} from '../../lib/siteDefaults'
import { applyThemeToDocument, validateTheme } from '../../lib/themeValidate'
import { useSiteContent } from '../../context/SiteContentContext'
import './Admin.css'

const LABELS: Record<keyof AppThemeTokens, string> = {
  terracotta: 'Terracotta (primær CTA)',
  teal: 'Teal (tekst)',
  olive: 'Oliven',
  warmOrange: 'Varm oransje',
  softYellow: 'Myk gul',
  paleGreen: 'Lys grønn',
  bg: 'Bakgrunn',
  card: 'Kort-bakgrunn',
  logoBlob: 'Logo-blob',
}

export function AdminDesignPage() {
  const { refresh } = useSiteContent()
  const [tokens, setTokens] = useState<AppThemeTokens>({ ...DEFAULT_THEME })
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const validation = useMemo(() => validateTheme(tokens), [tokens])

  useEffect(() => {
    let active = true
    void (async () => {
      const next = await fetchAppTheme()
      if (active) {
        setTokens(next)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function previewLive(next: AppThemeTokens) {
    setTokens(next)
    if (validateTheme(next).ok) applyThemeToDocument(next)
  }

  async function onSave() {
    const check = validateTheme(tokens)
    if (!check.ok) {
      setMessage(check.errors.join(' '))
      return
    }
    if (
      !window.confirm(
        'Lagre design? Fargene gjelder for hele appen for alle brukere.',
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await saveAppTheme(tokens)
      await refresh()
      setMessage('Design lagret.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
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
          <p className="admin__eyebrow">Design</p>
          <h1 className="admin__title">Farger</h1>
        </div>
        <button
          type="button"
          className="admin__btn"
          disabled={saving || !validation.ok}
          onClick={() => void onSave()}
        >
          {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <fieldset className="admin-form__block">
        <legend>Trygge forhåndsvalg</legend>
        <div className="admin__header-actions">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="admin__btn admin__btn--ghost"
              onClick={() => previewLive({ ...preset.tokens })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="admin-form__grid">
        {(Object.keys(LABELS) as (keyof AppThemeTokens)[]).map((key) => (
          <label key={key} className="admin-form__field">
            <span>{LABELS[key]}</span>
            <div className="admin-color-row">
              <input
                type="color"
                value={tokens[key]}
                onChange={(e) =>
                  previewLive({ ...tokens, [key]: e.target.value })
                }
              />
              <input
                value={tokens[key]}
                onChange={(e) =>
                  previewLive({ ...tokens, [key]: e.target.value })
                }
              />
            </div>
          </label>
        ))}
      </div>

      {!validation.ok && (
        <ul className="admin__message">
          {validation.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
      {validation.warnings.length > 0 && (
        <ul className="admin__muted">
          {validation.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div
        className="admin-theme-preview"
        style={{
          background: tokens.bg,
          color: tokens.teal,
          borderColor: tokens.paleGreen,
        }}
      >
        <p style={{ fontFamily: 'var(--font-brand)', color: tokens.terracotta }}>
          Fra Gryte Til Gaffel
        </p>
        <p>Forhåndsvisning av tekstkontrast på bakgrunn.</p>
        <button
          type="button"
          style={{
            background: tokens.terracotta,
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '0.5rem 1rem',
          }}
        >
          Eksempel-knapp
        </button>
      </div>
    </div>
  )
}
