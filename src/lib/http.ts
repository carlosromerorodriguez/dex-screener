/**
 * HTTP Client - Wrapper sobre ky para MINOTAURION ⚡
 * 
 * Características:
 * - Retry automático con backoff exponencial
 * - Rate limiting
 * - Logging de requests
 * - Timeout configurables
 * - Interceptores de error
 */

import ky, { type KyInstance, type Options } from 'ky';
import { logger } from './logger';

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryLimit?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  enableLogging?: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  perMs: number;
}

class HttpClient {
  private client: KyInstance;
  private config: Required<HttpClientConfig>;
  private requestQueue: number[] = [];
  private rateLimit?: RateLimitConfig;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 30000, // 30 segundos
      retryLimit: config.retryLimit || 3,
      retryDelay: config.retryDelay || 1000,
      headers: config.headers || {},
      enableLogging: config.enableLogging ?? true,
    };

    this.client = ky.create({
      prefixUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      retry: {
        limit: this.config.retryLimit,
        methods: ['get', 'post', 'put', 'delete'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 10000, // Max 10 segundos
      },
      hooks: {
        beforeRequest: [
          (request) => {
            this.checkRateLimit();
            if (this.config.enableLogging) {
              logger.debug(`HTTP ${request.method} ${request.url}`);
            }
          },
        ],
        afterResponse: [
          (request, _options, response) => {
            if (this.config.enableLogging) {
              const duration = performance.now();
              logger.apiCall(
                request.method,
                request.url,
                response.status,
                duration
              );
            }
          },
        ],
        beforeRetry: [
          ({ request, options, error, retryCount }) => {
            logger.warn(
              `Reintento ${retryCount}/${this.config.retryLimit} para ${request.method} ${request.url}`,
              { error: error.message }
            );
          },
        ],
      },
    });
  }

  /**
   * Configura rate limiting
   */
  setRateLimit(config: RateLimitConfig): void {
    this.rateLimit = config;
  }

  /**
   * Verifica y aplica rate limiting
   */
  private checkRateLimit(): void {
    if (!this.rateLimit) return;

    const now = Date.now();
    const cutoff = now - this.rateLimit.perMs;

    // Limpiar requests antiguos
    this.requestQueue = this.requestQueue.filter((time) => time > cutoff);

    // Verificar si excedemos el límite
    if (this.requestQueue.length >= this.rateLimit.maxRequests) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = oldestRequest + this.rateLimit.perMs - now;
      
      if (waitTime > 0) {
        logger.warn(`Rate limit alcanzado. Esperando ${waitTime}ms`);
        throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
      }
    }

    // Registrar este request
    this.requestQueue.push(now);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options?: Options): Promise<T> {
    try {
      const response = await this.client.get(url, options);
      return await response.json<T>();
    } catch (error) {
      this.handleError(error, 'GET', url);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, options?: Options): Promise<T> {
    try {
      const response = await this.client.post(url, {
        ...options,
        json: body,
      });
      return await response.json<T>();
    } catch (error) {
      this.handleError(error, 'POST', url);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, options?: Options): Promise<T> {
    try {
      const response = await this.client.put(url, {
        ...options,
        json: body,
      });
      return await response.json<T>();
    } catch (error) {
      this.handleError(error, 'PUT', url);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options?: Options): Promise<T> {
    try {
      const response = await this.client.delete(url, options);
      return await response.json<T>();
    } catch (error) {
      this.handleError(error, 'DELETE', url);
      throw error;
    }
  }

  /**
   * GET request que retorna Response (para casos especiales)
   */
  async getResponse(url: string, options?: Options): Promise<Response> {
    try {
      return await this.client.get(url, options);
    } catch (error) {
      this.handleError(error, 'GET', url);
      throw error;
    }
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: unknown, method: string, url: string): void {
    if (error instanceof Error) {
      logger.error(`HTTP ${method} ${url} failed`, error);
    } else {
      logger.error(`HTTP ${method} ${url} failed`, {
        error: String(error),
      });
    }
  }

  /**
   * Crea una instancia extendida con headers adicionales
   */
  extend(options: Options): HttpClient {
    const extended = this.client.extend(options);
    const newClient = new HttpClient(this.config);
    (newClient as any).client = extended;
    return newClient;
  }
}

// Cliente HTTP por defecto
export const http = new HttpClient({
  enableLogging: true,
});

// Export class para instancias custom
export default HttpClient;

/**
 * Ejemplo de uso:
 * 
 * // GET simple
 * const data = await http.get('/api/tokens');
 * 
 * // POST con body
 * const result = await http.post('/api/tokens', { name: 'PEPE' });
 * 
 * // Cliente con headers custom
 * const apiClient = http.extend({
 *   headers: {
 *     'Authorization': 'Bearer token',
 *     'X-API-Key': 'key'
 *   }
 * });
 * 
 * // Con rate limiting
 * http.setRateLimit({ maxRequests: 10, perMs: 1000 }); // 10 req/s max
 */

