import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Shield, Sparkles, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr</div>
          <div className="flex items-center gap-4">
            <Button
              data-testid="login-button"
              variant="ghost"
              className="hover:bg-white/5 text-foreground rounded-full"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
            <Button
              data-testid="get-started-button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 font-bold glow-primary"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-block">
                <span className="text-sm font-medium tracking-wide uppercase text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-white/10">
                  Mailbox-First Rewards
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none font-heading">
                Shop Smart.
                <br />
                <span className="text-primary">Earn Rewards.</span>
                <br />
                Automatically.
              </h1>
              
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl">
                Get your personal Lynkr email. Use it when shopping. We detect your purchases automatically and convert them into reward points. No tracking, no extensions, just trust.
              </p>
              
              <div className="flex items-center gap-4">
                <Button
                  data-testid="hero-get-started-button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 rounded-full px-8 py-6 text-lg font-bold glow-primary"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Get Your Lynkr Email
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  data-testid="partner-button"
                  variant="outline"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-6 py-6 text-base font-medium border border-white/10 hover:border-white/20"
                  onClick={() => navigate('/partner-program')}
                >
                  For Partners
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <img
                  src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg"
                  alt="Shopping"
                  className="relative rounded-3xl shadow-2xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-4">
              How Lynkr Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to start earning rewards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div data-testid="step-1" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 relative overflow-hidden hover:border-white/10">
              <div className="mb-6 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4 font-heading">1</div>
              <h3 className="text-2xl font-semibold mb-4 font-heading">Get Your Email</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sign up and receive your unique Lynkr email instantly. It's yours to keep and use for all your shopping.
              </p>
            </div>
            
            <div data-testid="step-2" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 relative overflow-hidden hover:border-white/10">
              <div className="mb-6 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4 font-heading">2</div>
              <h3 className="text-2xl font-semibold mb-4 font-heading">Shop Normally</h3>
              <p className="text-muted-foreground leading-relaxed">
                Use your Lynkr email when checking out at partner stores. Shop as you always do, no extra steps needed.
              </p>
            </div>
            
            <div data-testid="step-3" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 relative overflow-hidden hover:border-white/10">
              <div className="mb-6 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4 font-heading">3</div>
              <h3 className="text-2xl font-semibold mb-4 font-heading">Earn Rewards</h3>
              <p className="text-muted-foreground leading-relaxed">
                We automatically detect your purchases from confirmation emails and credit reward points to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-6">
            Trust. Privacy. Transparency.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Lynkr only reads purchase confirmation emails sent to your Lynkr email.
            We never access your personal inbox. No tracking, no cookies, no browser extensions.
            Your data is yours, always.
          </p>
          <Button
            data-testid="cta-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 rounded-full px-8 py-6 text-lg font-bold glow-primary"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Start Earning Rewards
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="text-sm">&copy; 2025 Lynkr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;