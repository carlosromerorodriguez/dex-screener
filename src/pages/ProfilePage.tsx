/**
 * ProfilePage - Página de perfil de usuario
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', bio: '', avatar_url: '' });

  const isOwnProfile = !username || profile?.id === user?.id;

  useEffect(() => {
    loadProfile();
  }, [username, user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let prof: UserProfile | null = null;
      
      if (username) {
        // Load by username
        const { data } = await supabase.getClient()
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        prof = data;
      } else if (user) {
        // Load own profile
        prof = await supabase.getProfile(user.id);
      }

      setProfile(prof);
      if (prof) {
        setFormData({
          username: prof.username || '',
          bio: prof.bio || '',
          avatar_url: prof.avatar_url || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      await supabase.upsertProfile({ id: user.id, ...formData });
      setEditing(false);
      loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dex-blue"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-2xl text-dex-text-secondary">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Header */}
      <div className="bg-dex-bg-secondary rounded-lg p-6 mb-6 border border-dex-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-dex-accent flex items-center justify-center text-3xl font-bold text-black">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.username || 'Anonymous'}</h1>
              <p className="text-dex-text-secondary">
                Level {profile.level} • {profile.xp} XP
              </p>
            </div>
          </div>

          {isOwnProfile && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-dex-blue hover:bg-blue-600 px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-dex-bg-tertiary border border-dex-border rounded px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-dex-bg-tertiary border border-dex-border rounded px-4 py-2"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-dex-blue hover:bg-blue-600 px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-dex-bg-tertiary hover:bg-dex-bg-highlight px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-dex-text-secondary">{profile.bio || 'No bio yet.'}</p>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="bg-dex-bg-secondary rounded-lg p-6 border border-dex-border">
        <h2 className="text-xl font-bold mb-4">🏆 Badges</h2>
        <p className="text-dex-text-secondary">Badge system coming soon...</p>
      </div>
    </div>
  );
}

