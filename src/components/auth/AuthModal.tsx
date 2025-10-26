/**
 * AuthModal - Modal de autenticación para MINOTAURION ⚡
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../state/authStore.ts';
import { useSession } from '../../hooks/useSession.ts';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const { signInWithEmail, signUpWithEmail } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, username);
      }
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dex-bg-secondary rounded-lg max-w-md w-full p-6 border border-dex-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-dex-text-secondary hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded ${
              mode === 'signin'
                ? 'bg-dex-blue text-white'
                : 'bg-dex-bg-tertiary text-dex-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded ${
              mode === 'signup'
                ? 'bg-dex-blue text-white'
                : 'bg-dex-bg-tertiary text-dex-text-secondary'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dex-bg-tertiary border border-dex-border rounded px-4 py-2 focus:outline-none focus:border-dex-blue"
                required={mode === 'signup'}
                minLength={3}
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dex-bg-tertiary border border-dex-border rounded px-4 py-2 focus:outline-none focus:border-dex-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dex-bg-tertiary border border-dex-border rounded px-4 py-2 focus:outline-none focus:border-dex-blue"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dex-blue hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded transition-colors"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-dex-text-secondary mt-4">
          Only the Brave Trade Here ⚡
        </p>
      </div>
    </div>
  );
}

