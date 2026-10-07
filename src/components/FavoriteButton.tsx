import { useNavigate } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useUserData } from '../context/UserDataContext'
import { recipePath } from '../lib/recipeLinks'
import { USER_ERRORS } from '../lib/userErrors'
import './FavoriteButton.css'

interface FavoriteButtonProps {
  recipeId: string
  compact?: boolean
}

export function FavoriteButton({ recipeId, compact = false }: FavoriteButtonProps) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useUserData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const liked = isFavorite(recipeId)

  async function onClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (!user) {
      navigate('/konto', { state: { from: recipePath(recipeId) } })
      return
    }
    const wasLiked = liked
    const result = await toggleFavorite(recipeId)
    if (result === 'login') {
      navigate('/konto', { state: { from: recipePath(recipeId) } })
      return
    }
    if (result === 'error') {
      showToast(USER_ERRORS.save)
      return
    }
    showToast(
      wasLiked ? 'Fjernet fra favoritter.' : 'Lagret i favoritter.',
    )
  }

  return (
    <button
      type="button"
      className={`favorite-btn${liked ? ' favorite-btn--on' : ''}${compact ? ' favorite-btn--compact' : ''}`}
      aria-pressed={liked}
      aria-label={liked ? 'Fjern fra favoritter' : 'Lagre som favoritt'}
      onClick={onClick}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
