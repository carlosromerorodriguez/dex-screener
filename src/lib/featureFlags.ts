/**
 * Feature Flags - Sistema de control de características para MINOTAURION ⚡
 * 
 * Permite activar/desactivar features sin deployar código.
 * Útil para:
 * - A/B testing
 * - Feature toggles
 * - Rollouts graduales
 * - Dark launches
 */

export interface FeatureFlags {
  // Social features
  social: boolean;
  chat: boolean;
  communities: boolean;
  
  // Trading features
  trading: boolean;
  swaps: boolean;
  limit_orders: boolean;
  
  // Gamification
  badges: boolean;
  leaderboards: boolean;
  achievements: boolean;
  
  // Streaming
  streaming: boolean;
  creator_mode: boolean;
  
  // Analytics
  advanced_charts: boolean;
  portfolio_analytics: boolean;
  
  // Experimental
  ai_insights: boolean;
  price_alerts: boolean;
}

class FeatureFlagsService {
  private flags: FeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
  }

  /**
   * Carga los feature flags desde las variables de entorno
   */
  private loadFlags(): FeatureFlags {
    return {
      // Social features
      social: this.getEnvFlag('VITE_FEATURE_SOCIAL', false),
      chat: this.getEnvFlag('VITE_FEATURE_CHAT', false),
      communities: this.getEnvFlag('VITE_FEATURE_COMMUNITIES', false),
      
      // Trading features
      trading: this.getEnvFlag('VITE_FEATURE_TRADING', false),
      swaps: this.getEnvFlag('VITE_FEATURE_SWAPS', false),
      limit_orders: this.getEnvFlag('VITE_FEATURE_LIMIT_ORDERS', false),
      
      // Gamification
      badges: this.getEnvFlag('VITE_FEATURE_BADGES', false),
      leaderboards: this.getEnvFlag('VITE_FEATURE_LEADERBOARDS', false),
      achievements: this.getEnvFlag('VITE_FEATURE_ACHIEVEMENTS', false),
      
      // Streaming
      streaming: this.getEnvFlag('VITE_FEATURE_STREAMING', false),
      creator_mode: this.getEnvFlag('VITE_FEATURE_CREATOR_MODE', false),
      
      // Analytics
      advanced_charts: this.getEnvFlag('VITE_FEATURE_ADVANCED_CHARTS', true),
      portfolio_analytics: this.getEnvFlag('VITE_FEATURE_PORTFOLIO_ANALYTICS', true),
      
      // Experimental
      ai_insights: this.getEnvFlag('VITE_FEATURE_AI_INSIGHTS', false),
      price_alerts: this.getEnvFlag('VITE_FEATURE_PRICE_ALERTS', false),
    };
  }

  /**
   * Helper para leer un flag de entorno como boolean
   */
  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = (process.env as any)[key];
    if (value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  }

  /**
   * Verifica si un feature está habilitado
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  /**
   * Verifica si un feature está deshabilitado
   */
  isDisabled(feature: keyof FeatureFlags): boolean {
    return !this.flags[feature];
  }

  /**
   * Obtiene todos los flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Obtiene los flags habilitados
   */
  getEnabled(): Partial<FeatureFlags> {
    return Object.entries(this.flags)
      .filter(([_, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Activa un feature temporalmente (solo en desarrollo)
   * NO afecta producción ni las variables de entorno
   */
  enable(feature: keyof FeatureFlags): void {
    if (process.env.NODE_ENV === 'development') {
      this.flags[feature] = true;
      console.log(`[FeatureFlags] ✅ "${feature}" habilitado temporalmente`);
    } else {
      console.warn(`[FeatureFlags] ⚠️ No se puede modificar "${feature}" en producción`);
    }
  }

  /**
   * Desactiva un feature temporalmente (solo en desarrollo)
   */
  disable(feature: keyof FeatureFlags): void {
    if (process.env.NODE_ENV === 'development') {
      this.flags[feature] = false;
      console.log(`[FeatureFlags] ❌ "${feature}" deshabilitado temporalmente`);
    } else {
      console.warn(`[FeatureFlags] ⚠️ No se puede modificar "${feature}" en producción`);
    }
  }

  /**
   * Resetea los flags a los valores de entorno
   */
  reset(): void {
    this.flags = this.loadFlags();
    console.log('[FeatureFlags] 🔄 Flags reseteados a valores de entorno');
  }
}

// Singleton export
export const featureFlags = new FeatureFlagsService();

// Export class for custom instances
export default FeatureFlagsService;

// Helper hook para React (opcional, puede usarse en componentes)
/**
 * Ejemplo de uso:
 * 
 * import { featureFlags } from '@/lib/featureFlags';
 * 
 * function MyComponent() {
 *   if (!featureFlags.isEnabled('trading')) {
 *     return <ComingSoon />;
 *   }
 *   return <TradingInterface />;
 * }
 */

