/**
 * Auth Store - FSM para autenticación en MINOTAURION ⚡
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/supabase';

type AuthState = 'welcome' | 'wallet_select' | 'connected' | 'handle' | 'siws' | 'creating_profile' | 'done' | 'error';

interface AuthContext {
  lastWalletName?: string;
  rememberWallet?: boolean;
  draftHandle?: string;
  siwsAbort?: AbortController | null;
  connectedPubkey?: string;
}

interface AuthStore {
  session: Session | null;
  profile: UserProfile | null;
  isAuthModalOpen: boolean;
  state: AuthState;
  ctx: AuthContext;
  guestMode: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  start: () => void;
  onWalletConnected: (name: string, pubkey: string) => void;
  goToHandle: () => void;
  goToSiws: () => void;
  goToCreating: () => void;
  goToDone: () => void;
  goToError: (msg: string) => void;
  setDraftHandle: (handle: string) => void;
  setSiwsAbort: (abort: AbortController | null) => void;
  setRememberWallet: (remember: boolean) => void;
  resetFlow: (hard?: boolean) => Promise<void>;
  closeModal: () => Promise<void>;
  enterGuest: () => void;
  exitGuest: () => void;
  reset: () => void;
}

const NONCE_KEY = 'mntr_siws_nonce';
const REMEMBER_KEY = 'mntr_remember_wallet';
const WALLET_NAME_KEY = 'mntr_wallet_name';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      isAuthModalOpen: false,
      state: 'welcome',
      ctx: {},
      guestMode: false,
      
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      
      start: () => set({ state: 'wallet_select' }),
      
      onWalletConnected: (name, pubkey) => set({ 
        state: 'connected',
        ctx: { ...get().ctx, lastWalletName: name, connectedPubkey: pubkey }
      }),
      
      goToHandle: () => set({ state: 'handle' }),
      goToSiws: () => set({ state: 'siws' }),
      goToCreating: () => set({ state: 'creating_profile' }),
      goToDone: () => set({ state: 'done' }),
      goToError: (msg) => set({ state: 'error', ctx: { ...get().ctx, error: msg } }),
      
      setDraftHandle: (draftHandle) => set({ ctx: { ...get().ctx, draftHandle } }),
      setSiwsAbort: (siwsAbort) => set({ ctx: { ...get().ctx, siwsAbort } }),
      setRememberWallet: (remember) => {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, 'true');
          if (get().ctx.lastWalletName) {
            localStorage.setItem(WALLET_NAME_KEY, get().ctx.lastWalletName!);
          }
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(WALLET_NAME_KEY);
        }
        set({ ctx: { ...get().ctx, rememberWallet: remember } });
      },
      
      resetFlow: async (hard = false) => {
        const ctx = get().ctx;
        
        // Abort SIWS si está en curso
        if (ctx.siwsAbort) {
          ctx.siwsAbort.abort();
        }
        
        // Limpiar nonce y draft
        localStorage.removeItem(NONCE_KEY);
        
        // Reset context
        set({ 
          state: 'wallet_select',
          ctx: { 
            lastWalletName: ctx.lastWalletName,
            rememberWallet: ctx.rememberWallet,
          }
        });
      },
      
      closeModal: async () => {
        await get().resetFlow(true);
        set({ isAuthModalOpen: false, state: 'welcome' });
      },
      
      openAuthModal: () => set({ isAuthModalOpen: true, state: 'wallet_select' }),
      
      enterGuest: () => set({ guestMode: true, isAuthModalOpen: false }),
      exitGuest: () => set({ guestMode: false }),
      
      reset: () => {
        localStorage.removeItem(NONCE_KEY);
        set({ 
          session: null, 
          profile: null, 
          isAuthModalOpen: false,
          state: 'welcome',
          ctx: {},
          guestMode: false,
        });
      },
    }),
    {
      name: 'minotaurion-auth',
      partialize: (state) => ({ 
        guestMode: state.guestMode,
      }),
    }
  )
);

