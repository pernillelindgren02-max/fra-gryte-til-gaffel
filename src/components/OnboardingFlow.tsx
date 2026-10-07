import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useOnboarding } from '../context/OnboardingContext'
import { trackEvent } from '../lib/analytics'
import './OnboardingFlow.css'

export function OnboardingFlow() {
  const { open, steps, mode, closeFlow } = useOnboarding()
  const [index, setIndex] = useState(0)
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({})
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setIndex(0)
      setImgFailed({})
      if (mode === 'replay') {
        trackEvent('onboarding_replay', { source: 'konto' })
      }
    }
  }, [open, steps, mode])

  useEffect(() => {
    if (!open) return
    trackEvent('onboarding_step_view', {
      source: mode ?? 'first',
      properties: { step_index: index },
    })
  }, [open, index, mode])

  if (!open || steps.length === 0) return null

  const step = steps[Math.min(index, steps.length - 1)]
  const isLast = index >= steps.length - 1
  const imageSrc =
    step.image_url && !imgFailed[step.id] ? step.image_url : null

  function goNext() {
    if (isLast) {
      trackEvent('onboarding_complete', {
        source: mode ?? 'first',
        properties: { steps: steps.length },
      })
      closeFlow(true)
      return
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  function onSkip() {
    trackEvent('onboarding_skip', {
      source: mode ?? 'first',
      properties: { at_step: index },
    })
    closeFlow(true)
  }

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) < 56) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const previewHint =
    mode === 'preview'
      ? 'Forhåndsvisning — endrer ikke din «første gang»-status'
      : mode === 'replay'
        ? 'Slik fungerer appen'
        : null

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Kom i gang">
      <div
        className="onboarding__card"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {previewHint ? (
          <p className="onboarding__mode-hint">{previewHint}</p>
        ) : null}

        <div className="onboarding__art">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              onError={() =>
                setImgFailed((prev) => ({ ...prev, [step.id]: true }))
              }
            />
          ) : (
            <div className="onboarding__art-fallback" aria-hidden="true" />
          )}
        </div>

        <div className="onboarding__progress" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`onboarding__dot${i === index ? ' onboarding__dot--on' : ''}`}
            />
          ))}
        </div>
        <p className="onboarding__count">
          {index + 1} / {steps.length}
        </p>

        <h1 className="onboarding__title">{step.title}</h1>
        <p className="onboarding__body">{step.body}</p>

        <div className="onboarding__actions">
          <button
            type="button"
            className="onboarding__primary"
            onClick={goNext}
          >
            {isLast ? 'Kom i gang' : 'Neste'}
          </button>
          {!isLast ? (
            <button
              type="button"
              className="onboarding__skip"
              onClick={onSkip}
            >
              Hopp over
            </button>
          ) : mode === 'preview' || mode === 'replay' ? (
            <button
              type="button"
              className="onboarding__skip"
              onClick={() => closeFlow(true)}
            >
              Lukk
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
