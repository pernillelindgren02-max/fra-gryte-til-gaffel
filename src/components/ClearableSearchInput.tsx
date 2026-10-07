import {
  useId,
  type FormEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react'
import './ClearableSearchInput.css'

type ClearableSearchInputProps = {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  label: string
  className?: string
  inputClassName?: string
  /** When true, wraps in a form so mobile Search/Enter submits and blurs. */
  asForm?: boolean
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'className'
>

export function ClearableSearchInput({
  value,
  onChange,
  onClear,
  label,
  className = '',
  inputClassName = '',
  asForm = true,
  placeholder,
  enterKeyHint = 'search',
  autoComplete = 'off',
  ...rest
}: ClearableSearchInputProps) {
  const id = useId()
  const hasText = value.length > 0

  function clear() {
    onChange('')
    onClear?.()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const target = event.currentTarget.querySelector('input')
    target?.blur()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    rest.onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === 'Escape' && hasText) {
      event.preventDefault()
      clear()
    }
  }

  const field = (
    <div className={`clearable-search${className ? ` ${className}` : ''}`}>
      <label className="clearable-search__label" htmlFor={id}>
        <span className="visually-hidden">{label}</span>
        <input
          {...rest}
          id={id}
          type="search"
          className={`clearable-search__input${inputClassName ? ` ${inputClassName}` : ''}${hasText ? ' clearable-search__input--has-clear' : ''}`}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          enterKeyHint={enterKeyHint}
          inputMode="search"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </label>
      {hasText ? (
        <button
          type="button"
          className="clearable-search__clear"
          aria-label="Tøm søk"
          onMouseDown={(event) => {
            // Keep focus handling predictable on mobile: clear before blur.
            event.preventDefault()
          }}
          onClick={clear}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  )

  if (!asForm) return field

  return (
    <form className="clearable-search__form" onSubmit={onSubmit} role="search">
      {field}
    </form>
  )
}
