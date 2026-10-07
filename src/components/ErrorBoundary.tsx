import { Component, type ErrorInfo, type ReactNode } from 'react'
import { USER_ERRORS, logTechError } from '../lib/userErrors'
import './ErrorBoundary.css'

type Props = { children: ReactNode }
type State = { crashed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logTechError('ErrorBoundary', `${error.message}\n${info.componentStack ?? ''}`)
  }

  render() {
    if (!this.state.crashed) return this.props.children

    return (
      <div className="error-fallback" role="alert">
        <h1 className="error-fallback__title">{USER_ERRORS.crashTitle}</h1>
        <p className="error-fallback__hint">{USER_ERRORS.crashHint}</p>
        <button
          type="button"
          className="error-fallback__reload"
          onClick={() => window.location.reload()}
        >
          {USER_ERRORS.reload}
        </button>
      </div>
    )
  }
}
