import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-service';
import { initializeStores } from '../lib/store-initializer';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const publicPaths = ['/', '/auth'];

  // Initialize stores when auth state changes
  useEffect(() => {
    if (user && !loading) {
      initializeStores(user.id).catch(console.error);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Don't guard public paths
  if (publicPaths.includes(location.pathname)) {
    // If user is logged in and trying to access public paths, redirect to chat
    if (user) {
      return <Navigate to="/chat" replace />;
    }
    return <>{children}</>;
  }

  // For private paths
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}