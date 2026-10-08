import { useEffect, useId, useState } from 'react'
import type { Recipe } from '../data/recipes'
import { useLocale } from '../context/LocaleContext'
import { useToast } from '../context/ToastContext'
import { trackEvent } from '../lib/analytics'
import {
  canShareFiles,
  generateRecipePdf,
  recipeAbsoluteUrl,
} from '../lib/recipePdf'
import './RecipeShareSheet.css'

type Props = {
  open: boolean
  onClose: () => void
  recipe: Recipe
  portions: number
}

export function RecipeShareSheet({
  open,
  onClose,
  recipe,
  portions,
}: Props) {
  const { locale, t } = useLocale()
  const { showToast } = useToast()
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setBusy(false)
    setPdfBlob(null)
    setPdfName(null)
    setFallback(false)
    trackEvent('recipe_share_menu_opened', {
      recipeId: recipe.id,
      source: 'recipe',
    })
  }, [open, recipe.id])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const deepLink = recipeAbsoluteUrl(recipe.id)

  async function shareLink() {
    setError(null)
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.name,
          text: recipe.shortDescription || recipe.name,
          url: deepLink,
        })
        trackEvent('recipe_link_shared', {
          recipeId: recipe.id,
          source: 'recipe',
          properties: { via: 'native_share' },
        })
        trackEvent('recipe_share', {
          recipeId: recipe.id,
          source: 'recipe',
          properties: { kind: 'link' },
        })
        onClose()
        return
      }
    } catch (err) {
      // User cancel → silent
      if (err instanceof Error && err.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(deepLink)
      showToast(t('share.linkCopied'))
      trackEvent('recipe_link_shared', {
        recipeId: recipe.id,
        source: 'recipe',
        properties: { via: 'clipboard' },
      })
      trackEvent('recipe_share', {
        recipeId: recipe.id,
        source: 'recipe',
        properties: { kind: 'link' },
      })
      onClose()
    } catch {
      setError(deepLink)
    }
  }

  async function makePdf(): Promise<{ blob: Blob; filename: string } | null> {
    setBusy(true)
    setError(null)
    try {
      const result = await generateRecipePdf(recipe, {
        locale,
        portions,
        deepLinkUrl: deepLink,
      })
      setPdfBlob(result.blob)
      setPdfName(result.filename)
      trackEvent('recipe_pdf_generated', {
        recipeId: recipe.id,
        source: 'recipe',
      })
      return { blob: result.blob, filename: result.filename }
    } catch {
      setError(t('share.pdfFailed'))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function sharePdf() {
    const made = pdfBlob && pdfName
      ? { blob: pdfBlob, filename: pdfName }
      : await makePdf()
    if (!made) return

    const file = new File([made.blob], made.filename, {
      type: 'application/pdf',
    })

    if (canShareFiles()) {
      try {
        await navigator.share({
          files: [file],
          title: recipe.name,
        })
        trackEvent('recipe_pdf_shared', {
          recipeId: recipe.id,
          source: 'recipe',
          properties: { via: 'native_share' },
        })
        trackEvent('recipe_share', {
          recipeId: recipe.id,
          source: 'recipe',
          properties: { kind: 'pdf' },
        })
        onClose()
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setFallback(true)
        return
      }
    }
    setFallback(true)
  }

  function downloadPdf() {
    const blob = pdfBlob
    const name = pdfName
    if (!blob || !name) {
      void makePdf().then((made) => {
        if (!made) return
        triggerDownload(made.blob, made.filename)
      })
      return
    }
    triggerDownload(blob, name)
  }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    trackEvent('recipe_pdf_downloaded', {
      recipeId: recipe.id,
      source: 'recipe',
    })
  }

  async function printPdf() {
    const made = pdfBlob && pdfName
      ? { blob: pdfBlob, filename: pdfName }
      : await makePdf()
    if (!made) return
    const url = URL.createObjectURL(made.blob)
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (win) {
      win.addEventListener('load', () => {
        try {
          win.focus()
          win.print()
        } catch {
          /* ignore */
        }
      })
      trackEvent('recipe_printed', {
        recipeId: recipe.id,
        source: 'recipe',
      })
    } else {
      triggerDownload(made.blob, made.filename)
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div
      className="recipe-share-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="recipe-share"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="recipe-share__title">
          {t('share.menu')}
        </h2>
        <div className="recipe-share__actions">
          <button
            type="button"
            className="recipe-share__btn recipe-share__btn--primary"
            onClick={() => void shareLink()}
          >
            {t('share.link')}
          </button>
          <button
            type="button"
            className="recipe-share__btn"
            disabled={busy}
            onClick={() => void sharePdf()}
          >
            {busy ? t('share.makingPdf') : t('share.pdf')}
          </button>
          {fallback ? (
            <>
              <button
                type="button"
                className="recipe-share__btn"
                disabled={busy}
                onClick={() => downloadPdf()}
              >
                {t('share.downloadPdf')}
              </button>
              <button
                type="button"
                className="recipe-share__btn"
                disabled={busy}
                onClick={() => void printPdf()}
              >
                {t('share.print')}
              </button>
            </>
          ) : null}
          {error ? (
            <button
              type="button"
              className="recipe-share__btn"
              disabled={busy}
              onClick={() => void sharePdf()}
            >
              {t('share.retry')}
            </button>
          ) : null}
          <button
            type="button"
            className="recipe-share__btn recipe-share__btn--ghost"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
        </div>
        {busy ? <p className="recipe-share__status">{t('share.makingPdf')}</p> : null}
        {error ? <p className="recipe-share__error">{error}</p> : null}
      </div>
    </div>
  )
}
