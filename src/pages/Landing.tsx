import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Zap, Shield, Globe, Inbox, CheckSquare, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth-service';
import { AuthDialog } from '../components/AuthDialog';

const features = [
  {
    name: 'AI-Powered Chat',
    description: 'Experience intelligent conversations with our advanced AI that understands context and learns from interactions.',
    icon: MessageSquare,
  },
  {
    name: 'Smart Integrations',
    description: 'Connect with your favorite tools and services for seamless workflow automation.',
    icon: Zap,
  },
  {
    name: 'Secure & Private',
    description: 'Enterprise-grade security with end-to-end encryption and strict privacy controls.',
    icon: Shield,
  },
  {
    name: 'Global Access',
    description: 'Access your conversations and tasks from anywhere, on any device.',
    icon: Globe,
  },
  {
    name: 'Unified Inbox',
    description: 'Manage all your communications in one place with our intelligent inbox.',
    icon: Inbox,
  },
  {
    name: 'Task Management',
    description: 'Turn conversations into actionable tasks and track progress effortlessly.',
    icon: CheckSquare,
  },
];

export default function Landing() {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-muted">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <Link to="/">
          </Link>
          {/* Navigation Items */}
          {user ? (
            <Link to="/chat" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Go to Chat</Link>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAuthDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-button-text rounded-lg hover:bg-secondary transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign in</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add padding to account for fixed header */}
      <div className="h-16"></div>
      
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <div className="flex justify-center lg:justify-start">
              <img src="/logo.png" alt="UltraChat" className="h-32 w-auto mb-8" />
            </div>
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <a href="#" className="inline-flex space-x-6">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/10">
                  What's new
                </span>
                <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-foreground">
                  <span>Just shipped v1.0</span>
                  <span aria-hidden="true">→</span>
                </span>
              </a>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Your AI-powered communication hub
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Experience the future of communication with UltraChat. Intelligent conversations, seamless integrations, and powerful task management - all in one place.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              {user ? (
                <Link
                  to="/chat"
                  className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-button-text shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Go to Chat
                </Link>
              ) : (
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-button-text shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Get started
                </button>
              )}
              <a href="#features" className="text-sm font-semibold leading-6 text-foreground">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <img
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2940&auto=format&fit=crop"
                alt="App screenshot"
                width={2432}
                height={1442}
                className="w-[76rem] rounded-md bg-muted/5 shadow-2xl ring-1 ring-muted/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            All-in-one communication platform
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            UltraChat combines the power of AI with essential communication tools to help you work smarter, not harder.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-foreground">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <feature.icon className="h-6 w-6 text-button-text" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-32 sm:mt-56">
        <div className="relative isolate overflow-hidden bg-primary px-6 py-24 text-center shadow-2xl sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-button-text sm:text-4xl">
            Start using UltraChat today
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-button-text/90">
            Join thousands of users who are already experiencing the future of communication.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {user ? (
              <Link
                to="/chat"
                className="rounded-md bg-button-text px-3.5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-button-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Go to Chat
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="rounded-md bg-button-text px-3.5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-button-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </button>
            )}
            <a href="#features" className="text-sm font-semibold leading-6 text-button-text">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
      />
    </div>
  );
}