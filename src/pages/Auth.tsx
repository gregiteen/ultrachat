import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThreadStore } from '../store/chat';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const { user, initialized, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect to chat if user is already logged in
    if (initialized && user) {
      navigate('/chat');
    }
  }, [user, initialized, navigate]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/chat');
      } else {
        await signUp(email, password);
        setError('Please check your email for verification link');
      } 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="https://imgur.com/EJ0T2co.png" alt="UltraChat" className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-primary hover:text-secondary transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-muted/5 py-8 px-4 shadow-xl ring-1 ring-muted/10 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
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
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-button-text shadow-sm hover:bg-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                {isLogin ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}