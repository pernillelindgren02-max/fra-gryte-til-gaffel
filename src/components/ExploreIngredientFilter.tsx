import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import type { FridgeItem } from '../context/PantryContext'
import type { ExploreIngredientRef } from '../lib/exploreSession'
import { resolveCanonicalIngredientId } from '../utils/matchPantryRecipes'
import { suggestIngredients } from '../utils/suggestIngredients'
import type { Recipe } from '../data/recipes'
import './ExploreIngredientFilter.css'

type ExploreIngredientFilterProps = {
  selected: ExploreIngredientRef[]
  onChange: (next: ExploreIngredientRef[]) => void
  pantry: FridgeItem[]
  recipes: Recipe[]
}

/**
 * First section of “Filtrer oppskrifter”: temporary ingredient selection
 * (manual autocomplete + pick from fridge). Does not mutate Kjøleskap inventory.
 */
export function ExploreIngredientFilter({
  selected,
  onChange,
  pantry,
  recipes,
}: ExploreIngredientFilterProps) {
  const { t } = useLocale()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [fridgePickerOpen, setFridgePickerOpen] = useState(false)

  const knownNames = useMemo(() => {
    const set = new Set<string>()
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        if (ing.name) set.add(ing.name)
        if (ing.nameNo) set.add(ing.nameNo)
        if (ing.nameEn) set.add(ing.nameEn)
      }
    }
    return [...set]
  }, [recipes])

  const selectedNames = useMemo(() => selected.map((s) => s.name), [selected])
  const suggestions = useMemo(
    () => suggestIngredients(knownNames, draft, selectedNames),
    [knownNames, draft, selectedNames],
  )

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpenSuggest(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function addIngredient(rawName: string) {
    const name = rawName.trim()
    if (!name) return
    const id = resolveCanonicalIngredientId(name, recipes)
    if (
      selected.some(
        (item) =>
          item.id === id ||
          item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setDraft('')
      setOpenSuggest(false)
      return
    }
    onChange([...selected, { id, name }])
    setDraft('')
    setOpenSuggest(false)
    setHighlight(0)
  }

  function removeIngredient(id: string) {
    onChange(selected.filter((item) => item.id !== id))
  }

  function clearAll() {
    onChange([])
  }

  function toggleFromFridge(item: FridgeItem) {
    const exists = selected.some((s) => s.id === item.id)
    if (exists) {
      onChange(selected.filter((s) => s.id !== item.id))
    } else {
      onChange([...selected, { id: item.id, name: item.name }])
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (openSuggest && suggestions[highlight] && !suggestions[highlight].selected) {
      addIngredient(suggestions[highlight].name)
      return
    }
    addIngredient(draft)
  }

  return (
    <div className="explore-ing-filter">
      <h3 className="explore-ing-filter__title">{t('explore.fridgeFilter')}</h3>
      <p className="explore-ing-filter__lead">{t('explore.ingredientFilterLead')}</p>

      <div className="explore-ing-filter__compose" ref={wrapRef}>
        <form className="explore-ing-filter__form" onSubmit={onSubmit}>
          <label className="explore-ing-filter__field">
            <span className="visually-hidden">{t('fridge.ingredient')}</span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={openSuggest}
              aria-controls={listboxId}
              aria-autocomplete="list"
              placeholder={t('pantry.placeholder')}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setOpenSuggest(true)
                setHighlight(0)
              }}
              onFocus={() => setOpenSuggest(true)}
              onKeyDown={(e) => {
                if (!openSuggest) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setHighlight((h) =>
                    Math.min(h + 1, Math.max(0, suggestions.length - 1)),
                  )
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setHighlight((h) => Math.max(0, h - 1))
                } else if (e.key === 'Escape') {
                  setOpenSuggest(false)
                }
              }}
            />
          </label>
          <button type="submit" className="explore-ing-filter__add">
            {t('pantry.add')}
          </button>
        </form>
        {openSuggest && draft.trim() ? (
          <div className="explore-ing-filter__suggest" id={listboxId} role="listbox">
            {suggestions.length === 0 ? (
              <p className="explore-ing-filter__suggest-empty" role="status">
                {t('fridge.noSuggest')}
              </p>
            ) : (
              <ul className="explore-ing-filter__suggest-list">
                {suggestions.map((s, i) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlight}
                      className={`explore-ing-filter__suggest-item${i === highlight ? ' explore-ing-filter__suggest-item--selected' : ''}`}
                      disabled={s.selected}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => addIngredient(s.name)}
                    >
                      {s.name}
                      {s.selected ? (
                        <span className="explore-ing-filter__suggest-mark">
                          {t('fridge.selected')}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={`explore-ing-filter__fridge-btn${fridgePickerOpen ? ' explore-ing-filter__fridge-btn--on' : ''}`}
        aria-expanded={fridgePickerOpen}
        onClick={() => setFridgePickerOpen((v) => !v)}
      >
        {t('explore.chooseFromFridge')}
      </button>

      {fridgePickerOpen ? (
        pantry.length === 0 ? (
          <p className="explore-ing-filter__hint">
            {t('explore.fridgeFilterEmpty')}{' '}
            <Link to="/kjoleskap">{t('nav.fridge')}</Link>
          </p>
        ) : (
          <ul
            className="explore-ing-filter__fridge-list"
            aria-label={t('fridge.yourItems')}
          >
            {pantry.map((item) => {
              const on = selected.some((s) => s.id === item.id)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`explore-ing-filter__fridge-chip${on ? ' explore-ing-filter__fridge-chip--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleFromFridge(item)}
                  >
                    {item.name}
                    {on ? <span aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : null}

      {selected.length > 0 ? (
        <div className="explore-ing-filter__selected">
          <div className="explore-ing-filter__selected-head">
            <p className="explore-ing-filter__selected-label">
              {t('explore.selectedIngredients')} ({selected.length})
            </p>
            <button
              type="button"
              className="explore-ing-filter__clear"
              onClick={clearAll}
            >
              {t('explore.clearAll')}
            </button>
          </div>
          <ul className="explore-ing-filter__chips">
            {selected.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="explore-ing-filter__chip"
                  onClick={() => removeIngredient(item.id)}
                  aria-label={`${t('fridge.remove')} ${item.name}`}
                >
                  <span>{item.name}</span>
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
