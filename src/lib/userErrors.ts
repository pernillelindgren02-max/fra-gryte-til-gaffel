/** Calm Norwegian copy for users — never expose raw tech here. */

export const USER_ERRORS = {
  load: 'Kunne ikke laste inn akkurat nå.',
  save: 'Kunne ikke lagre endringen. Prøv igjen.',
  network:
    'Det ser ut som forbindelsen er borte. Sjekk nettet og prøv igjen.',
  crashTitle: 'Noe gikk galt',
  crashHint: 'Prøv å laste siden på nytt.',
  retry: 'Prøv igjen',
  reload: 'Last siden på nytt',
  login: 'Du må være innlogget.',
  recipeMissing: 'Fant ikke oppskriften.',
  cloudFallback:
    'Kunne ikke hente oppskrifter fra skyen — viser lokal kopi.',
} as const

export function extractTechMessage(err: unknown): string {
  if (err == null) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || err.name
  if (typeof err === 'object') {
    const record = err as Record<string, unknown>
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message
    }
    if (typeof record.error_description === 'string') {
      return record.error_description
    }
    if (typeof record.error === 'string') return record.error
    try {
      return JSON.stringify(err)
    } catch {
      return Object.prototype.toString.call(err)
    }
  }
  return String(err)
}

export function logTechError(scope: string, err: unknown): void {
  const detail = extractTechMessage(err)
  console.warn(`[${scope}]`, detail || err)
}

export function isNetworkError(err?: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }
  if (err == null) return false
  const text = extractTechMessage(err).toLowerCase()
  return (
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network request failed') ||
    text.includes('load failed') ||
    text.includes('offline') ||
    text.includes('err_internet') ||
    text.includes('err_network')
  )
}

/** User-facing load failure (content). Logs tech details. */
export function toUserLoadError(err?: unknown, scope = 'load'): string {
  if (err != null) logTechError(scope, err)
  if (isNetworkError(err)) return USER_ERRORS.network
  return USER_ERRORS.load
}

/** User-facing save/update failure. Logs tech details. */
export function toUserSaveError(err?: unknown, scope = 'save'): string {
  if (err != null) logTechError(scope, err)
  if (isNetworkError(err)) return USER_ERRORS.network
  const text = extractTechMessage(err).toLowerCase()
  if (
    text.includes('jwt') ||
    text.includes('not authenticated') ||
    text.includes('innlogget')
  ) {
    return USER_ERRORS.login
  }
  return USER_ERRORS.save
}

/**
 * Map known DB / auth hints to calm Norwegian; never return raw SQL / [object Object].
 * Prefer toUserLoadError / toUserSaveError for new code.
 */
export function translateDbError(message: string): string {
  const lower = (message || '').toLowerCase()
  if (!lower.trim()) return USER_ERRORS.load
  if (isNetworkError(message)) return USER_ERRORS.network
  if (
    lower.includes('could not find the table') ||
    lower.includes('schema cache') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  ) {
    return USER_ERRORS.load
  }
  if (lower.includes('permission denied') || lower.includes('rls')) {
    return USER_ERRORS.login
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return USER_ERRORS.login
  }
  // Never surface raw PostgREST / stack text
  if (
    lower.includes('postgres') ||
    lower.includes('pgrst') ||
    lower.includes('42p01') ||
    lower.includes('json') ||
    lower.includes('undefined') ||
    lower.includes('[object')
  ) {
    return USER_ERRORS.save
  }
  // Short, already-Norwegian app messages (e.g. validation) pass through
  if (message.length < 120 && !/[A-Z_]{4,}/.test(message) && !message.includes('{')) {
    return message
  }
  return USER_ERRORS.save
}

/** Safe string for any UI slot — never undefined/null/[object Object]. */
export function safeDisplayText(
  value: unknown,
  fallback = '',
): string {
  if (value == null) return fallback
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback
    if (trimmed === '[object Object]') return fallback
    return trimmed
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}
