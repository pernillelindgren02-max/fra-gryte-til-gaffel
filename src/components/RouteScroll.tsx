import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { freezeExploreScroll } from '../lib/exploreSession'

function isDetailPath(pathname: string): boolean {
  return (
    pathname.startsWith('/oppskrift/') ||
    pathname.startsWith('/recipe/') ||
    /^\/tips\/[^/]+$/.test(pathname)
  )
}

/**
 * Recipe detail always opens at the top.
 * On browser/history back (POP), restore the previous screen's scroll.
 * Does not force-scroll other forward navigations.
 */
export function RouteScroll() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef<Record<string, number>>({})
  const prevRef = useRef({
    key: location.key,
    pathname: location.pathname,
  })

  // Track scroll while on a screen — avoid relying on cleanup after recipe
  // already jumped to top (that race was overwriting Explore's session).
  useEffect(() => {
    const key = location.key
    function onScroll() {
      positions.current[key] = window.scrollY
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.key])

  useLayoutEffect(() => {
    const prev = prevRef.current
    const prevY = positions.current[prev.key]

    if (isDetailPath(location.pathname)) {
      // Preserve Explore scroll before we force the window to top.
      if (prev.pathname === '/' && typeof prevY === 'number' && prevY > 0) {
        freezeExploreScroll(prevY)
      }
      window.scrollTo(0, 0)
      prevRef.current = { key: location.key, pathname: location.pathname }
      return
    }

    if (navigationType === 'POP') {
      const y = positions.current[location.key]
      if (typeof y === 'number') {
        window.scrollTo(0, y)
      }
    }

    prevRef.current = { key: location.key, pathname: location.pathname }
  }, [location.key, location.pathname, navigationType])

  return null
}
