/**
 * Time - Utilidades para formateo de fechas y tiempo en MINOTAURION ⚡
 * 
 * Incluye:
 * - Formateo de tiempo relativo ("hace 5m", "3h ago")
 * - Formateo de fechas
 * - Parseo de timestamps
 * - Helpers para intervalos
 */

/**
 * Formatea una fecha como tiempo relativo (ej: "hace 5m", "2h ago")
 * @param date - Fecha a formatear (Date, timestamp, o string ISO)
 * @param locale - Idioma ('es' o 'en')
 */
export function formatTimeAgo(
  date: Date | string | number,
  locale: 'es' | 'en' = 'en'
): string {
  const now = new Date();
  const then = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(then.getTime())) {
    return locale === 'es' ? 'Fecha inválida' : 'Invalid date';
  }

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 0) {
    return locale === 'es' ? 'En el futuro' : 'In the future';
  }

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  const labels = {
    es: {
      year: ['año', 'años'],
      month: ['mes', 'meses'],
      week: ['semana', 'semanas'],
      day: ['día', 'días'],
      hour: ['hora', 'horas'],
      minute: ['minuto', 'minutos'],
      second: ['segundo', 'segundos'],
    },
    en: {
      year: ['y', 'y'],
      month: ['mo', 'mo'],
      week: ['w', 'w'],
      day: ['d', 'd'],
      hour: ['h', 'h'],
      minute: ['m', 'm'],
      second: ['s', 's'],
    },
  };

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      const label = labels[locale][key as keyof typeof intervals];
      const unit = interval === 1 ? label[0] : label[1];
      
      if (locale === 'es') {
        return `hace ${interval}${unit}`;
      } else {
        return `${interval}${unit} ago`;
      }
    }
  }

  return locale === 'es' ? 'ahora' : 'now';
}

/**
 * Formatea una fecha completa (ej: "26 Oct 2025, 15:30")
 * @param date - Fecha a formatear
 * @param includeTime - Incluir hora
 */
export function formatDate(
  date: Date | string | number,
  includeTime: boolean = false
): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', options);
}

/**
 * Formatea solo la hora (ej: "15:30:45")
 */
export function formatTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(d.getTime())) {
    return 'Invalid time';
  }

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Convierte segundos a formato legible (ej: "2h 30m 45s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Obtiene el timestamp Unix actual (en segundos)
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Obtiene el timestamp Unix actual (en milisegundos)
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Convierte un timestamp Unix (segundos) a Date
 */
export function fromUnix(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Convierte una Date a timestamp Unix (segundos)
 */
export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date | string | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Verifica si una fecha es ayer
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
}

/**
 * Obtiene el inicio del día para una fecha
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Obtiene el fin del día para una fecha
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Añade días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Añade horas a una fecha
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Sleep/delay async
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

