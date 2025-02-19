import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThreadStore } from '../store/chat';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [localError, setLocalError] = useState('');
  const { user, initialized, loading, loadingType, error, signUp, signIn } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect to chat if user is already logged in
    if (initialized && user) {
      navigate('/chat');
    }
  }, [user, initialized, navigate]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
          {loadingType === 'init' && <p className="text-sm text-muted-foreground">Initializing...</p>}
          {loadingType === 'signin' && <p className="text-sm text-muted-foreground">Signing in...</p>}
          {loadingType === 'signup' && <p className="text-sm text-muted-foreground">Creating account...</p>}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        setLocalError('Please check your email for verification link');
        navigate('/');
        return;
      } else {
        await signIn(email, password);
        navigate('/chat');
        return;
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.png" alt="UltraChat" className="mx-auto h-24 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 font-medium text-primary hover:text-secondary transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-muted/5 py-8 px-4 shadow-xl ring-1 ring-muted/10 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(localError || error) && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 space-y-2">
                {localError && <p>{localError}</p>}
                {error && <p>{error}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-muted bg-input-background text-foreground px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-muted bg-input-background text-foreground px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-button-text shadow-sm hover:bg-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                {loading && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                <span className={loading ? 'invisible' : ''}>{isSignUp ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}