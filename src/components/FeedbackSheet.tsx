import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  submitProductFeedback,
  type ProductFeedbackRow,
} from '../lib/feedbackApi'
import type { FeedbackCategory } from '../lib/feedbackAnalysis'
import './FeedbackSheet.css'

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'general', label: 'Generelt' },
  { id: 'bug', label: 'Noe som ikke fungerer' },
  { id: 'idea', label: 'Idé / ønske' },
  { id: 'recipe', label: 'Oppskrift' },
  { id: 'other', label: 'Annet' },
]

type Props = {
  open: boolean
  onClose: () => void
  pagePath?: string
  recipeId?: string | null
}

/**
 * Intentional «Gi tilbakemelding» — analyzable text (unlike private recipe notes).
 */
export function FeedbackSheet({ open, onClose, pagePath, recipeId }: Props) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const titleId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    setSent(false)
    setError(null)
    const t = window.setTimeout(() => textareaRef.current?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await submitProductFeedback({
      body,
      category,
      pagePath: pagePath ?? (typeof location !== 'undefined' ? location.pathname : '/'),
      recipeId: recipeId ?? null,
      userId: user?.id ?? null,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Kunne ikke sende.')
      return
    }
    setSent(true)
    setBody('')
    showToast('Takk for tilbakemeldingen!')
    window.setTimeout(() => onClose(), 900)
  }

  return (
    <div
      className="feedback-sheet-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="feedback-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="feedback-sheet__header">
          <div>
            <h2 id={titleId} className="feedback-sheet__title">
              Gi tilbakemelding
            </h2>
            <p className="feedback-sheet__lead">
              Fortell hva som funker eller mangler. Dette er ikke private
              oppskriftsnotater — teksten kan leses i Admin for å forbedre
              produktet.
            </p>
          </div>
          <button
            type="button"
            className="feedback-sheet__close"
            aria-label="Lukk"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {sent ? (
          <p className="feedback-sheet__ok">Sendt. Takk!</p>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)}>
            <label className="feedback-sheet__label">
              Type
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as FeedbackCategory)
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="feedback-sheet__label">
              Melding
              <textarea
                ref={textareaRef}
                rows={5}
                maxLength={2000}
                required
                minLength={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="F.eks. «Søk fant ikke pasta» eller «Elsker Hjemme-match»"
              />
            </label>
            {error ? <p className="feedback-sheet__error">{error}</p> : null}
            <div className="feedback-sheet__actions">
              <button
                type="button"
                className="feedback-sheet__btn feedback-sheet__btn--ghost"
                onClick={onClose}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="feedback-sheet__btn"
                disabled={busy || body.trim().length < 3}
              >
                {busy ? 'Sender…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/** Re-export type for callers that peek at local rows. */
export type { ProductFeedbackRow }
