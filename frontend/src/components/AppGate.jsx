import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BrandLoader from '@/components/BrandLoader';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { LogIn } from 'lucide-react';

/**
 * Gate for /app: shows loading until auth is resolved, then either login/signup prompt
 * (when not authenticated) or children (AppLayout). No artificial delay so direct URL
 * access always shows loading or content, never a blank screen.
 */
const AppGate = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true" role="status" aria-label="Checking session">
        <BrandLoader label="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">
          <button
            onClick={() => navigate('/')}
            className="mb-8 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
            aria-label="Lynkr home"
          >
            <Logo className="h-10 w-32" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground mb-2">
            Log in to the app
          </h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Sign in to access your dashboard, rewards, and purchases.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button
              className="w-full min-h-[48px] rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
              onClick={() => navigate('/app/login', { state: { from: '/app/home' } })}
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log in
            </Button>
            <Button
              variant="outline"
              className="w-full min-h-[48px] rounded-xl border-white/15 bg-white/5 hover:bg-white/10 touch-manipulation"
              onClick={() => navigate('/app/signup', { state: { from: '/app/home' } })}
            >
              Create account
            </Button>
          </div>
          <a
            href="/"
            className="mt-6 text-sm text-muted-foreground hover:text-foreground min-h-[44px] inline-flex items-center touch-manipulation"
          >
            ← Back to website
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AppGate;
