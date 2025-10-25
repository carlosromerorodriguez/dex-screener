/**
 * ProtectedRoute - Wrapper para rutas que requieren autenticación
 */

import React from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dex-blue"></div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

