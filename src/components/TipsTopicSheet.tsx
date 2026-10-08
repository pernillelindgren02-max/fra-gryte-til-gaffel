import { useEffect } from 'react'
import { useLocale } from '../context/LocaleContext'
import type { TipCategory } from '../lib/tipsTypes'
import './TipsTopicSheet.css'

type TipsTopicSheetProps = {
  open: boolean
  topics: TipCategory[]
  selectedIds: string[]
  onToggle: (topicId: string) => void
  onClear: () => void
  onClose: () => void
}

export function TipsTopicSheet({
  open,
  topics,
  selectedIds,
  onToggle,
  onClear,
  onClose,
}: TipsTopicSheetProps) {
  const { t } = useLocale()
  const selected = new Set(selectedIds)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="tips-topic-sheet" role="presentation">
      <button
        type="button"
        className="tips-topic-sheet__backdrop"
        aria-label={t('tips.closeTopics')}
        onClick={onClose}
      />
      <div
        className="tips-topic-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tips-topic-sheet-title"
      >
        <div className="tips-topic-sheet__handle" aria-hidden="true" />
        <header className="tips-topic-sheet__header">
          <h2 id="tips-topic-sheet-title" className="tips-topic-sheet__title">
            {selectedIds.length > 0
              ? `${t('tips.topics')} (${selectedIds.length})`
              : t('tips.topics')}
          </h2>
        </header>
        <div className="tips-topic-sheet__body">
          <ul className="tips-topic-sheet__list">
            {topics.map((topic) => {
              const on = selected.has(topic.id)
              return (
                <li key={topic.id}>
                  <button
                    type="button"
                    className={`tips-topic-sheet__option${on ? ' tips-topic-sheet__option--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => onToggle(topic.id)}
                  >
                    <span>{topic.name}</span>
                    {on ? <span aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <footer className="tips-topic-sheet__footer">
          {selectedIds.length > 0 ? (
            <button
              type="button"
              className="tips-topic-sheet__secondary"
              onClick={onClear}
            >
              {t('tips.clearFilters')}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="tips-topic-sheet__primary"
            onClick={onClose}
          >
            {t('tips.applyTopics')}
          </button>
        </footer>
      </div>
    </div>
  )
}
