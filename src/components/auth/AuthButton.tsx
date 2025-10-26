/**
 * AuthButton - Botón de autenticación en la topbar
 */

import React, { useState } from 'react';
import { useSession } from '../../hooks/useSession.ts';
import { useAuthStore } from '../../state/authStore.ts';
import ProfileMenu from './ProfileMenu.tsx';

export default function AuthButton() {
  const { user } = useSession();
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <button
        onClick={openAuthModal}
        className="bg-dex-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition-colors"
      >
        Sign In
      </button>
    );
  }

  const initial = user.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-dex-accent hover:bg-yellow-600 flex items-center justify-center font-bold text-black transition-colors"
      >
        {initial}
      </button>

      {showMenu && <ProfileMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
}

