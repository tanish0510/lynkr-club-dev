import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const PartnerLoginPage = () => {
  const navigate = useNavigate();
  const { user, setTokenFromStorage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  if (user?.role === 'USER') return <Navigate to="/app/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'PARTNER') return <Navigate to="/partner/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/partner/auth/login', loginForm);
      const { token, user } = response.data;
      setTokenFromStorage(token);
      toast.success('Welcome back!');
      if (user.must_change_password) {
        navigate('/partner-first-login');
      } else {
        navigate('/partner/dashboard');
      }
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail === 'Invalid credentials'
        ? 'Invalid email or password. Use your partner account credentials.'
        : detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <header className="border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between min-h-[52px]">
          <button
            onClick={() => navigate('/partner')}
            className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] -ml-1 rounded-lg active:opacity-80 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary shrink-0" />
            <span className="font-heading font-semibold text-sm sm:text-base truncate">Lynkr Partner</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-foreground">Partner login</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Sign in with your partner email and password</p>
          </div>

          <div className="bg-card rounded-2xl border border-white/5 p-4 sm:p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="partner-email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="partner-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="partner@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="mt-1.5 rounded-xl min-h-[48px] sm:h-11 bg-secondary/50 border-white/10 text-base"
                />
              </div>
              <div>
                <Label htmlFor="partner-password" className="text-sm sm:text-base">Password</Label>
                <Input
                  id="partner-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  className="mt-1.5 rounded-xl min-h-[48px] sm:h-11 bg-secondary/50 border-white/10 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] sm:min-h-11 rounded-xl font-medium touch-manipulation"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8">
            Not a partner?{' '}
            <a href="mailto:partners@lynkr.club?subject=Become a Partner" className="text-primary hover:underline min-h-[44px] inline-flex items-center touch-manipulation">
              Apply to join
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PartnerLoginPage;
