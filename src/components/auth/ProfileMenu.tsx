/**
 * ProfileMenu - Dropdown menu para usuario autenticado
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

interface ProfileMenuProps {
  onClose: () => void;
}

export default function ProfileMenu({ onClose }: ProfileMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 w-48 bg-dex-bg-secondary border border-dex-border rounded-lg shadow-xl py-2 z-50"
    >
      <button
        onClick={() => handleNavigation('/me')}
        className="w-full text-left px-4 py-2 hover:bg-dex-bg-highlight transition-colors"
      >
        👤 Profile
      </button>
      <button
        onClick={() => handleNavigation('/me')}
        className="w-full text-left px-4 py-2 hover:bg-dex-bg-highlight transition-colors"
      >
        🏆 My Badges
      </button>
      <div className="border-t border-dex-border my-2"></div>
      <button
        onClick={handleSignOut}
        className="w-full text-left px-4 py-2 hover:bg-red-900/20 text-red-400 transition-colors"
      >
        🚪 Sign Out
      </button>
    </div>
  );
}

