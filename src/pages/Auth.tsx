import React from 'react';
import { AuthDialog } from '../components/AuthDialog';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Ultra</h1>
          <p className="text-muted-foreground">
            Sign in to continue to your workspace
          </p>
        </div>
        
        <AuthDialog />
      </div>
    </div>
  );
}