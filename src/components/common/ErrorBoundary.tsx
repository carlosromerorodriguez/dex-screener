/**
 * ErrorBoundary - Componente para capturar errores globales en MINOTAURION ⚡
 * 
 * Características:
 * - Captura errores de React
 * - UI de fallback personalizada
 * - Logging automático
 * - Reset manual del error
 */

import React, { Component, ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log el error
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Callback personalizado
    this.props.onError?.(error, errorInfo);

    // Guardar error info en el estado
    this.setState({
      errorInfo,
    });

    // TODO: Enviar a Sentry/Datadog en producción
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback custom, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="min-h-screen bg-dex-bg-primary flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-dex-bg-secondary rounded-lg p-8 border border-dex-border">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-4xl">⚡</span>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  MINOTAURION Error
                </h1>
                <p className="text-dex-text-secondary text-sm">
                  Something went wrong
                </p>
              </div>
            </div>

            {/* Error message */}
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <h2 className="text-red-400 font-semibold mb-2 flex items-center">
                <span className="mr-2">❌</span>
                Error Details
              </h2>
              <p className="text-red-300 text-sm font-mono">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            {/* Stack trace (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mb-6">
                <summary className="cursor-pointer text-dex-text-secondary hover:text-white mb-2">
                  🔍 Technical Details (Development)
                </summary>
                <pre className="bg-dex-bg-primary rounded p-4 text-xs text-dex-text-secondary overflow-x-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-dex-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-dex-bg-tertiary hover:bg-dex-bg-highlight text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🏠 Go Home
              </button>
            </div>

            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-dex-border">
              <p className="text-dex-text-secondary text-sm">
                If this problem persists, please contact support or check the{' '}
                <a
                  href="https://github.com/minotaurion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dex-blue hover:underline"
                >
                  GitHub repository
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Ejemplo de uso:
 * 
 * // En App.tsx o index.tsx
 * import ErrorBoundary from './components/common/ErrorBoundary';
 * 
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <YourApp />
 *     </ErrorBoundary>
 *   );
 * }
 * 
 * // Con fallback custom
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * // Con callback de error
 * <ErrorBoundary onError={(error, info) => {
 *   console.log('Error captured:', error);
 * }}>
 *   <YourApp />
 * </ErrorBoundary>
 */

