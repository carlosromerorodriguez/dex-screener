/**
 * Supabase Client - Cliente para autenticación y base de datos en MINOTAURION ⚡
 * 
 * Características:
 * - Autenticación (wallet + email/password)
 * - Perfiles de usuario
 * - Badges y achievements
 * - Real-time subscriptions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserProfile {
  id: string;
  wallet_address?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  total_xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  criteria: any;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      badges: {
        Row: Badge;
        Insert: Omit<Badge, 'id' | 'created_at'>;
        Update: Partial<Omit<Badge, 'id' | 'created_at'>>;
      };
      user_badges: {
        Row: UserBadge;
        Insert: Omit<UserBadge, 'id' | 'earned_at'>;
        Update: never;
      };
    };
  };
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

class SupabaseService {
  private client: SupabaseClient<Database> | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el cliente de Supabase
   */
  private initialize(): void {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase credentials not configured. Auth features disabled.');
      this.initialized = false;
      return;
    }

    try {
      this.client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });

      this.initialized = true;
      logger.info('Supabase client initialized');
    } catch (error) {
      logger.error('Failed to initialize Supabase', error);
      this.initialized = false;
    }
  }

  /**
   * Verifica si Supabase está configurado
   */
  isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Obtiene el cliente de Supabase
   * Lanza error si no está configurado
   */
  getClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return this.client;
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Sign in con email y password
   */
  async signInWithEmail(email: string, password: string) {
    const client = this.getClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Sign in failed', error);
      throw error;
    }

    logger.info('User signed in successfully');
    return data;
  }

  /**
   * Sign up con email y password
   */
  async signUpWithEmail(email: string, password: string, username?: string) {
    const client = this.getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      logger.error('Sign up failed', error);
      throw error;
    }

    logger.info('User signed up successfully');
    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    const client = this.getClient();
    const { error } = await client.auth.signOut();

    if (error) {
      logger.error('Sign out failed', error);
      throw error;
    }

    logger.info('User signed out');
  }

  /**
   * Obtiene la sesión actual
   */
  async getSession() {
    const client = this.getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      logger.error('Failed to get session', error);
      return null;
    }

    return data.session;
  }

  /**
   * Obtiene el usuario actual
   */
  async getUser() {
    const client = this.getClient();
    const { data, error } = await client.auth.getUser();

    if (error) {
      logger.error('Failed to get user', error);
      return null;
    }

    return data.user;
  }

  /**
   * Subscribe a cambios de autenticación
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = this.getClient();
    return client.auth.onAuthStateChange(callback);
  }

  // ==========================================================================
  // PROFILES
  // ==========================================================================

  /**
   * Obtiene el perfil de un usuario
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to get profile', error);
      return null;
    }

    return data;
  }

  /**
   * Crea o actualiza un perfil
   */
  async upsertProfile(profile: Partial<UserProfile> & { id: string }) {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) {
      logger.error('Failed to upsert profile', error);
      throw error;
    }

    logger.info('Profile updated');
    return data;
  }

  /**
   * Busca perfiles por username
   */
  async searchProfiles(query: string, limit: number = 10): Promise<UserProfile[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) {
      logger.error('Failed to search profiles', error);
      return [];
    }

    return data || [];
  }

  // ==========================================================================
  // BADGES & ACHIEVEMENTS
  // ==========================================================================

  /**
   * Obtiene todos los badges disponibles
   */
  async getAllBadges(): Promise<Badge[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('badges')
      .select('*')
      .order('rarity', { ascending: false });

    if (error) {
      logger.error('Failed to get badges', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtiene los badges de un usuario
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      logger.error('Failed to get user badges', error);
      return [];
    }

    return data || [];
  }

  /**
   * Otorga un badge a un usuario
   */
  async awardBadge(userId: string, badgeId: string) {
    const client = this.getClient();
    const { data, error } = await client
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badgeId })
      .select()
      .single();

    if (error) {
      logger.error('Failed to award badge', error);
      throw error;
    }

    logger.info(`Badge ${badgeId} awarded to user ${userId}`);
    return data;
  }

  // ==========================================================================
  // REAL-TIME
  // ==========================================================================

  /**
   * Subscribe a cambios en perfiles
   */
  subscribeToProfiles(callback: (payload: any) => void) {
    const client = this.getClient();
    return client
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
      .subscribe();
  }

  /**
   * Subscribe a nuevos badges otorgados
   */
  subscribeToUserBadges(userId: string, callback: (payload: any) => void) {
    const client = this.getClient();
    return client
      .channel(`user-badges-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_badges', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const supabase = new SupabaseService();

export default SupabaseService;

