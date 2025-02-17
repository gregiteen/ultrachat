import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { X } from 'lucide-react';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function AuthDialog({ isOpen, onClose, anchorRef }: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Get position for the dialog
  const getPosition = () => {
    if (!anchorRef.current) return {};
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="fixed z-50 w-96 bg-background border border-muted rounded-lg shadow-lg p-4"
        style={getPosition()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Sign in</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-button-text shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-primary hover:text-secondary transition-colors"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </>
  );
}