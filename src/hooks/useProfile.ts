/**
 * useProfile - Hook para gestionar perfil de usuario en MINOTAURION ⚡
 * 
 * Características:
 * - Auto-fetch del perfil
 * - Cache local
 * - Real-time updates
 * - Optimistic updates
 */

import { useState, useEffect } from 'react';
import { supabase, type UserProfile } from '../lib/supabase.ts';
import { logger } from '../lib/logger.ts';
import { useSession } from './useSession.ts';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkHandleAvailability: (handle: string) => Promise<boolean>;
  suggestHandles: (base: string) => Promise<string[]>;
}

/**
 * Hook para gestionar el perfil del usuario autenticado
 * 
 * @example
 * function ProfileCard() {
 *   const { profile, loading, updateProfile } = useProfile();
 *   
 *   if (loading) return <Spinner />;
 *   if (!profile) return <CreateProfile />;
 *   
 *   return (
 *     <div>
 *       <h1>{profile.username}</h1>
 *       <p>Level {profile.level} - {profile.total_xp} XP</p>
 *     </div>
 *   );
 * }
 */
export function useProfile(): UseProfileReturn {
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch del perfil del usuario
   */
  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const userProfile = await supabase.getProfile(userId);
      setProfile(userProfile);

      if (userProfile) {
        logger.debug('Profile loaded', { userId });
      } else {
        logger.info('No profile found for user', { userId });
      }
    } catch (err) {
      logger.error('Failed to fetch profile', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza el perfil del usuario
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile found');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      setProfile({ ...profile, ...updates });

      const updatedProfile = await supabase.upsertProfile({
        id: user.id,
        ...updates,
      });

      setProfile(updatedProfile);
      logger.info('Profile updated successfully');
    } catch (err) {
      // Revert optimistic update on error
      logger.error('Failed to update profile', err);
      setError(err as Error);
      
      // Refetch to get correct state
      if (user) {
        await fetchProfile(user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh manual del perfil
   */
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    if (!supabase.isConfigured()) {
      setLoading(false);
      return;
    }

    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id]);

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!supabase.isConfigured() || !user?.id) {
      return;
    }

    const subscription = supabase.subscribeToProfiles((payload) => {
      if (payload.new && payload.new.id === user.id) {
        logger.debug('Profile updated via real-time', payload.new);
        setProfile(payload.new as UserProfile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  /**
   * Verifica si un handle está disponible
   */
  const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.getClient()
        .from('profiles')
        .select('id')
        .eq('username', handle)
        .maybeSingle();

      if (error) throw error;
      return !data; // Disponible si no existe
    } catch (err) {
      logger.error('Failed to check handle availability', err);
      return false;
    }
  };

  /**
   * Sugiere handles alternativos
   */
  const suggestHandles = async (base: string): Promise<string[]> => {
    const suggestions = [
      base,
      `${base}_${Math.floor(Math.random() * 100)}`,
      `${base}_x`,
      `${base}_${new Date().getFullYear()}`,
    ];

    const available: string[] = [];
    for (const suggestion of suggestions) {
      const isAvailable = await checkHandleAvailability(suggestion);
      if (isAvailable) {
        available.push(suggestion);
      }
    }

    return available.slice(0, 3);
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    checkHandleAvailability,
    suggestHandles,
  };
}

export default useProfile;

