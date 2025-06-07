'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const AuthGuard = ({ 
  children, 
  redirectTo = '/auth/login',
  fallback 
}: AuthGuardProps) => {
  const { user, loading, isAuthenticated } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

// Hook pour vérifier si l'utilisateur est connecté sans redirection
export const useAuthCheck = () => {
  const { user, loading, isAuthenticated } = useRequireAuth();
  
  return {
    user,
    loading,
    isAuthenticated,
  };
}; 