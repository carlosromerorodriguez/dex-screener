/**
 * AuthModal - Modal de autenticación estilo premium para MINOTAURION ⚡
 */

import React, { useState, useEffect } from 'react';
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
  const [showConfetti, setShowConfetti] = useState(false);

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
        setShowConfetti(true);
        setTimeout(() => {
          closeAuthModal();
          setShowConfetti(false);
        }, 2000);
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

  useEffect(() => {
    if (!isAuthModalOpen) {
      setError('');
      setHandle('');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  return (
    <>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                fontSize: '20px',
              }}
            >
              ⚡
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
        onClick={closeAuthModal}
      >
        <div 
          className="bg-[#121212] rounded-2xl max-w-md w-full p-8 border border-white/[0.08] shadow-[0_0_25px_rgba(194,155,67,0.15)] animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-glow inline-block">⚡</div>
            <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight">MINOTAURION</h2>
            <p className="text-[#C29B43] italic text-sm">Only the Brave Trade Here</p>
          </div>

          {/* Tabs */}
          {!publicKey && (
            <div className="flex justify-between mb-6 bg-[#0B0B0C] rounded-lg border border-white/[0.08] p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium uppercase tracking-wide text-xs transition-all ${
                  mode === 'login'
                    ? 'bg-[#1A1A1A] text-[#C29B43] shadow-md'
                    : 'text-[#B0B0B0] hover:text-[#FFD580]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium uppercase tracking-wide text-xs transition-all ${
                  mode === 'signup'
                    ? 'bg-[#1A1A1A] text-[#C29B43] shadow-md'
                    : 'text-[#B0B0B0] hover:text-[#FFD580]'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Connect Wallet - CTA Principal */}
          <button
            onClick={publicKey ? handleWalletConnect : () => setVisible(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#C29B43] to-[#FFD580] hover:shadow-[0_0_20px_rgba(194,155,67,0.4)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-6 animate-pulse-subtle"
          >
            {loading ? '⏳ Signing...' : publicKey ? '✍️ Sign Message' : '🦊 Connect Wallet'}
          </button>

          {/* Handle input */}
          {mode === 'signup' && publicKey && (
            <div className="mb-6">
              <label className="block text-[#B0B0B0] text-sm font-medium mb-2">Choose your handle</label>
              <input
                type="text"
                placeholder="e.g. minotaur69"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                className="w-full bg-[#0B0B0C] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C29B43] focus:ring-1 focus:ring-[#C29B43] transition-all"
                pattern="[a-z0-9_]{3,15}"
                minLength={3}
                maxLength={15}
                required
              />
              <p className="text-[#666] text-xs mt-2">3-15 characters, lowercase, numbers and underscores</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6 animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-white/[0.08]"></div>
            <span className="px-3 text-[#666] text-xs font-medium bg-[#121212]">OR</span>
            <div className="flex-1 border-t border-white/[0.08]"></div>
          </div>

          {/* Passkey Option */}
          <button
            disabled
            className="w-full bg-[#0B0B0C] text-[#666] py-3 rounded-lg mb-3 cursor-not-allowed opacity-60 border border-white/[0.05]"
          >
            <span className="text-[#C29B43]/50 mr-2">🔐</span>
            Continue with Passkey <span className="text-xs">(Coming Soon)</span>
          </button>

          {/* Legal */}
          <p className="text-[#555] text-xs text-center mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#C29B43] hover:text-[#FFD580] transition-colors">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#C29B43] hover:text-[#FFD580] transition-colors">Privacy Policy</a>
          </p>

          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(194, 155, 67, 0.3)); }
          50% { filter: drop-shadow(0 0 16px rgba(194, 155, 67, 0.6)); }
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(194, 155, 67, 0); }
          50% { box-shadow: 0 0 12px 2px rgba(194, 155, 67, 0.2); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-confetti { animation: confetti 2s linear forwards; }
      `}</style>
    </>
  );
}

