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

export function makeChallenge(): SIWSChallenge {
  const domain = process.env.REACT_APP_SIWS_DOMAIN || 'minotaurion.app';
  const statement = process.env.REACT_APP_SIWS_STATEMENT || 'Sign in to MINOTAURION — Only the Brave Trade Here';
  const expMin = parseInt(process.env.REACT_APP_SIWS_EXP_MIN || '15');
  
  const nonce = bs58.encode(nacl.randomBytes(32)).slice(0, 16);
  const expiresAt = Date.now() + expMin * 60 * 1000;
  const exp = new Date(expiresAt).toISOString();

  const message = `${domain} wants you to sign in\n\n${statement}\n\nNonce: ${nonce}\nExpires: ${exp}`;

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

