import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, initialized } = useAuth();
  const location = useLocation();
  const publicPaths = ['/', '/auth'];

  // Don't guard public paths
  if (publicPaths.includes(location.pathname)) {
    // If user is logged in and trying to access public paths, redirect to chat
    if (initialized && user) {
      return <Navigate to="/chat" replace />;
    }
    return <>{children}</>;
  }

  // For private paths
  if (initialized && !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}