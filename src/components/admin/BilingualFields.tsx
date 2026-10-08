import type { ReactNode } from 'react'

export type ContentLangTab = 'no' | 'en'

export function EnSourceBadge({ isOverride }: { isOverride: boolean }) {
  return (
    <span
      className={
        isOverride
          ? 'admin-en-badge admin-en-badge--override'
          : 'admin-en-badge admin-en-badge--auto'
      }
    >
      {isOverride ? 'Manual override' : 'Automatic / default'}
    </span>
  )
}

export function LangTabs({
  value,
  onChange,
  label = 'Language',
}: {
  value: ContentLangTab
  onChange: (next: ContentLangTab) => void
  label?: string
}) {
  return (
    <div className="admin-filter-tabs" role="tablist" aria-label={label}>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'no'}
        className={
          value === 'no'
            ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
            : 'admin-filter-tabs__btn'
        }
        onClick={() => onChange('no')}
      >
        Norsk
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'en'}
        className={
          value === 'en'
            ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
            : 'admin-filter-tabs__btn'
        }
        onClick={() => onChange('en')}
      >
        English
      </button>
    </div>
  )
}

export function BilingualTextInput({
  lang,
  labelNo,
  labelEn,
  valueNo,
  valueEn,
  autoEn,
  isOverride,
  multiline,
  rows = 3,
  required,
  onChangeNo,
  onChangeEn,
  onClearOverride,
}: {
  lang: ContentLangTab
  labelNo: string
  labelEn: string
  valueNo: string
  valueEn: string
  autoEn: string
  isOverride: boolean
  multiline?: boolean
  rows?: number
  required?: boolean
  onChangeNo: (value: string) => void
  onChangeEn: (value: string) => void
  onClearOverride: () => void
}) {
  if (lang === 'no') {
    return (
      <label className="admin-form__field">
        <span>{labelNo}</span>
        {multiline ? (
          <textarea
            rows={rows}
            value={valueNo}
            required={required}
            onChange={(e) => onChangeNo(e.target.value)}
          />
        ) : (
          <input
            value={valueNo}
            required={required}
            onChange={(e) => onChangeNo(e.target.value)}
          />
        )}
      </label>
    )
  }

  const display = isOverride ? valueEn : autoEn
  return (
    <label className="admin-form__field">
      <span className="admin-form__label-row">
        {labelEn}
        <EnSourceBadge isOverride={isOverride} />
      </span>
      {multiline ? (
        <textarea
          rows={rows}
          value={display}
          placeholder={autoEn || 'Automatic English when available'}
          onChange={(e) => onChangeEn(e.target.value)}
        />
      ) : (
        <input
          value={display}
          placeholder={autoEn || 'Automatic English when available'}
          onChange={(e) => onChangeEn(e.target.value)}
        />
      )}
      {isOverride ? (
        <button
          type="button"
          className="admin__btn admin__btn--ghost admin-form__clear-en"
          onClick={onClearOverride}
        >
          Clear override — restore automatic
        </button>
      ) : null}
    </label>
  )
}

export function BilingualHint({ children }: { children: ReactNode }) {
  return <p className="admin__muted">{children}</p>
}
