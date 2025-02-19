import React, { useState } from 'react';
import { auth, useAuth } from '../lib/auth-service';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { usePersonalizationStore } from '../store/personalization';

type AuthMode = 'signin' | 'signup';

interface AuthDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AuthDialog({ isOpen = true, onClose }: AuthDialogProps) {
  const { loading, error: authError } = useAuth();
  const { init: initPersonalization } = usePersonalizationStore();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'signin') {
        await auth.signIn(email, password);
        await initPersonalization();
        onClose?.();
      } else {
        await auth.signUp(email, password);
        await initPersonalization();
        setVerificationSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative bg-card rounded-lg shadow-lg max-w-sm w-full p-6">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {verificationSent ? (
          <>
            <h2 className="text-2xl font-semibold mb-4">Check Your Email</h2>
            <p className="text-muted-foreground mb-4">
              We've sent a verification link to your email address. Please click the link to verify your account.
            </p>
            <button
              onClick={() => {
                setVerificationSent(false);
                onClose?.();
              }}
              className="w-full px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              {(error || authError) && (
                <div className="text-sm text-destructive">
                  {error || authError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Spinner className="h-5 w-5 mx-auto" />
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'signin' ? (
                  "Don't have an account? Sign up"
                ) : (
                  'Already have an account? Sign in'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}