/**
 * Moralis Client - Cliente tipado para Moralis API en MINOTAURION ⚡
 * 
 * Características:
 * - Endpoints tipados
 * - Validación de respuestas (futuro: con Zod)
 * - Rate limiting configurado
 * - Retry automático
 * - Cache (futuro)
 */

import HttpClient from './http';
import { logger } from './logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MoralisConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    maxRequests: number;
    perMs: number;
  };
}

export interface TrendingToken {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  chain: string;
  usdPrice: number;
  usdPrice24hrPercentChange?: number;
  volume24h?: number;
  marketCap?: number;
  liquidity?: number;
}

export interface TokenMetadata {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  logoHash?: string;
  thumbnail?: string;
}

export interface TokenPair {
  pairAddress: string;
  chainId: string;
  exchangeName?: string;
  exchangeLogo?: string;
  pairLabel?: string;
  liquidityUsd?: string;
  usdPrice?: string;
  usdPrice24hrPercentChange?: string;
  volume24hrUsd?: string;
  baseToken?: any;
  quoteToken?: any;
  pair?: any[];
}

export interface PairStats {
  pairAddress: string;
  usdPrice: string;
  usdPrice24hrPercentChange: string;
  volume24hrUsd: string;
  liquidityUsd: string;
  marketCapUsd?: string;
}

export interface TokenHolder {
  ownerAddress: string;
  balance: string;
  balanceFormatted: string;
  usdValue?: string;
  percentageRelativeToTotalSupply?: number;
}

export interface WalletNetWorth {
  totalNetworthUsd: string;
  chains: Array<{
    chain: string;
    nativeBalance: string;
    nativeBalanceFormatted: string;
    nativeBalanceUsd: string;
    tokenBalanceUsd: string;
    networthUsd: string;
  }>;
}

// ============================================================================
// MORALIS CLIENT
// ============================================================================

class MoralisClient {
  private http: HttpClient;
  private apiKey: string;

  constructor(config: MoralisConfig) {
    this.apiKey = config.apiKey;

    // Cliente HTTP para EVM
    this.http = new HttpClient({
      baseUrl: config.baseUrl || 'https://deep-index.moralis.io/api/v2.2',
      timeout: 30000,
      retryLimit: 3,
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
      enableLogging: true,
    });

    // Configurar rate limit si se proporciona
    if (config.rateLimit) {
      this.http.setRateLimit(config.rateLimit);
    }

    logger.info('MoralisClient initialized');
  }

  // ==========================================================================
  // TRENDING & DISCOVERY
  // ==========================================================================

  /**
   * Obtiene tokens en tendencia
   */
  async getTrendingTokens(chain?: string): Promise<TrendingToken[]> {
    const params = chain ? `?chain=${chain}` : '';
    const response = await this.http.get<any>(`/tokens/trending${params}`);
    return response.result || response || [];
  }

  /**
   * Busca tokens por nombre o símbolo
   */
  async searchTokens(query: string, chains?: string[]): Promise<any[]> {
    const chainParams = chains?.map((c, i) => `chains[${i}]=${c}`).join('&') || '';
    const params = `?query=${encodeURIComponent(query)}${chainParams ? '&' + chainParams : ''}`;
    const response = await this.http.get<any>(`/tokens/search${params}`);
    return response.result || response || [];
  }

  // ==========================================================================
  // TOKEN METADATA
  // ==========================================================================

  /**
   * Obtiene metadata de un token EVM
   */
  async getTokenMetadata(
    tokenAddress: string,
    chain: string = '0x1'
  ): Promise<TokenMetadata> {
    const response = await this.http.get<any>(
      `/erc20/metadata?chain=${chain}&addresses[]=${tokenAddress}`
    );
    return response[0] || response;
  }

