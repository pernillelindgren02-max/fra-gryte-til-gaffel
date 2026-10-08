export type AppLocale = 'no' | 'en'

export const APP_LOCALES: AppLocale[] = ['no', 'en']

export const DEFAULT_LOCALE: AppLocale = 'no'

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'no' || value === 'en'
}
