import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys![index])
    ) {
      this.handleRetry();
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-50 text-red-800 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold">
              Something went wrong
            </h2>
          </div>

          <div className="w-full max-w-lg space-y-4 text-center">
            <p className="text-sm text-red-700">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-2 text-left">
                <summary className="text-sm font-medium cursor-pointer hover:text-red-600">
                  View Error Details
                </summary>
                <pre className="mt-2 p-4 bg-red-100 rounded text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                aria-label="Retry loading the component"
              >
                <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                aria-label="Reload the page"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Preserve the display name for debugging
  WithErrorBoundary.displayName = `WithErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WithErrorBoundary;
}