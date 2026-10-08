import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { EmptyState } from '../components/EmptyState'
import { useLocale } from '../context/LocaleContext'
import { BackToExplore } from '../components/BackToExplore'
import {
  FRIDGE_UNITS,
  usePantry,
  type FridgeUnit,
} from '../context/PantryContext'
import { useRecipes } from '../context/RecipesContext'
import type { MessageKey } from '../i18n/messages'
import { trackEvent } from '../lib/analytics'
import {
  getKnownIngredientNames,
  resolveCanonicalIngredientId,
} from '../utils/matchPantryRecipes'
import { suggestIngredients } from '../utils/suggestIngredients'
import './PantryPage.css'

const UNIT_KEYS: Record<FridgeUnit, MessageKey> = {
  stk: 'fridge.unit.stk',
  g: 'fridge.unit.g',
  kg: 'fridge.unit.kg',
  ml: 'fridge.unit.ml',
  dl: 'fridge.unit.dl',
  l: 'fridge.unit.l',
}

function parseDraftQty(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 1000) / 1000
}

/** Kjøleskap / Fridge — inventory only (no recipe recommendations). */
export function PantryPage() {
  const { recipes } = useRecipes()
  const { locale, t } = useLocale()
  const { pantry, addItem, updateItem, removeItem, clear } = usePantry()
  const [draft, setDraft] = useState('')
  const [draftQty, setDraftQty] = useState('')
  const [draftUnit, setDraftUnit] = useState<FridgeUnit | ''>('')
  const [message, setMessage] = useState<string | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editUnit, setEditUnit] = useState<FridgeUnit | ''>('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const trackedOpen = useRef(false)

  useEffect(() => {
    if (trackedOpen.current) return
    trackedOpen.current = true
    trackEvent('fridge_opened', { source: 'fridge' })
  }, [])

  const knownNames = useMemo(() => getKnownIngredientNames(recipes), [recipes])
  const pantryNames = useMemo(() => pantry.map((p) => p.name), [pantry])
  const suggestions = useMemo(
    () => suggestIngredients(knownNames, draft, pantryNames),
    [knownNames, draft, pantryNames],
  )
  const showSuggestions = suggestOpen
  const hasQuery = draft.trim().length > 0
  const noMatches = hasQuery && suggestions.length === 0

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (wrapRef.current && target && !wrapRef.current.contains(target)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [])

  function commitName(raw: string) {
    const canonicalId = resolveCanonicalIngredientId(raw, recipes)
    const qty = parseDraftQty(draftQty)
    const unit = draftUnit || null
    // Both or neither — quantity alone without unit is ignored.
    const result = addItem(
      raw,
      knownNames,
      canonicalId,
      qty != null && unit ? qty : null,
      qty != null && unit ? unit : null,
    )
    if (result === 'empty') return
    if (result === 'duplicate') {
      setMessage(t('pantry.already'))
      setDraft('')
      return
    }
    const knownHit = knownNames.find(
      (n) => n.trim().toLowerCase() === raw.trim().toLowerCase(),
    )
    trackEvent('fridge_ingredient_added', {
      source: 'fridge',
      properties: {
        via: knownHit ? 'known' : 'typed',
        ingredient_key: canonicalId.slice(0, 40),
        has_qty: qty != null && unit ? 1 : 0,
      },
    })
    setDraft('')
    setDraftQty('')
    setDraftUnit('')
    setMessage(null)
    setSuggestOpen(true)
    inputRef.current?.focus()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    commitName(draft)
  }

  function onPickSuggestion(name: string, alreadySelected: boolean) {
    if (alreadySelected) {
      setMessage(t('pantry.already'))
      setDraft('')
      return
    }
    commitName(name)
  }

  function onClearAll() {
    if (pantry.length === 0) return
    if (
      !window.confirm(
        locale === 'en'
          ? 'Clear the whole fridge inventory?'
          : 'Tøm hele kjøleskapet?',
      )
    ) {
      return
    }
    clear()
    trackEvent('fridge_cleared', {
      source: 'fridge',
      properties: { count: pantry.length },
    })
  }

  function startEdit(id: string, quantity: number | null, unit: FridgeUnit | null) {
    setEditingId(id)
    setEditQty(quantity != null ? String(quantity) : '')
    setEditUnit(unit ?? '')
  }

  function saveEdit(id: string) {
    const qty = parseDraftQty(editQty)
    const unit = editUnit || null
    updateItem(id, {
      quantity: qty != null && unit ? qty : null,
      unit: qty != null && unit ? unit : null,
    })
    trackEvent('fridge_ingredient_qty_updated', {
      source: 'fridge',
      properties: {
        ingredient_key: id.slice(0, 40),
        has_qty: qty != null && unit ? 1 : 0,
      },
    })
    setEditingId(null)
  }

  function clearAmount(id: string) {
    updateItem(id, { quantity: null, unit: null })
    setEditingId(null)
  }

  const countLabel =
    locale === 'en'
      ? pantry.length === 1
        ? 'You have 1 ingredient'
        : `You have ${pantry.length} ingredients`
      : pantry.length === 1
        ? 'Du har 1 ingrediens'
        : `Du har ${pantry.length} ingredienser`

  function formatItemAmount(
    quantity: number | null,
    unit: FridgeUnit | null,
  ): string | null {
    if (quantity == null || unit == null) return null
    return `${quantity} ${t(UNIT_KEYS[unit])}`
  }

  return (
    <div className="pantry">
      <BackToExplore />
      <header className="pantry__header">
        <h1 className="pantry__title">{t('fridge.title')}</h1>
        <p className="pantry__lead">{t('fridge.lead')}</p>
      </header>

      <div className="pantry__compose" ref={wrapRef}>
        <form className="pantry__form" onSubmit={onSubmit}>
          <label className="pantry__field">
            <span className="visually-hidden">{t('fridge.ingredient')}</span>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={listboxId}
              aria-autocomplete="list"
              placeholder={t('pantry.placeholder')}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setSuggestOpen(true)
                setMessage(null)
              }}
              onFocus={() => setSuggestOpen(true)}
              autoComplete="off"
              enterKeyHint="done"
              inputMode="text"
            />
            {draft.length > 0 ? (
              <button
                type="button"
                className="pantry__clear"
                aria-label={t('common.close')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setDraft('')
                  setSuggestOpen(true)
                  inputRef.current?.focus()
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </label>
          <button type="submit" className="pantry__add">
            {t('pantry.add')}
          </button>
        </form>

        <div className="pantry__amount-row" aria-label={t('fridge.quantityOptional')}>
          <label className="pantry__qty">
            <span className="visually-hidden">{t('fridge.quantity')}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('fridge.quantityOptional')}
              value={draftQty}
              onChange={(e) => setDraftQty(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="pantry__unit">
            <span className="visually-hidden">{t('fridge.unit')}</span>
            <select
              value={draftUnit}
              onChange={(e) =>
                setDraftUnit((e.target.value || '') as FridgeUnit | '')
              }
            >
              <option value="">{t('fridge.unit')}</option>
              {FRIDGE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(UNIT_KEYS[unit])}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showSuggestions ? (
          <div className="pantry__suggest" id={listboxId} role="listbox">
            {noMatches ? (
              <p className="pantry__suggest-empty" role="status">
                {t('fridge.noSuggest')}
              </p>
            ) : (
              <ul className="pantry__suggest-list">
                {suggestions.map(({ name, selected }) => (
                  <li key={name} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`pantry__suggest-item${selected ? ' pantry__suggest-item--selected' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onPickSuggestion(name, selected)}
                      disabled={selected}
                    >
                      <span>{name}</span>
                      {selected ? (
                        <span className="pantry__suggest-mark">
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

      {message && <p className="pantry__message">{message}</p>}

      <section className="pantry__block">
        <div className="pantry__block-head">
          <h2 className="pantry__subtitle">{t('fridge.yourItems')}</h2>
          {pantry.length > 0 ? (
            <button
              type="button"
              className="pantry__clear-all"
              onClick={onClearAll}
            >
              {t('fridge.clearAll')}
            </button>
          ) : null}
        </div>
        {pantry.length > 0 ? (
          <p className="pantry__count" aria-live="polite">
            {countLabel}
          </p>
        ) : null}
        {pantry.length === 0 ? (
          <EmptyState
            lead={t('fridge.empty')}
            actionLabel={t('nav.explore')}
            to="/"
          />
        ) : (
          <ul className="pantry__list">
            {pantry.map((item) => {
              const amount = formatItemAmount(item.quantity, item.unit)
              const isEditing = editingId === item.id
              return (
                <li key={item.id} className="pantry__row">
                  <div className="pantry__row-main">
                    <span className="pantry__row-name">{item.name}</span>
                    {!isEditing && amount ? (
                      <span className="pantry__row-amount">{amount}</span>
                    ) : null}
                    {!isEditing && !amount ? (
                      <span className="pantry__row-amount pantry__row-amount--unknown">
                        {locale === 'en' ? 'No amount' : 'Uten mengde'}
                      </span>
                    ) : null}
                  </div>
                  {isEditing ? (
                    <div className="pantry__row-edit">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="pantry__row-qty"
                        placeholder={t('fridge.quantity')}
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        aria-label={t('fridge.quantity')}
                      />
                      <select
                        className="pantry__row-unit"
                        value={editUnit}
                        onChange={(e) =>
                          setEditUnit((e.target.value || '') as FridgeUnit | '')
                        }
                        aria-label={t('fridge.unit')}
                      >
                        <option value="">{t('fridge.unit')}</option>
                        {FRIDGE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {t(UNIT_KEYS[unit])}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="pantry__row-save"
                        onClick={() => saveEdit(item.id)}
                      >
                        {locale === 'en' ? 'Save' : 'Lagre'}
                      </button>
                      <button
                        type="button"
                        className="pantry__row-clear-amt"
                        onClick={() => clearAmount(item.id)}
                      >
                        {t('fridge.clearAmount')}
                      </button>
                    </div>
                  ) : (
                    <div className="pantry__row-actions">
                      <button
                        type="button"
                        className="pantry__row-edit-btn"
                        onClick={() =>
                          startEdit(item.id, item.quantity, item.unit)
                        }
                      >
                        {t('fridge.editAmount')}
                      </button>
                      <button
                        type="button"
                        className="pantry__row-remove"
                        aria-label={`${t('fridge.remove')} ${item.name}`}
                        onClick={() => {
                          removeItem(item.id)
                          trackEvent('fridge_ingredient_removed', {
                            source: 'fridge',
                            properties: {
                              ingredient_key: item.id.slice(0, 40),
                            },
                          })
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
