import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { rememberAdminPath, rememberAppPath } from '../lib/adminPath'

/** Remembers last admin / consumer paths for Tilbake-lenker. */
export function PathMemory() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname + location.search
    if (path.startsWith('/admin')) {
      rememberAdminPath(path)
    } else {
      rememberAppPath(path)
    }
  }, [location.pathname, location.search])

  return null
}
