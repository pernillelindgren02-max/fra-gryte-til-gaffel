import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useShoppingList } from '../context/ShoppingListContext'
import { useToast } from '../context/ToastContext'
import type { Recipe } from '../data/recipes'
import { trackEvent } from '../lib/analytics'
import {
  getRememberedPortions,
  rememberPortions,
} from '../lib/recipePortions'
import { portionMultiplier } from '../utils/scalePortions'
import './ShoppingBagButton.css'

type ShoppingBagButtonProps = {
  recipe: Recipe
  /** Analytics source, e.g. explore / search / category */
  source?: string
  className?: string
}

function BagIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="shopping-bag-btn__icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.5 9.5h11l-.9 9.2a1.8 1.8 0 0 1-1.8 1.6H9.2a1.8 1.8 0 0 1-1.8-1.6L6.5 9.5Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.5V7.8a3 3 0 0 1 6 0v1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Compact terracotta bag for Explore cards — add without opening recipe.
 * Active/filled state stays tappable and opens the shopping list.
 */
export function ShoppingBagButton({
  recipe,
  source = 'explore',
  className = '',
}: ShoppingBagButtonProps) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { addRecipe, hasRecipe } = useShoppingList()
  const { showToast } = useToast()
  const onList = hasRecipe(recipe.id)
  const base = recipe.servings > 0 ? recipe.servings : 2

  function onClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (onList) {
      trackEvent('explore_shopping_open_existing', {
        recipeId: recipe.id,
        source,
      })
      navigate('/handleliste')
      return
    }
    const portions = getRememberedPortions(recipe.id, base)
    rememberPortions(recipe.id, portions)
    const scale = portionMultiplier(portions, base)
    const result = addRecipe(recipe.id, scale)
    if (result === 'added') {
      trackEvent('explore_shopping_add', {
        recipeId: recipe.id,
        source,
        properties: { portions },
      })
      showToast(t('shopping.addedToast'))
    } else if (result === 'duplicate') {
      trackEvent('explore_shopping_open_existing', {
        recipeId: recipe.id,
        source,
      })
      navigate('/handleliste')
    }
  }

  return (
    <button
      type="button"
      className={`shopping-bag-btn${onList ? ' shopping-bag-btn--on' : ''}${className ? ` ${className}` : ''}`}
      aria-label={
        onList ? t('shopping.bagOpenExisting') : t('shopping.bagAdd')
      }
      aria-pressed={onList}
      onClick={onClick}
    >
      <BagIcon filled={onList} />
    </button>
  )
}
