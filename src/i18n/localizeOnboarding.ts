import type { OnboardingStep } from '../lib/onboardingDefaults'
import { pickEditorial } from './fallback'
import type { AppLocale } from './types'

export function localizeOnboardingStep(
  step: OnboardingStep,
  locale: AppLocale,
): OnboardingStep {
  return {
    ...step,
    title: pickEditorial(
      step.titleNo || step.title,
      step.titleEn,
      step.titleEnAuto,
      step.titleEnOverride,
      locale,
    ),
    body: pickEditorial(
      step.bodyNo || step.body,
      step.bodyEn,
      step.bodyEnAuto,
      step.bodyEnOverride,
      locale,
    ),
  }
}

export function localizeOnboardingSteps(
  steps: OnboardingStep[],
  locale: AppLocale,
): OnboardingStep[] {
  return steps.map((s) => localizeOnboardingStep(s, locale))
}
