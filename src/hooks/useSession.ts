/**
 * useSession - Hook para gestionar sesión de usuario en MINOTAURION ⚡
 * 
 * SEMANA 2: Extendido con signIn y refreshProfile
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { logger } from '../lib/logger.ts';
import { useAuthStore } from '../state/authStore.ts';
import type { Session, User } from '@supabase/supabase-js';

interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook para gestionar la sesión de usuario
 * 
 * @example
 * function MyComponent() {
 *   const { session, user, loading, signOut } = useSession();
 *   
 *   if (loading) return <Spinner />;
 *   if (!user) return <Login />;
 *   
 *   return <div>Welcome {user.email}</div>;
 * }
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Solo inicializar si Supabase está configurado
    if (!supabase.isConfigured()) {
      logger.warn('Supabase not configured, useSession disabled');
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    const initializeSession = async () => {
      try {
        const currentSession = await supabase.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (err) {
        logger.error('Failed to get initial session', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Suscribirse a cambios de auth
    const { data } = supabase.onAuthStateChange((event, newSession) => {
      logger.debug(`Auth state changed: ${event}`, { session: newSession });
      
      setSession(newSession);
      setUser(newSession?.user || null);

      // Eventos específicos
      if (event === 'SIGNED_IN') {
        logger.info('User signed in', { userId: newSession?.user?.id });
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.debug('Token refreshed');
      } else if (event === 'USER_UPDATED') {
        logger.info('User updated');
      }
    });

    // Cleanup
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in con email y password
   */
  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabase.signInWithEmail(email, password);
      logger.info('User signed in successfully');
    } catch (err) {
      logger.error('Sign in failed', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up con email y password
   */
  const handleSignUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);
      setError(null);
      await supabase.signUpWithEmail(email, password, username);
      logger.info('User signed up successfully');
    } catch (err) {
      logger.error('Sign up failed', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out del usuario actual
   */
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.signOut();
      setSession(null);
      setUser(null);
      useAuthStore.getState().reset();
    } catch (err) {
      logger.error('Sign out failed', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh manual de la sesión
   */
  const refreshSession = async () => {
    try {
      setLoading(true);
      const currentSession = await supabase.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
    } catch (err) {
      logger.error('Session refresh failed', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh del perfil del usuario
   */
  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profile = await supabase.getProfile(user.id);
      useAuthStore.getState().setProfile(profile);
    } catch (err) {
      logger.error('Profile refresh failed', err);
    }
  };

  return {
    session,
    user,
    loading,
    error,
    signInWithEmail: handleSignIn,
    signUpWithEmail: handleSignUp,
    signOut: handleSignOut,
    refreshSession,
    refreshProfile,
  };
}

export default useSession;

