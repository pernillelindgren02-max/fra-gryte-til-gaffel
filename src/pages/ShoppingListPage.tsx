import { useMemo, useState } from 'react'
import { BackToExplore } from '../components/BackToExplore'
import { ClearableSearchInput } from '../components/ClearableSearchInput'
import { EmptyState } from '../components/EmptyState'
import { RecipeLink } from '../components/RecipeLink'
import { useLocale } from '../context/LocaleContext'
import { usePantry } from '../context/PantryContext'
import { useRecipes } from '../context/RecipesContext'
import {
  resolveShoppingItemCheck,
  useShoppingList,
} from '../context/ShoppingListContext'
import { useSiteContent } from '../context/SiteContentContext'
import { useToast } from '../context/ToastContext'
import { trackEvent } from '../lib/analytics'
import {
  getRememberedPortions,
  rememberPortions,
} from '../lib/recipePortions'
import {
  coverageForCombined,
  shoppingCoverageHelper,
} from '../utils/fridgeCoverage'
import {
  MAX_PORTIONS,
  MIN_PORTIONS,
  clampPortions,
  portionMultiplier,
} from '../utils/scalePortions'
import { searchRecipes } from '../utils/searchRecipes'
import './ShoppingListPage.css'

export function ShoppingListPage() {
  const {
    entries,
    combined,
    manualCheckedKeys,
    manualUncheckedKeys,
    addRecipe,
    removeRecipe,
    setPortions,
    getPortions,
    clearAll,
    toggleChecked,
  } = useShoppingList()
  const { pantry } = usePantry()
  const { recipes, getById } = useRecipes()
  const { getCopy } = useSiteContent()
  const { showToast } = useToast()
  const { t, locale } = useLocale()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchRecipes(recipes, query).slice(0, 8)
  }, [query, recipes])

  const listed = entries
    .map((entry) => {
      const recipe = getById(entry.recipeId)
      if (!recipe) return null
      const base = recipe.servings > 0 ? recipe.servings : 2
      return {
        recipe,
        portions: getPortions(recipe.id, base),
        base,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  function onPick(recipeId: string) {
    const recipe = getById(recipeId)
    if (!recipe) return
    const base = recipe.servings > 0 ? recipe.servings : 2
    const portions = getRememberedPortions(recipeId, base)
    const result = addRecipe(recipeId, portionMultiplier(portions, base))
    if (result === 'added') {
      rememberPortions(recipeId, portions)
      trackEvent('recipe_shopping_add', {
        recipeId,
        source: 'shopping',
        properties: { portions },
      })
      showToast(t('shopping.addedToast'))
      setQuery('')
    } else if (result === 'duplicate') {
      showToast(
        locale === 'en'
          ? 'Recipe is already on the shopping list.'
          : 'Oppskriften er allerede i handlelisten.',
      )
    }
  }

  function onRemoveRecipe(recipeId: string, name: string) {
    removeRecipe(recipeId)
    trackEvent('shopping_recipe_remove', {
      recipeId,
      source: 'shopping',
    })
    showToast(
      locale === 'en'
        ? `Removed “${name}” from the list.`
        : `Fjernet «${name}» fra handlelisten.`,
    )
  }

  function onClearAll() {
    if (entries.length === 0) return
    if (
      !window.confirm(
        locale === 'en'
          ? 'Clear the whole shopping list?'
          : 'Tøm hele handlelisten?',
      )
    ) {
      return
    }
    clearAll()
    showToast(
      locale === 'en' ? 'Shopping list cleared.' : 'Handlelisten er tømt.',
    )
  }

  function onChangePortions(
    recipeId: string,
    base: number,
    next: number,
  ) {
    const portions = clampPortions(next)
    setPortions(recipeId, portions, base)
    trackEvent('shopping_recipe_portions_changed', {
      recipeId,
      source: 'shopping',
      properties: { portions },
    })
  }

  const servingsWord = (n: number) =>
    locale === 'en'
      ? n === 1
        ? 'serving'
        : 'servings'
      : n === 1
        ? 'porsjon'
        : 'porsjoner'

  return (
    <div className="shopping">
      <BackToExplore />
      <header className="shopping__header">
        <h1 className="shopping__title">{t('shopping.title')}</h1>
        <p className="shopping__lead">
          {locale === 'en'
            ? 'Add recipes and tick off what you need.'
            : 'Legg til oppskrifter og kryss av det du trenger.'}
        </p>
      </header>

      <div className="shopping__search-wrap">
        <ClearableSearchInput
          className="shopping__search"
          label={locale === 'en' ? 'Search for a recipe' : 'Søk etter oppskrift'}
          placeholder={
            locale === 'en' ? 'Search for a recipe' : 'Søk etter oppskrift'
          }
          value={query}
          onChange={setQuery}
        />
      </div>

      {results.length > 0 && (
        <ul className="shopping__suggest" role="listbox">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <button type="button" onClick={() => onPick(recipe.id)}>
                {recipe.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {listed.length > 0 && (
        <section className="shopping__block shopping__block--recipes">
          <h2 className="shopping__subtitle">
            {locale === 'en' ? 'Recipes' : 'Oppskrifter'}
          </h2>
          <ul className="shopping__recipes">
            {listed.map(({ recipe, portions, base }) => (
              <li key={recipe.id} className="shopping__recipe-row">
                <div className="shopping__recipe-main">
                  <RecipeLink
                    recipeId={recipe.id}
                    className="shopping__recipe-name"
                  >
                    {recipe.name}
                  </RecipeLink>
                  <div
                    className="shopping__portions"
                    role="group"
                    aria-label={`${t('recipe.portions')}: ${recipe.name}`}
                  >
                    <button
                      type="button"
                      className="shopping__portion-btn"
                      aria-label={t('shopping.fewerPortions')}
                      disabled={portions <= MIN_PORTIONS}
                      onClick={() =>
                        onChangePortions(recipe.id, base, portions - 1)
                      }
                    >
                      −
                    </button>
                    <span className="shopping__portion-value">
                      {portions}{' '}
                      <span className="shopping__portion-unit">
                        {servingsWord(portions)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="shopping__portion-btn"
                      aria-label={t('shopping.morePortions')}
                      disabled={portions >= MAX_PORTIONS}
                      onClick={() =>
                        onChangePortions(recipe.id, base, portions + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="shopping__remove-btn"
                  onClick={() => onRemoveRecipe(recipe.id, recipe.name)}
                >
                  {locale === 'en' ? 'Remove' : 'Fjern'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shopping__block shopping__block--list">
        <div className="shopping__block-head">
          <h2 className="shopping__subtitle shopping__subtitle--focus">
            {locale === 'en' ? 'Shopping list' : 'Handleliste'}
          </h2>
          {listed.length > 0 ? (
            <button
              type="button"
              className="shopping__clear-btn"
              onClick={onClearAll}
            >
              {t('shopping.clear')}
            </button>
          ) : null}
        </div>
        {combined.length === 0 ? (
          <EmptyState
            lead={getCopy('handleliste.empty', t('shopping.empty'))}
            actionLabel={
              locale === 'en' ? 'Find a recipe' : 'Finn en oppskrift'
            }
            to="/"
          />
        ) : (
          <ul className="shopping__items">
            {combined.map((item) => {
              const coverage = coverageForCombined(pantry, item)
              const check = resolveShoppingItemCheck({
                key: item.key,
                coverageKind: coverage.kind,
                manualChecked: manualCheckedKeys.has(item.key),
                manualUnchecked: manualUncheckedKeys.has(item.key),
              })
              const helper = shoppingCoverageHelper({
                coverage,
                checked: check.checked,
                manuallyChecked: check.manuallyChecked,
                autoCovered: check.autoCovered,
              })
              let helperText: string | null = null
              if (helper.kind === 'unknown') {
                helperText = t('shopping.helperUnknown')
              } else if (helper.kind === 'partial') {
                const plural = item.fromRecipes.length > 1
                helperText = t(
                  plural
                    ? 'shopping.helperPartialPlural'
                    : 'shopping.helperPartial',
                  {
                    have: coverage.haveLabel ?? '—',
                    need: coverage.needLabel ?? '—',
                  },
                )
              } else if (helper.kind === 'enough') {
                helperText = t('shopping.helperEnough')
              }

              return (
                <li key={item.key}>
                  <div
                    className={`shopping__item${check.checked ? ' shopping__item--checked' : ''}${check.autoCovered ? ' shopping__item--auto' : ''}`}
                  >
                    <label className="shopping__item-check">
                      <input
                        type="checkbox"
                        checked={check.checked}
                        onChange={() =>
                          toggleChecked(item.key, check.checked)
                        }
                      />
                      <span className="shopping__item-body">
                        <span className="shopping__item-label">
                          {item.label}
                        </span>
                        {helperText ? (
                          <span
                            className={`shopping__item-helper shopping__item-helper--${helper.tone}`}
                          >
                            {helperText}
                          </span>
                        ) : null}
                        {item.fromRecipes.length > 0 ? (
                          <span className="shopping__item-from">
                            {t('shopping.from')}{' '}
                            {item.fromRecipes.map((source, index) => (
                              <span key={source.id}>
                                {index > 0 && ', '}
                                <RecipeLink
                                  recipeId={source.id}
                                  className="shopping__item-recipe"
                                >
                                  {source.name}
                                </RecipeLink>
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
