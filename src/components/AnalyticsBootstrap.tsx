import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  trackEvent,
  trackRouteView,
  trackSessionStart,
} from '../lib/analytics'

/**
 * Starts analytics session once, tracks route transitions + coarse shell views.
 * Never blocks render.
 */
export function AnalyticsBootstrap() {
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    trackSessionStart(user?.id ?? null)
  }, [user?.id])

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/admin')) return

    trackRouteView(path)

    if (path === '/') {
      trackEvent('explore_view', { source: 'nav', path })
      return
    }
    if (path === '/kjoleskap' || path === '/hjemme') {
      // fridge_opened is fired from PantryPage; keep legacy pantry_view for Innsikt.
      trackEvent('pantry_view', { source: 'nav', path })
      return
    }
    if (path === '/handleliste') {
      trackEvent('shopping_view', { source: 'nav', path })
      return
    }
    if (path === '/favoritter' || path.startsWith('/favoritter/')) {
      trackEvent('favorites_view', { source: 'nav', path })
      return
    }
    if (path === '/tips') {
      trackEvent('tips_landing_view', { source: 'nav', path })
    }
  }, [location.pathname])

  return null
}
