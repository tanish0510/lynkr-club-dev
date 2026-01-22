import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Users, TrendingUp, Award, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const PartnerProgramPage = () => {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handlePartnerLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/partner-auth-callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/partner/auth/login', loginForm);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      toast.success('Welcome back!');
      
      // Check if password change required
      if (user.must_change_password) {
        navigate('/partner-first-login');
      } else {
        navigate('/partner-dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr Partner Program</div>
          <Button
            data-testid="partner-login-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-3 font-bold"
            onClick={handlePartnerLogin}
          >
            Partner Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="text-sm font-medium tracking-wide uppercase text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-white/10">
              For Businesses
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none font-heading mb-6">
            Partner with Lynkr
            <br />
            <span className="text-primary">Grow Your Business</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Join India's premium mailbox-first rewards platform. Connect with verified customers who love your brand. No ads, no tracking, just real, verified purchases.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              data-testid="hero-partner-login"
              onClick={handlePartnerLogin}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 rounded-full px-8 py-6 text-lg font-bold glow-primary"
            >
              Login with Google
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-6 py-6 text-base font-medium border border-white/10 hover:border-white/20"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Partner Program Inquiry'}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold font-heading text-center mb-16">Why Partner with Lynkr?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div data-testid="benefit-verified" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Shield className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Verified Customers Only</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every purchase is verified through email confirmations. No fake orders, no fraud, just real customers shopping with their Lynkr email.
              </p>
            </div>
            
            <div data-testid="benefit-dashboard" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <TrendingUp className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Real-Time Order Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access your dedicated partner dashboard. See orders as they come in, acknowledge them instantly, and track your performance metrics.
              </p>
            </div>
            
            <div data-testid="benefit-tracking" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Users className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">No Tracking Required</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlike affiliate programs, we don't use cookies or browser tracking. Clean, consent-based architecture that respects user privacy.
              </p>
            </div>
            
            <div data-testid="benefit-performance" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Award className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Simple Order Verification</h3>
              <p className="text-muted-foreground leading-relaxed">
                Review and acknowledge orders with one click. When you verify an order, the customer automatically receives their reward points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold font-heading text-center mb-16">How It Works</h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Admin Creates Your Account</h3>
                <p className="text-muted-foreground">
                  Contact us to get onboarded. We'll create your partner account and send you login credentials.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Login with Google</h3>
                <p className="text-muted-foreground">
                  Use Google OAuth for secure, hassle-free authentication. Set your password on first login.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Receive Orders</h3>
                <p className="text-muted-foreground">
                  When Lynkr users shop at your store using their @lynkr.club email, orders appear in your dashboard automatically.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">4</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Acknowledge & Verify</h3>
                <p className="text-muted-foreground">
                  Review orders and click "Acknowledge" to verify. The customer gets their reward points instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold font-heading mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our pilot program and be among the first partners on Lynkr
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              data-testid="cta-partner-login"
              onClick={handlePartnerLogin}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-bold glow-primary"
            >
              Partner Login
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="bg-secondary hover:bg-secondary/80 border border-white/10 rounded-full px-8 py-6 text-lg"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
            >
              Apply to Join
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="text-sm">&copy; 2025 Lynkr.club. All rights reserved.</p>
          <p className="text-xs mt-2">For partner inquiries: partners@lynkr.club</p>
        </div>
      </footer>
    </div>
  );
};

export default PartnerProgramPage;