import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Accessible React Error Boundary to catch UI runtime exceptions,
 * render an accessible fallback alert, and allow graceful recovery.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto my-8 max-w-lg rounded-2xl border border-warn/40 bg-card p-6 shadow-soft"
        >
          <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
          <p className="mt-2 text-sm text-ink-soft">
            An unexpected error occurred while rendering this view.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary text-xs sm:text-sm"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary text-xs sm:text-sm"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
