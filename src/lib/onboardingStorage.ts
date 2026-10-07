const DONE_KEY = 'fgtg-onboarding-done-v1'

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(DONE_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}
