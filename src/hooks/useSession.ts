/**
 * useSession - Hook para gestionar sesión de usuario en MINOTAURION ⚡
 * 
 * Características:
 * - Auto-refresh de sesión
 * - Estado de loading
 * - Sincronización con localStorage
 * - Type-safe
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Session, User } from '@supabase/supabase-js';

interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
   * Sign out del usuario actual
   */
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.signOut();
      setSession(null);
      setUser(null);
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

  return {
    session,
    user,
    loading,
    error,
    signOut: handleSignOut,
    refreshSession,
  };
}

export default useSession;

