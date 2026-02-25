import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/utils/api';

const EnhancedAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setTokenFromStorage } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    dob: '',
    gender: 'prefer_not_to_say',
    role: 'USER'
  });

  const getRequestErrorMessage = (error, fallback) => {
    if (error?.code === 'ECONNABORTED') {
      return 'Request timed out. Please ensure backend is running on localhost:8000.';
    }
    if (error?.code === 'ERR_NETWORK') {
      return 'Network error. Please check backend server and CORS config.';
    }
    return error?.response?.data?.detail || fallback;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      
      if (user.role === 'USER') {
        navigate(user.onboarding_complete ? '/dashboard' : '/onboarding');
      } else if (user.role === 'PARTNER') {
        navigate('/partner-dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', signupForm);
      const { token, user } = response.data;
      
      setTokenFromStorage(token);
      toast.success('Account created! Please check your email to verify.');
      
      if (user.role === 'USER') {
        navigate('/onboarding');
      } else if (user.role === 'PARTNER') {
        navigate('/partner-signup');
      }
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button
          data-testid="back-button"
          variant="ghost"
          className="mb-8 hover:bg-white/5 rounded-full"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
        
        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-heading mb-2">Welcome to Lynkr</h1>
            <p className="text-muted-foreground">Start earning rewards automatically</p>
          </div>
          
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList data-testid="auth-tabs" className="grid w-full grid-cols-2 mb-6 bg-secondary/50 rounded-xl p-1">
              <TabsTrigger data-testid="login-tab" value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
              <TabsTrigger data-testid="signup-tab" value="signup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form data-testid="login-form" onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium mb-2 block">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium mb-2 block">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                <Button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form data-testid="signup-form" onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="full-name" className="text-sm font-medium mb-2 block">Full Name</Label>
                  <Input
                    id="full-name"
                    data-testid="full-name-input"
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.full_name}
                    onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-medium mb-2 block">Username</Label>
                  <Input
                    id="username"
                    data-testid="username-input"
                    type="text"
                    placeholder="yourname"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your Lynkr email will be {signupForm.username || 'username'}@lynkr.club</p>
                </div>
                
                <div>
                  <Label htmlFor="signup-email" className="text-sm font-medium mb-2 block">Email</Label>
                  <Input
                    id="signup-email"
                    data-testid="signup-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium mb-2 block">Phone</Label>
                  <Input
                    id="phone"
                    data-testid="phone-input"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob" className="text-sm font-medium mb-2 block">Date of Birth</Label>
                    <Input
                      id="dob"
                      data-testid="dob-input"
                      type="date"
                      value={signupForm.dob}
                      onChange={(e) => setSignupForm({ ...signupForm, dob: e.target.value })}
                      required
                      className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium mb-2 block">Gender</Label>
                    <select
                      id="gender"
                      data-testid="gender-select"
                      value={signupForm.gender}
                      onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}
                      className="w-full bg-secondary/50 border border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base text-foreground"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="text-sm font-medium mb-2 block">Password</Label>
                  <Input
                    id="signup-password"
                    data-testid="signup-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                    className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-sm font-medium mb-2 block">I am a</Label>
                  <select
                    id="role"
                    data-testid="role-select"
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                    className="w-full bg-secondary/50 border border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base text-foreground"
                  >
                    <option value="USER">User (Shopper)</option>
                    <option value="PARTNER">Partner (Brand)</option>
                  </select>
                </div>
                
                <Button
                  data-testid="signup-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthPage;