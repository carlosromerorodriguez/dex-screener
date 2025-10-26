/**
 * AuthModal V3 - Flujo robusto wallet-first con FSM para MINOTAURION ⚡
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuthStore } from '../../state/authStore.ts';
import { supabase } from '../../lib/supabase.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { makeChallenge, verifySignature, clearNonce } from '../../auth/siws.ts';
import bs58 from 'bs58';

type HandleStatus = 'neutral' | 'taken' | 'free';

export default function AuthModalV3() {
  const store = useAuthStore();
  const { publicKey, signMessage, wallet, disconnect } = useWallet();
  
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('neutral');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState('');
  
  const debouncedHandle = useDebouncedValue(handle, 400);

  // Verificar handle cuando cambia (debounced)
  useEffect(() => {
    const checkHandle = async () => {
      if (!debouncedHandle || debouncedHandle.length < 3) {
        setHandleStatus('neutral');
        setSuggestions([]);
        return;
      }

      const regex = /^[a-z0-9_]{3,15}$/;
      if (!regex.test(debouncedHandle)) {
        setHandleStatus('neutral');
        return;
      }

      try {
        const { data, error } = await supabase.getClient()
          .from('profiles')
          .select('username')
          .eq('username', debouncedHandle)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setHandleStatus('free');
          setSuggestions([]);
        } else {
          setHandleStatus('taken');
          // Generar sugerencias
          const suggs = [
            `${debouncedHandle}_${Math.floor(Math.random() * 100)}`,
            `${debouncedHandle}_x`,
            `${debouncedHandle}_${new Date().getFullYear()}`,
          ];
          setSuggestions(suggs);
        }
      } catch (err) {
        console.error('Error checking handle:', err);
      }
    };

    if (store.state === 'handle') {
      checkHandle();
    }
  }, [debouncedHandle, store.state]);

  // Detectar cuando conecta wallet
  useEffect(() => {
    const handleConnection = async () => {
      if (!publicKey || store.state !== 'wallet_select') return;

      const pubkeyStr = publicKey.toBase58();
      store.onWalletConnected(wallet?.adapter.name || 'Unknown', pubkeyStr);

      // Verificar si ya tiene perfil
      try {
        const { data: existingProfile } = await supabase.getClient()
          .from('profiles')
          .select('*')
          .eq('wallet_address', pubkeyStr)
          .maybeSingle();

        if (existingProfile && existingProfile.username) {
          // Usuario existente -> directo a SIWS
          store.goToSiws();
        } else {
          // Nuevo usuario -> pedir handle
          store.goToHandle();
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        store.goToHandle();
      }
    };

    handleConnection();
  }, [publicKey, store.state, wallet, store]);

  // Listener de desconexión
  useEffect(() => {
    if (!wallet) return;

    const onDisconnect = () => {
      console.log('Wallet disconnected');
      store.resetFlow(false);
    };

    wallet.adapter.on('disconnect', onDisconnect);
    return () => {
      wallet.adapter.off('disconnect', onDisconnect);
    };
  }, [wallet, store]);

  const handleSign = async () => {
    if (!publicKey || !signMessage) return;

    try {
      store.goToSiws();

      // AbortController
      const abortController = new AbortController();
      store.setSiwsAbort(abortController);

      const challenge = makeChallenge(publicKey.toBase58());
      const messageBytes = new TextEncoder().encode(challenge.message);
      
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);
      
      const isValid = verifySignature(publicKey.toBase58(), signatureBase58, challenge.message);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }

      clearNonce();
      store.goToCreating();

      // Obtener usuario autenticado de Supabase
      const { data: { user } } = await supabase.getClient().auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user. Please sign up first.');
      }

      // Upsert perfil usando auth.uid()
      console.info('Creating profile:', {
        id: user.id,
        wallet_address: publicKey.toBase58(),
        username: handle || store.ctx.draftHandle,
      });

      const { data: profile, error: profileError } = await supabase.getClient()
        .from('profiles')
        .upsert({
          id: user.id, // IMPORTANTE: usar auth.uid()
          wallet_address: publicKey.toBase58(),
          username: handle || store.ctx.draftHandle || `user_${user.id.slice(0, 8)}`,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw profileError;
      }

      store.setProfile(profile);
      store.goToDone();
      
      // Confetti si es nuevo usuario
      if (!profile.username.startsWith('user_')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      setTimeout(() => store.closeModal(), 1000);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        store.resetFlow(false);
        return;
      }
      setError(err.message || 'Failed to sign in');
      store.goToError(err.message);
      setTimeout(() => store.resetFlow(false), 2000);
    }
  };

  const handleBack = () => {
    store.resetFlow(true);
    disconnect();
  };

  if (!store.isAuthModalOpen) return null;

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
        onClick={() => store.closeModal()}
      >
        <div 
          className="bg-[#121212] rounded-2xl max-w-md w-full p-8 border border-white/[0.08] shadow-[0_0_25px_rgba(194,155,67,0.15)] animate-scaleIn relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={() => store.closeModal()}
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

          {/* Progress indicator */}
          {store.state !== 'wallet_select' && (
            <div className="mb-6 flex justify-center gap-2">
              {['connected', 'handle', 'siws', 'creating_profile'].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 w-12 rounded-full transition-all ${
                    store.state === step ? 'bg-[#C29B43]' : 'bg-[#333]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* WALLET SELECT */}
          {store.state === 'wallet_select' && (
            <div className="space-y-4">
              <WalletMultiButton className="!w-full !bg-gradient-to-r !from-[#C29B43] !to-[#FFD580] hover:!shadow-[0_0_20px_rgba(194,155,67,0.4)] !text-black !font-semibold !py-4 !rounded-xl !transition-all !transform hover:!scale-[1.02] active:!scale-[0.98]" />
              
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/[0.08]"></div>
                <span className="px-3 text-[#666] text-xs font-medium bg-[#121212]">OR</span>
                <div className="flex-1 border-t border-white/[0.08]"></div>
              </div>

              <button
                onClick={() => { store.enterGuest(); store.closeModal(); }}
                className="w-full bg-[#0B0B0C] border border-white/[0.08] text-[#B0B0B0] hover:text-white hover:border-[#C29B43]/50 py-3 rounded-lg transition-all"
              >
                👤 Try as Guest
              </button>
            </div>
          )}

          {/* HANDLE */}
          {store.state === 'handle' && (
            <div className="space-y-4">
              <p className="text-[#B0B0B0] text-sm mb-4">Choose your unique handle</p>

              <div className="relative">
                <input
                  type="text"
                  placeholder="your_handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  onBlur={() => store.setDraftHandle(handle)}
                  className="w-full bg-[#0B0B0C] border border-white/[0.08] rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#C29B43] focus:ring-1 focus:ring-[#C29B43] transition-all"
                  pattern="[a-z0-9_]{3,15}"
                  minLength={3}
                  maxLength={15}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {handleStatus === 'free' && <span className="text-green-500">✓</span>}
                  {handleStatus === 'taken' && <span className="text-red-500">✕</span>}
                </div>
              </div>

              <p className="text-[#666] text-xs">
                3-15 characters, lowercase, numbers and underscores
              </p>

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[#888] text-xs">Try these:</p>
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
                onClick={() => { store.setDraftHandle(handle); store.goToSiws(); handleSign(); }}
                disabled={handleStatus !== 'free'}
                className="w-full bg-gradient-to-r from-[#C29B43] to-[#FFD580] hover:shadow-[0_0_20px_rgba(194,155,67,0.4)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02]"
              >
                Continue & Sign Message
              </button>

              <button
                onClick={handleBack}
                className="w-full text-[#888] hover:text-white text-sm py-2"
              >
                ← Change Wallet
              </button>
            </div>
          )}

          {/* SIWS / CREATING */}
          {(store.state === 'siws' || store.state === 'creating_profile') && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#C29B43] border-t-transparent mx-auto mb-4"></div>
              <p className="text-white mb-2">
                {store.state === 'siws' ? '✍️ Signing message...' : '🔨 Creating your profile...'}
              </p>
              <p className="text-[#888] text-sm">
                {store.state === 'siws' ? 'Check your wallet' : 'Almost there...'}
              </p>
            </div>
          )}

          {/* ERROR */}
          {store.state === 'error' && error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Legal */}
          <p className="text-[#555] text-xs text-center mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#C29B43] hover:text-[#FFD580] transition-colors">Terms</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(194, 155, 67, 0.3)); } 50% { filter: drop-shadow(0 0 16px rgba(194, 155, 67, 0.6)); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
      `}</style>
    </>
  );
}

