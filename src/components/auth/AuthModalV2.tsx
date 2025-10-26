/**
 * AuthModal V2 - Modal mejorado con wallet-first flow para MINOTAURION ⚡
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuthStore } from '../../state/authStore.ts';
import { supabase } from '../../lib/supabase.ts';
import { useProfile } from '../../hooks/useProfile.ts';
import { makeChallenge, verifySignature, clearNonce } from '../../auth/siws.ts';
import bs58 from 'bs58';

export default function AuthModalV2() {
  const { isAuthModalOpen, closeAuthModal, authFlow, setAuthFlow, enterGuest, setLastWallet } = useAuthStore();
  const { publicKey, signMessage, wallet, disconnect } = useWallet();
  const { checkHandleAvailability, suggestHandles } = useProfile();
  
  const [handle, setHandle] = useState('');
  const [handleValid, setHandleValid] = useState(false);
  const [handleChecking, setHandleChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Validar handle en tiempo real
  useEffect(() => {
    const validateHandle = async () => {
      if (!handle || handle.length < 3) {
        setHandleValid(false);
        setSuggestions([]);
        return;
      }

      // Validar formato
      const regex = /^[a-z0-9_]{3,15}$/;
      if (!regex.test(handle)) {
        setHandleValid(false);
        return;
      }

      setHandleChecking(true);
      const available = await checkHandleAvailability(handle);
      setHandleValid(available);
      
      if (!available) {
        const alts = await suggestHandles(handle);
        setSuggestions(alts);
      } else {
        setSuggestions([]);
      }
      
      setHandleChecking(false);
    };

    const timer = setTimeout(validateHandle, 500);
    return () => clearTimeout(timer);
  }, [handle, checkHandleAvailability, suggestHandles]);

  // Cuando conecta wallet, verificar si ya tiene perfil
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!publicKey || authFlow !== 'wallet_select') return;

      try {
        const { data: existingProfile } = await supabase.getClient()
          .from('profiles')
          .select('*')
          .eq('wallet_address', publicKey.toBase58())
          .maybeSingle();

        if (existingProfile) {
          // Usuario existente -> directo a firmar
          setAuthFlow('signing');
        } else {
          // Nuevo usuario -> pedir handle
          setAuthFlow('handle');
        }
      } catch (err) {
        console.error('Error checking profile:', err);
      }
    };

    checkExistingProfile();
  }, [publicKey, authFlow, setAuthFlow]);

  const handleSign = async () => {
    if (!publicKey || !signMessage) return;

    setLoading(true);
    setError('');

    try {
      setAuthFlow('signing');

      // Generar challenge SIWS
      const challenge = makeChallenge(publicKey.toBase58());
      const messageBytes = new TextEncoder().encode(challenge.message);
      
      // Firmar
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);
      
      // Verificar
      const isValid = verifySignature(publicKey.toBase58(), signatureBase58, challenge.message);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }

      clearNonce();
      setAuthFlow('creating_profile');

      // Buscar perfil existente
      const { data: existingProfile } = await supabase.getClient()
        .from('profiles')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .maybeSingle();

      if (existingProfile) {
        // Login exitoso
        useAuthStore.getState().setProfile(existingProfile);
        if (wallet?.adapter.name) {
          setLastWallet(wallet.adapter.name);
        }
        setAuthFlow('done');
        setTimeout(() => closeAuthModal(), 500);
      } else if (handle && handleValid) {
        // Crear nuevo perfil
        const { data: newProfile, error: profileError } = await supabase.getClient()
          .from('profiles')
          .insert({
            username: handle,
            wallet_address: publicKey.toBase58(),
          })
          .select()
          .single();

        if (profileError) throw profileError;

        useAuthStore.getState().setProfile(newProfile);
        if (wallet?.adapter.name) {
          setLastWallet(wallet.adapter.name);
        }
        
        // Celebrar primer login
        setShowConfetti(true);
        setAuthFlow('done');
        
        setTimeout(() => {
          closeAuthModal();
          setShowConfetti(false);
        }, 2000);
      } else {
        throw new Error('Handle required for new users');
      }
    } catch (err: any) {
      setAuthFlow('error');
      setError(err.message || 'Failed to sign in');
      setTimeout(() => setAuthFlow(publicKey ? 'handle' : 'wallet_select'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    enterGuest();
    closeAuthModal();
  };

  const handleDisconnect = () => {
    disconnect();
    setAuthFlow('wallet_select');
    setHandle('');
    setError('');
  };

  if (!isAuthModalOpen) return null;

  const isWalletConnected = !!publicKey;
  const canSign = isWalletConnected && (authFlow === 'signing' || (authFlow === 'handle' && handleValid));

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 1}s`,
                fontSize: `${20 + Math.random() * 10}px`,
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
          className="bg-[#121212] rounded-2xl max-w-md w-full p-8 border border-white/[0.08] shadow-[0_0_25px_rgba(194,155,67,0.15)] animate-scaleIn relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-glow inline-block">⚡</div>
            <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight">MINOTAURION</h2>
            <p className="text-[#C29B43] italic text-sm">Only the Brave Trade Here</p>
          </div>

          {/* Flow indicator */}
          <div className="mb-6 flex justify-center gap-2">
            {['wallet_select', 'handle', 'signing', 'creating_profile'].map((step, i) => (
              <div
                key={step}
                className={`h-1.5 w-12 rounded-full transition-all ${
                  authFlow === step ? 'bg-[#C29B43]' : 'bg-[#333]'
                }`}
              />
            ))}
          </div>

          {/* Content based on flow */}
          {authFlow === 'wallet_select' && !isWalletConnected && (
            <div className="space-y-4">
              <div className="wallet-multi-button-override">
                <WalletMultiButton className="!w-full !bg-gradient-to-r !from-[#C29B43] !to-[#FFD580] hover:!shadow-[0_0_20px_rgba(194,155,67,0.4)] !text-black !font-semibold !py-4 !rounded-xl !transition-all !transform hover:!scale-[1.02] active:!scale-[0.98]" />
              </div>
              
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/[0.08]"></div>
                <span className="px-3 text-[#666] text-xs font-medium bg-[#121212]">OR</span>
                <div className="flex-1 border-t border-white/[0.08]"></div>
              </div>

              <button
                onClick={handleGuestMode}
                className="w-full bg-[#0B0B0C] border border-white/[0.08] text-[#B0B0B0] hover:text-white hover:border-[#C29B43]/50 py-3 rounded-lg transition-all"
              >
                👤 Try as Guest
              </button>
            </div>
          )}

          {authFlow === 'handle' && isWalletConnected && (
            <div className="space-y-4">
              <p className="text-[#B0B0B0] text-sm mb-4">
                Choose your unique handle to continue
              </p>

              <div>
                <input
                  type="text"
                  placeholder="your_handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  className="w-full bg-[#0B0B0C] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C29B43] focus:ring-1 focus:ring-[#C29B43] transition-all"
                  pattern="[a-z0-9_]{3,15}"
                  minLength={3}
                  maxLength={15}
                />
                <p className="text-[#666] text-xs mt-2">
                  {handleChecking ? '⏳ Checking...' : 
                   handleValid ? '✅ Available' : 
                   handle.length >= 3 ? '❌ Already taken' : '3-15 characters, lowercase'}
                </p>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[#888] text-xs">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => setHandle(sug)}
                        className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#C29B43]/20 border border-[#C29B43]/30 text-[#C29B43] rounded text-sm transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={!handleValid || loading}
                className="w-full bg-gradient-to-r from-[#C29B43] to-[#FFD580] hover:shadow-[0_0_20px_rgba(194,155,67,0.4)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02]"
              >
                Continue & Sign Message
              </button>

              <button
                onClick={handleDisconnect}
                className="w-full text-[#888] hover:text-white text-sm py-2"
              >
                ← Change Wallet
              </button>
            </div>
          )}

          {(authFlow === 'signing' || authFlow === 'creating_profile') && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#C29B43] border-t-transparent mx-auto mb-4"></div>
              <p className="text-white mb-2">
                {authFlow === 'signing' ? '✍️ Signing message...' : '🔨 Creating your profile...'}
              </p>
              <p className="text-[#888] text-sm">
                {authFlow === 'signing' ? 'Check your wallet' : 'Almost there...'}
              </p>
            </div>
          )}

          {authFlow === 'error' && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Legal */}
          <p className="text-[#555] text-xs text-center mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#C29B43] hover:text-[#FFD580] transition-colors">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#C29B43] hover:text-[#FFD580] transition-colors">Privacy</a>
          </p>
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        
        /* Override wallet button styles */
        .wallet-multi-button-override button {
          width: 100% !important;
          justify-content: center !important;
        }
      `}</style>
    </>
  );
}

