import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Loader2, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import AvatarPicker from '@/components/AvatarPicker';
import UsernameInput from '@/components/UsernameInput';
import TermsModal from '@/components/TermsModal';
import { DEFAULT_AVATAR } from '@/constants/avatars';
import ThemeToggle from '@/components/ui/ThemeToggle';

const EnhancedAuthPage = ({ forcedMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from || '/app/home';
  const { login, logout, setTokenFromStorage } = useAuth();

  /** Role-based default redirect; never send user to another role's area. */
  const getRedirectForRole = (role) => {
    if (role === 'USER') return '/app/home';
    if (role === 'PARTNER') return '/app/partner';
    if (role === 'ADMIN') return '/app/admin';
    return '/app/home';
  };
  /** Only use `from` if it belongs to the given role (avoids sending USER to /app/partner after login). */
  const getAllowedRedirect = (role, preferredFrom) => {
    const defaultPath = getRedirectForRole(role);
    if (!preferredFrom || preferredFrom === '/') return defaultPath;
    if (role === 'USER' && (preferredFrom.startsWith('/app/partner') || preferredFrom.startsWith('/app/admin'))) return defaultPath;
    if (role === 'PARTNER' && !preferredFrom.startsWith('/app/partner')) return defaultPath;
    if (role === 'ADMIN' && !preferredFrom.startsWith('/app/admin')) return defaultPath;
    return preferredFrom;
  };
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const requestedMode = searchParams.get('mode');
  const defaultTab = forcedMode || (requestedMode === 'signup' ? 'signup' : 'login');
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    username: '',
    avatar: DEFAULT_AVATAR,
    email: '',
    password: '',
    full_name: '',
    phone: '',
    dob: '',
    gender: 'prefer_not_to_say',
    role: 'USER',
    terms_accepted: false,
    signup_otp: '',
    referral_code: new URLSearchParams(window.location.search).get('ref') || '',
  });
  const [usernameValid, setUsernameValid] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

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
      if (user.role !== 'USER') {
        logout();
        toast.error('This account is not authorized for this portal.');
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      const target = user.onboarding_complete ? getAllowedRedirect(user.role, from) : '/onboarding';
      // Defer navigation so auth context state is committed before ProtectedRoute runs (avoids wrong-role redirect).
      setTimeout(() => navigate(target), 0);
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
      const payload = {
        username: signupForm.username,
        avatar: signupForm.avatar,
        email: signupForm.email,
        password: signupForm.password,
        full_name: signupForm.full_name || signupForm.username,
        phone: signupForm.phone || '0000000000',
        dob: signupForm.dob || '2000-01-01',
        gender: signupForm.gender || 'prefer_not_to_say',
        role: signupForm.role || 'USER',
        terms_accepted: signupForm.terms_accepted,
        signup_otp: signupForm.signup_otp.replace(/\s/g, ''),
        referral_code: signupForm.referral_code.trim() || undefined,
      };
      const response = await api.post('/auth/signup', payload);
      const { token, user } = response.data;
      
      setTokenFromStorage(token);
      localStorage.setItem('hasSeenWelcome', '1');
      localStorage.setItem('hasSeenIntro', '1');
      localStorage.removeItem('hasCompletedTour');
      setSignupSuccess(true);
      toast.success('Account created!');
      if (user.role === 'USER') {
        setTimeout(() => navigate('/onboarding'), 900);
      } else if (user.role === 'PARTNER') {
        navigate('/partner-signup');
      } else if (user.role === 'ADMIN') {
        navigate('/app/admin');
      } else {
        setTimeout(() => navigate(getRedirectForRole(user.role)), 900);
      }
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const signupProgress = useMemo(() => [1, 2, 3, 4], []);

  const handleSendOtpAndContinue = async () => {
    if (!signupForm.email.trim() || signupForm.password.trim().length < 8) return;
    setSendingOtp(true);
    try {
      await api.post('/auth/send-signup-otp', { email: signupForm.email.trim() });
      toast.success('Verification code sent to your email');
      setSignupStep(2);
    } catch (error) {
      toast.error(getRequestErrorMessage(error, 'Could not send code'));
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>
      <div className="w-full max-w-md">
        <Button
          data-testid="back-button"
          variant="ghost"
          className="mb-6 min-h-11 hover:bg-muted rounded-full"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
        
        <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-2">Welcome to Lynkr</h1>
            <p className="text-muted-foreground">Start earning rewards automatically</p>
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={(next) => {
              setActiveTab(next);
              if (next === 'signup') {
                setSignupStep(1);
                setSignupSuccess(false);
              }
            }}
            className="w-full"
          >
            {!forcedMode ? (
              <TabsList data-testid="auth-tabs" className="grid w-full grid-cols-2 mb-6 bg-secondary/50 rounded-xl p-1">
                <TabsTrigger
                  data-testid="login-tab"
                  value="login"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  data-testid="signup-tab"
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            ) : null}
            
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
                    className="bg-secondary/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
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
                    className="bg-secondary/50 border-border focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                  />
                </div>
                <Button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
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
              <div className="rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  Pilot launching soon!
                </h2>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                  We&apos;re not accepting new signups right now. Join the waitlist and we&apos;ll notify you when we launch.
                </p>
                <Button
                  type="button"
                  className="mt-6 min-h-12 rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={() => navigate('/?openWaitlist=1')}
                >
                  Join the waitlist
                </Button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Already have an account? Switch to the <button type="button" className="underline text-foreground" onClick={() => setActiveTab('login')}>Login</button> tab.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthPage;