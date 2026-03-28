import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

const PartnerLoginPage = () => {
  const navigate = useNavigate();
  const { user, setTokenAndUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user?.role === 'USER') return <Navigate to="/app/home" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/app/admin" replace />;
  if (user?.role === 'PARTNER') return <Navigate to="/app/partner" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/partner/auth/login', { email, password });
      const { token, user: partnerUser } = response.data;
      setTokenAndUser(token, partnerUser);
      toast.success('Welcome back!');
      const target = partnerUser.must_change_password ? '/app/partner/first-login' : '/app/partner';
      setTimeout(() => navigate(target), 0);
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail === 'Invalid credentials'
        ? 'Invalid email or password.'
        : detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <header className="border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between min-h-[52px]">
          <button
            onClick={() => navigate('/partners')}
            className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] -ml-1 rounded-lg active:opacity-80"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-heading font-semibold text-sm sm:text-base truncate">Lynkr Partner</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-foreground">Partner login</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Sign in with your partner email and password</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="partner-email">Email</Label>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="partner-password">Password</Label>
                <Input
                  id="partner-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8">
            Not a partner?{' '}
            <a href="mailto:partners@lynkr.club?subject=Become a Partner" className="text-primary hover:underline">
              Apply to join
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PartnerLoginPage;
