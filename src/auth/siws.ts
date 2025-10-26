/**
 * SIWS - Sign-In With Solana utilities
 */

import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface SIWSChallenge {
  message: string;
  nonce: string;
  expiresAt: number;
}

const NONCE_KEY = 'minotaurion_siws_nonce';

export function getNonce(): string {
  let nonce = localStorage.getItem(NONCE_KEY);
  if (!nonce) {
    nonce = bs58.encode(nacl.randomBytes(32)).slice(0, 16);
    localStorage.setItem(NONCE_KEY, nonce);
  }
  return nonce;
}

export function clearNonce(): void {
  localStorage.removeItem(NONCE_KEY);
}

export function buildSiwsMessage(params: {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}): string {
  return `${params.domain} wants you to sign in with your Solana account:
${params.address}

${params.statement}

Nonce: ${params.nonce}
Issued At: ${params.issuedAt}
Expiration Time: ${params.expirationTime}`;
}

export function makeChallenge(walletAddress: string): SIWSChallenge {
  const domain = window.location.host || process.env.REACT_APP_SIWS_DOMAIN || 'minotaurion.app';
  const statement = process.env.REACT_APP_SIWS_STATEMENT || 'Sign in to MINOTAURION — Only the Brave Trade Here';
  const expMin = parseInt(process.env.REACT_APP_SIWS_EXP_MIN || '15');
  
  const nonce = getNonce();
  const issuedAt = new Date().toISOString();
  const expiresAt = Date.now() + expMin * 60 * 1000;
  const expirationTime = new Date(expiresAt).toISOString();

  const message = buildSiwsMessage({
    domain,
    address: walletAddress,
    statement,
    nonce,
    issuedAt,
    expirationTime,
  });

  return { message, nonce, expiresAt };
}

export function verifySignature(
  publicKeyBase58: string,
  signatureBase58: string,
  message: string
): boolean {
  try {
    const pubKey = bs58.decode(publicKeyBase58);
    const sig = bs58.decode(signatureBase58);
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sig, pubKey);
  } catch {
    return false;
  }
}

