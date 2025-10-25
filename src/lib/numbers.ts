/**
 * Numbers - Utilidades para formateo de números en MINOTAURION ⚡
 * 
 * Incluye:
 * - Formateo de precios (USD, crypto)
 * - Formateo de números grandes (K, M, B)
 * - Formateo de porcentajes
 * - Formateo de cantidades de tokens
 */

/**
 * Formatea un número como precio en USD
 * @param price - Precio a formatear
 * @param decimals - Decimales a mostrar (auto si no se especifica)
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') return '$0';
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '$0';

  // Precios muy pequeños (< 0.000001) - notación científica
  if (numPrice > 0 && numPrice < 0.000001) {
    return '$' + numPrice.toExponential(4);
  }
  
  // Precios pequeños (< 0.001) - 8 decimales
  if (numPrice < 0.001) {
    return '$' + numPrice.toFixed(8);
  }
  
  // Precios medianos (< 1) - 6 decimales
  if (numPrice < 1) {
    return '$' + numPrice.toFixed(6);
  }
  
  // Precios normales (>= 1) - 4 decimales
  return '$' + numPrice.toFixed(4);
}

/**
 * Formatea un número grande con sufijos (K, M, B, T)
 * @param num - Número a formatear
 * @param decimals - Decimales a mostrar
 */
export function formatNumber(
  num: number | string | null | undefined,
  decimals: number = 2
): string {
  if (num === null || num === undefined || num === '') return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '0';

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';

  if (absValue >= 1_000_000_000_000) {
    return sign + (absValue / 1_000_000_000_000).toFixed(decimals) + 'T';
  }
  if (absValue >= 1_000_000_000) {
    return sign + (absValue / 1_000_000_000).toFixed(decimals) + 'B';
  }
  if (absValue >= 1_000_000) {
    return sign + (absValue / 1_000_000).toFixed(decimals) + 'M';
  }
  if (absValue >= 1_000) {
    return sign + (absValue / 1_000).toFixed(decimals) + 'K';
  }

  return sign + absValue.toFixed(decimals);
}

/**
 * Formatea un número con sufijos K/M/B y símbolo de dólar
 * Útil para market cap, volumen, liquidez
 */
export function formatUSD(
  num: number | string | null | undefined,
  decimals: number = 2
): string {
  if (num === null || num === undefined || num === '') return '$0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '$0';

  return '$' + formatNumber(numValue, decimals).replace('$', '');
}

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje (ej: 5.25 para 5.25%)
 * @param decimals - Decimales a mostrar
 * @param showSign - Mostrar signo + para valores positivos
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = 2,
  showSign: boolean = true
): string {
  if (value === null || value === undefined || value === '') return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0%';

  const sign = numValue > 0 && showSign ? '+' : '';
  return sign + numValue.toFixed(decimals) + '%';
}

/**
 * Formatea una cantidad de tokens con decimales apropiados
 * @param amount - Cantidad de tokens
 * @param decimals - Decimales del token (default 18)
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 18
): string {
  if (!amount) return '0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0';

  // Si es un número muy grande, usar notación compacta
  if (numAmount >= 1_000_000) {
    return formatNumber(numAmount, 2);
  }

  // Para números normales, mostrar con decimales apropiados
  if (numAmount < 0.01) {
    return numAmount.toFixed(decimals > 6 ? 6 : decimals);
  }
  
  return numAmount.toFixed(2);
}

/**
 * Convierte un valor con decimales a número legible
 * @param value - Valor en formato de contrato (ej: "1000000000000000000" para 1 ETH)
 * @param decimals - Decimals del token
 */
export function fromDecimals(value: string | number, decimals: number = 18): number {
  const numValue = typeof value === 'string' ? BigInt(value) : BigInt(Math.floor(value));
  const divisor = BigInt(10 ** decimals);
  return Number(numValue) / Number(divisor);
}

/**
 * Convierte un número legible a valor con decimales
 * @param value - Valor legible (ej: 1 para 1 ETH)
 * @param decimals - Decimals del token
 */
export function toDecimals(value: number, decimals: number = 18): string {
  const multiplier = BigInt(10 ** decimals);
  const scaled = BigInt(Math.floor(value * Number(multiplier)));
  return scaled.toString();
}

/**
 * Trunca un número a N decimales sin redondear
 */
export function truncate(value: number, decimals: number): number {
  const multiplier = 10 ** decimals;
  return Math.floor(value * multiplier) / multiplier;
}

/**
 * Verifica si un valor numérico es válido
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

/**
 * Obtiene el color apropiado para un cambio de precio/porcentaje
 */
export function getPriceChangeColor(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'text-dex-text-secondary';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return 'text-dex-text-secondary';
  return numValue > 0 ? 'text-green-500' : 'text-red-500';
}

/**
 * Obtiene el emoji apropiado para un cambio de precio/porcentaje
 */
export function getPriceChangeEmoji(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '─';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || numValue === 0) return '─';
  return numValue > 0 ? '↗' : '↘';
}

