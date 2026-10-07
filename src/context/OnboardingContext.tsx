import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchActiveOnboardingSteps,
} from '../lib/onboardingApi'
import {
  DEFAULT_ONBOARDING_STEPS,
  type OnboardingStep,
} from '../lib/onboardingDefaults'
import {
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from '../lib/onboardingStorage'

export type OnboardingMode = 'first' | 'replay' | 'preview' | null

type OnboardingContextValue = {
  steps: OnboardingStep[]
  loading: boolean
  mode: OnboardingMode
  open: boolean
  openFirst: () => void
  openReplay: () => void
  openPreview: () => void
  closeFlow: (completed: boolean) => void
  refreshSteps: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_ONBOARDING_STEPS)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<OnboardingMode>(null)

  const refreshSteps = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchActiveOnboardingSteps()
      setSteps(next.length > 0 ? next : DEFAULT_ONBOARDING_STEPS)
    } catch {
      setSteps(DEFAULT_ONBOARDING_STEPS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSteps()
  }, [refreshSteps])

  const openFirst = useCallback(() => {
    if (hasCompletedOnboarding()) return
    setMode((prev) => (prev === null ? 'first' : prev))
  }, [])

  const openReplay = useCallback(() => {
    setMode('replay')
  }, [])

  const openPreview = useCallback(() => {
    setMode('preview')
  }, [])

  const closeFlow = useCallback((completed: boolean) => {
    setMode((prev) => {
      // Only first-time completion writes localStorage.
      if (prev === 'first' && completed) {
        markOnboardingCompleted()
      }
      return null
    })
  }, [])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      steps,
      loading,
      mode,
      open: mode !== null && steps.length > 0,
      openFirst,
      openReplay,
      openPreview,
      closeFlow,
      refreshSteps,
    }),
    [
      steps,
      loading,
      mode,
      openFirst,
      openReplay,
      openPreview,
      closeFlow,
      refreshSteps,
    ],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return ctx
}
