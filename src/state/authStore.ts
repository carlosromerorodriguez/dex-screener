/**
 * Auth Store - Zustand store para gestión de autenticación en MINOTAURION ⚡
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/supabase';

type AuthFlow = 'idle' | 'wallet_select' | 'handle' | 'signing' | 'creating_profile' | 'done' | 'error';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isAuthModalOpen: boolean;
  authFlow: AuthFlow;
  guestMode: boolean;
  lastWalletName: string | null;
  
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthFlow: (flow: AuthFlow) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  enterGuest: () => void;
  exitGuest: () => void;
  setLastWallet: (name: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      isAuthModalOpen: false,
      authFlow: 'idle',
      guestMode: false,
      lastWalletName: null,
      
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setAuthFlow: (authFlow) => set({ authFlow }),
      openAuthModal: () => set({ isAuthModalOpen: true, authFlow: 'wallet_select' }),
      closeAuthModal: () => set({ isAuthModalOpen: false, authFlow: 'idle' }),
      
      enterGuest: () => set({ guestMode: true, isAuthModalOpen: false }),
      exitGuest: () => set({ guestMode: false }),
      
      setLastWallet: (lastWalletName) => set({ lastWalletName }),
      
      reset: () => set({ 
        session: null, 
        profile: null, 
        isAuthModalOpen: false,
        authFlow: 'idle',
        guestMode: false,
      }),
    }),
    {
      name: 'minotaurion-auth',
      partialize: (state) => ({ 
        guestMode: state.guestMode,
        lastWalletName: state.lastWalletName,
      }),
    }
  )
);

