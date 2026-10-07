const LAST_ADMIN_KEY = 'fgtg:lastAdminPath'
const LAST_APP_KEY = 'fgtg:lastAppPath'

function isAdminPath(path: string) {
  return path.startsWith('/admin')
}

export function rememberAdminPath(path: string) {
  if (!isAdminPath(path)) return
  try {
    sessionStorage.setItem(LAST_ADMIN_KEY, path)
    localStorage.setItem(LAST_ADMIN_KEY, path)
  } catch {
    /* ignore */
  }
}

export function getLastAdminPath(): string {
  try {
    return (
      sessionStorage.getItem(LAST_ADMIN_KEY) ||
      localStorage.getItem(LAST_ADMIN_KEY) ||
      '/admin'
    )
  } catch {
    return '/admin'
  }
}

export function rememberAppPath(path: string) {
  if (isAdminPath(path) || path.startsWith('/konto')) return
  // Don't overwrite return context while viewing a recipe detail.
  if (path.startsWith('/oppskrift/')) return
  try {
    sessionStorage.setItem(LAST_APP_KEY, path)
  } catch {
    /* ignore */
  }
}

export function getLastAppPath(): string {
  try {
    return sessionStorage.getItem(LAST_APP_KEY) || '/'
  } catch {
    return '/'
  }
}
