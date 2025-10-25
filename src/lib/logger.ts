/**
 * Logger - Sistema de logging centralizado para MINOTAURION ⚡
 * 
 * Características:
 * - Niveles configurables (debug, info, warn, error)
 * - Formato consistente con timestamps
 * - Deshabilitado en producción (excepto errors)
 * - Integración con Sentry/Datadog futuro
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
}

class Logger {
  private config: LogConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config?: Partial<LogConfig>) {
    this.config = {
      level: (process.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      enableInProduction: false,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && !this.config.enableInProduction && level !== 'error') {
      return false;
    }
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    let formatted = `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}`;
    
    if (data !== undefined) {
      formatted += '\n' + JSON.stringify(data, null, 2);
    }

    return formatted;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('error', message, errorData));
      
      // TODO: Enviar a Sentry/Datadog en producción
      // if (process.env.NODE_ENV === 'production') {
      //   Sentry.captureException(error);
      // }
    }
  }

  // Helper para logging de API calls
  apiCall(method: string, url: string, status?: number, duration?: number): void {
    const message = `API ${method.toUpperCase()} ${url}`;
    const data = { status, duration: duration ? `${duration}ms` : undefined };
    
    if (status && status >= 400) {
      this.error(message, data);
    } else {
      this.debug(message, data);
    }
  }
}

// Singleton export
export const logger = new Logger();

// Export class for custom instances
export default Logger;

