/**
 * Auth Store - Zustand store para gestión de autenticación en MINOTAURION ⚡
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isAuthModalOpen: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isAuthModalOpen: false,
  
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  
  reset: () => set({ 
    session: null, 
    profile: null, 
    isAuthModalOpen: false 
  }),
}));

