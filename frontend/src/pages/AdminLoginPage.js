import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'ADMIN') {
        logout();
        toast.error('This account is not authorized for this portal. Please use the User or Partner portal.');
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      setTimeout(() => navigate('/app/admin'), 0);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-center text-foreground">Admin login</h1>
        <p className="text-muted-foreground text-center mt-2 mb-8">Sign in with your admin credentials</p>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1.5 rounded-xl h-11 bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="mt-1.5 rounded-xl h-11 bg-secondary/50 border-border"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full min-h-11 rounded-xl font-medium">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <button type="button" onClick={() => navigate('/')} className="hover:text-foreground">
            Back to home
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