  /**
   * Obtiene metadata de un token Solana
   */
  async getSolanaTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    const solanaHttp = new HttpClient({
      baseUrl: 'https://solana-gateway.moralis.io',
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
    
    const response = await solanaHttp.get<any>(
      `/token/mainnet/${tokenAddress}/metadata`
    );
    return response;
  }

  // ==========================================================================
  // PAIRS & LIQUIDITY
  // ==========================================================================

  /**
   * Obtiene pares de trading de un token EVM
   */
  async getTokenPairs(
    tokenAddress: string,
    chain: string = '0x1'
  ): Promise<TokenPair[]> {
    const response = await this.http.get<any>(
      `/erc20/${tokenAddress}/pairs?chain=${chain}`
    );
    return response.pairs || response.result || [];
  }

  /**
   * Obtiene pares de un token Solana
   */
  async getSolanaTokenPairs(tokenAddress: string): Promise<TokenPair[]> {
    const solanaHttp = new HttpClient({
      baseUrl: 'https://solana-gateway.moralis.io',
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
    
    const response = await solanaHttp.get<any>(
      `/token/mainnet/${tokenAddress}/pairs`
    );
    return response.pairs || response.result || [];
  }

  /**
   * Obtiene estadísticas de un par
   */
  async getPairStats(
    pairAddress: string,
    chain: string = '0x1'
  ): Promise<PairStats> {
    const response = await this.http.get<any>(
      `/pairs/${pairAddress}/stats?chain=${chain}`
    );
    return response;
  }

  /**
   * Obtiene transacciones de un par (swaps)
   */
  async getPairSwaps(
    pairAddress: string,
    chain: string = '0x1',
    limit: number = 100
  ): Promise<any[]> {
    const response = await this.http.get<any>(
      `/pairs/${pairAddress}/swaps?chain=${chain}&limit=${limit}&order=DESC`
    );
    return response.result || [];
  }

  /**
   * Obtiene snipers de un par
   */
  async getPairSnipers(
    pairAddress: string,
    chain: string = '0x1'
  ): Promise<any[]> {
    const response = await this.http.get<any>(
      `/pairs/${pairAddress}/snipers?chain=${chain}&blocksAfterCreation=3`
    );
    return response.result || [];
  }

  // ==========================================================================
  // HOLDERS
  // ==========================================================================

  /**
   * Obtiene holders de un token
   */
  async getTokenHolders(
    tokenAddress: string,
    chain: string = '0x1',
    limit: number = 100
  ): Promise<TokenHolder[]> {
    const response = await this.http.get<any>(
      `/erc20/${tokenAddress}/holders?chain=${chain}&limit=${limit}&order=DESC`
    );
    return response.result || [];
  }

  /**
   * Obtiene estadísticas de holders
   */
  async getTokenHolderStats(
    tokenAddress: string,
    chain: string = '0x1'
  ): Promise<any> {
    const response = await this.http.get<any>(
      `/erc20/${tokenAddress}/holder-stats?chain=${chain}`
    );
    return response;
  }

  // ==========================================================================
  // WALLET & PORTFOLIO
  // ==========================================================================

  /**
   * Obtiene net worth de una wallet
   */
  async getWalletNetWorth(
    address: string,
    chains?: string[]
  ): Promise<WalletNetWorth> {
    const chainParams = chains?.map((c, i) => `chains[${i}]=${c}`).join('&') || '';
    const response = await this.http.get<any>(
      `/wallets/${address}/net-worth?${chainParams}&exclude_spam=true`
    );
    return response;
  }

  /**
   * Obtiene tokens de una wallet
   */
  async getWalletTokens(
    address: string,
    chain: string = '0x1'
  ): Promise<any[]> {
    const response = await this.http.get<any>(
      `/wallets/${address}/tokens?chain=${chain}`
    );
    return response.result || [];
  }

  // ==========================================================================
  // PUMP.FUN (SOLANA)
  // ==========================================================================

  /**
   * Obtiene nuevos tokens de Pump.fun
   */
  async getPumpFunNewTokens(limit: number = 100): Promise<any[]> {
    const solanaHttp = new HttpClient({
      baseUrl: 'https://solana-gateway.moralis.io',
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
    
    const response = await solanaHttp.get<any>(
      `/token/mainnet/exchange/pumpfun/new?limit=${limit}`
    );
    return response.result || [];
  }

  /**
   * Obtiene tokens en bonding de Pump.fun
   */
  async getPumpFunBondingTokens(limit: number = 100): Promise<any[]> {
    const solanaHttp = new HttpClient({
      baseUrl: 'https://solana-gateway.moralis.io',
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
    
    const response = await solanaHttp.get<any>(
      `/token/mainnet/exchange/pumpfun/bonding?limit=${limit}`
    );
    return response.result || [];
  }

  /**
   * Obtiene tokens graduados de Pump.fun
   */
  async getPumpFunGraduatedTokens(limit: number = 100): Promise<any[]> {
    const solanaHttp = new HttpClient({
      baseUrl: 'https://solana-gateway.moralis.io',
      headers: {
        'accept': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
    
    const response = await solanaHttp.get<any>(
      `/token/mainnet/exchange/pumpfun/graduated?limit=${limit}`
    );
    return response.result || [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const API_KEY = process.env.REACT_APP_MORALIS_API_KEY || '';

if (!API_KEY) {
  logger.error('REACT_APP_MORALIS_API_KEY no está configurada');
}

export const moralis = new MoralisClient({
  apiKey: API_KEY,
  rateLimit: {
    maxRequests: 25, // Moralis free tier: 25 req/s
    perMs: 1000,
  },
});

export default MoralisClient;

