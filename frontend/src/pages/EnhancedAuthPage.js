import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import AvatarPicker from '@/components/AvatarPicker';
import UsernameInput from '@/components/UsernameInput';
import TermsModal from '@/components/TermsModal';
import { DEFAULT_AVATAR } from '@/constants/avatars';

const EnhancedAuthPage = ({ forcedMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout, setTokenFromStorage } = useAuth();
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
        toast.error('This account is not authorized for this portal. Please use the Partner or Admin portal.');
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      navigate(user.onboarding_complete ? '/app/dashboard' : '/onboarding');
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          data-testid="back-button"
          variant="ghost"
          className="mb-6 min-h-11 hover:bg-white/5 rounded-full"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
        
        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 sm:p-8">
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
              <div className="mb-3 text-center text-xs text-muted-foreground">{signupStep}/4</div>
              <div className="mb-4 flex items-center justify-center gap-2">
                {signupProgress.map((item) => (
                  <span
                    key={item}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      signupStep >= item ? 'w-6 bg-primary' : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {signupSuccess ? (
                  <motion.div
                    key="signup-success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    className="rounded-2xl border border-white/10 bg-secondary/30 p-6 text-center"
                  >
                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
                    <h3 className="text-2xl font-heading font-bold">Welcome to Lynkr.</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Setting up your onboarding experience...</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your Lynkr app and Lynkr mailbox now use the same signup password.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key={`signup-step-${signupStep}`}
                    data-testid="signup-form"
                    onSubmit={handleSignup}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-4"
                  >
                    {signupStep === 1 ? (
                      <div className="space-y-4">
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
                          <Label htmlFor="signup-password" className="text-sm font-medium mb-2 block">Password</Label>
                          <Input
                            id="signup-password"
                            data-testid="signup-password-input"
                            type="password"
                            placeholder="At least 8 characters"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            required
                            className="bg-secondary/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-12 px-4 text-base"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Use at least 8 characters. This same password will also be used for your Lynkr mailbox login.
                          </p>
                        </div>
                        <Button
                          type="button"
                          disabled={!signupForm.email.trim() || signupForm.password.trim().length < 8 || sendingOtp}
                          className="w-full min-h-11 mt-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary disabled:opacity-60"
                          onClick={handleSendOtpAndContinue}
                        >
                          {sendingOtp ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Sending code...
                            </>
                          ) : (
                            'Send verification code'
                          )}
                        </Button>
                      </div>
                    ) : null}

                    {signupStep === 2 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                          We sent a 6-digit code to <strong className="text-foreground">{signupForm.email}</strong> from admin@lynkr.club. Enter it below.
                        </p>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={signupForm.signup_otp}
                            onChange={(v) => setSignupForm({ ...signupForm, signup_otp: v })}
                          >
                            <InputOTPGroup className="gap-2">
                              {[0, 1, 2, 3, 4, 5].map((i) => (
                                <InputOTPSlot key={i} index={i} className="rounded-lg border-white/20 h-12 w-12 text-lg" />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => setSignupStep(1)}>
                            Back
                          </Button>
                          <Button
                            type="button"
                            className="min-h-11 rounded-full"
                            disabled={signupForm.signup_otp.replace(/\s/g, '').length !== 6}
                            onClick={() => setSignupStep(3)}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {signupStep === 3 ? (
                      <div className="space-y-4">
                        <UsernameInput
                          value={signupForm.username}
                          onChange={(username) => setSignupForm({ ...signupForm, username })}
                          onValidityChange={setUsernameValid}
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => setSignupStep(2)}>
                            Back
                          </Button>
                          <Button
                            type="button"
                            className="min-h-11 rounded-full"
                            disabled={!usernameValid}
                            onClick={() => setSignupStep(4)}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {signupStep === 4 ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Choose your avatar</Label>
                          <AvatarPicker
                            value={signupForm.avatar}
                            onChange={(avatar) => setSignupForm({ ...signupForm, avatar })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="full-name" className="text-sm font-medium mb-2 block">Name (optional)</Label>
                          <Input
                            id="full-name"
                            data-testid="full-name-input"
                            type="text"
                            placeholder="Your name"
                            value={signupForm.full_name}
                            onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
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
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            To continue, you must read and accept the Terms and Conditions.
                          </p>
                          {signupForm.terms_accepted ? (
                            <p className="text-sm text-primary font-medium flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">✓</span>
                              Terms and Conditions accepted
                            </p>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full min-h-11 rounded-xl text-primary border-primary/30 hover:bg-primary/10"
                              onClick={() => setTermsModalOpen(true)}
                            >
                              View Terms and Conditions
                            </Button>
                          )}
                        </div>
                        <TermsModal
                          open={termsModalOpen}
                          onOpenChange={setTermsModalOpen}
                          onAccept={() => setSignupForm((prev) => ({ ...prev, terms_accepted: true }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => setSignupStep(3)}>
                            Back
                          </Button>
                          <Button
                            data-testid="signup-submit-button"
                            type="submit"
                            disabled={loading || !usernameValid || !signupForm.avatar || !signupForm.terms_accepted}
                            className="min-h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Account'
                            )}
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </motion.form>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthPage;