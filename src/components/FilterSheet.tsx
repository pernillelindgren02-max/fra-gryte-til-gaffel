import { useEffect } from 'react'
import { emptyFilters, type FilterState } from '../data/recipes'
import { FilterGroups } from './FilterGroups'
import './FilterSheet.css'

interface FilterSheetProps {
  open: boolean
  draftFilters: FilterState
  onDraftChange: (next: FilterState) => void
  onApply: () => void
  onClose: () => void
}

export function FilterSheet({
  open,
  draftFilters,
  onDraftChange,
  onApply,
  onClose,
}: FilterSheetProps) {
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
    <div className="filter-sheet" role="presentation">
      <button
        type="button"
        className="filter-sheet__backdrop"
        aria-label="Lukk filtre"
        onClick={onClose}
      />
      <div
        className="filter-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        <div className="filter-sheet__handle" aria-hidden="true" />
        <header className="filter-sheet__header">
          <h2 id="filter-sheet-title" className="filter-sheet__title">
            Filtrer oppskrifter
          </h2>
        </header>

        <div className="filter-sheet__body">
          <FilterGroups filters={draftFilters} onChange={onDraftChange} />
        </div>

        <footer className="filter-sheet__footer">
          <button
            type="button"
            className="filter-sheet__secondary"
            onClick={() => onDraftChange(emptyFilters)}
          >
            Nullstill filtre
          </button>
          <button type="button" className="filter-sheet__primary" onClick={onApply}>
            Vis resultater
          </button>
        </footer>
      </div>
    </div>
  )
}
