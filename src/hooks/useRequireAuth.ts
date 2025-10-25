/**
 * useRequireAuth - Hook para proteger rutas que requieren autenticación
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './useSession';
import { useAuthStore } from '../state/authStore';

export function useRequireAuth() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  useEffect(() => {
    if (!loading && !user) {
      openAuthModal();
      navigate('/');
    }
  }, [user, loading, navigate, openAuthModal]);

  return { user, loading };
}

