/**
 * AuthModal - Modal de autenticación estilo Axiom para MINOTAURION ⚡
 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuthStore } from '../../state/authStore.ts';
import { supabase } from '../../lib/supabase.ts';
import { makeChallenge, verifySignature } from '../../auth/siws.ts';
import bs58 from 'bs58';

export default function AuthModalAxiom() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const { publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWalletConnect = async () => {
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Generar challenge
      const challenge = makeChallenge();
      
      // 2. Firmar mensaje
      const messageBytes = new TextEncoder().encode(challenge.message);
      const signature = await signMessage(messageBytes);
      
      // 3. Verificar firma
      const signatureBase58 = bs58.encode(signature);
      const pubKeyBase58 = publicKey.toBase58();
      
      const isValid = verifySignature(pubKeyBase58, signatureBase58, challenge.message);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }

      // 4. Buscar/crear perfil
      const { data: existingProfile } = await supabase.getClient()
        .from('profiles')
        .select('*')
        .eq('wallet_address', pubKeyBase58)
        .single();

      if (existingProfile) {
        // Usuario existente
        useAuthStore.getState().setProfile(existingProfile);
        closeAuthModal();
      } else if (mode === 'signup' && handle) {
        // Crear nuevo perfil
        const { data: newProfile, error: profileError } = await supabase.getClient()
          .from('profiles')
          .insert({
            username: handle,
            wallet_address: pubKeyBase58,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        useAuthStore.getState().setProfile(newProfile);
        closeAuthModal();
      } else {
        // Necesita completar signup
        setMode('signup');
        setError('Please complete your profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-dex-bg-secondary to-dex-bg-primary rounded-2xl max-w-md w-full p-8 border border-dex-border shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="text-3xl font-bold mb-2">MINOTAURION</h2>
          <p className="text-dex-text-secondary italic">Only the Brave Trade Here</p>
        </div>

        {/* Tabs */}
        {!publicKey && (
          <div className="flex gap-2 mb-6 bg-dex-bg-tertiary p-1 rounded-lg">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-dex-accent text-black font-semibold shadow-lg'
                  : 'text-dex-text-secondary hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-dex-accent text-black font-semibold shadow-lg'
                  : 'text-dex-text-secondary hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Wallet Button */}
        <button
          onClick={publicKey ? handleWalletConnect : () => setVisible(true)}
          disabled={loading}
          className="w-full bg-dex-accent hover:bg-yellow-600 disabled:bg-gray-600 text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/50 mb-4"
        >
          {loading ? '⏳ Signing...' : publicKey ? '✍️ Sign Message' : '🦊 Connect Wallet'}
        </button>

        {/* Handle input (solo signup o si falta) */}
        {mode === 'signup' && publicKey && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Choose your handle (e.g. minotaur69)"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              className="w-full bg-dex-bg-tertiary border border-dex-border rounded-lg px-4 py-3 focus:outline-none focus:border-dex-accent"
              pattern="[a-z0-9_]{3,15}"
              required
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Divider OR */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-dex-border"></div>
          <span className="px-3 text-dex-text-tertiary text-sm">OR</span>
          <div className="flex-1 border-t border-dex-border"></div>
        </div>

        {/* Secondary options */}
        <button
          disabled
          className="w-full bg-dex-bg-tertiary text-dex-text-secondary py-3 rounded-lg mb-3 cursor-not-allowed opacity-50"
        >
          🔐 Continue with Passkey (Coming Soon)
        </button>

        {/* Legal */}
        <p className="text-xs text-dex-text-tertiary text-center mt-6">
          By continuing, you agree to our Terms and Privacy Policy
        </p>

        {/* Close */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-dex-text-secondary hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

