import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Users, TrendingUp, Award } from 'lucide-react';

const PartnerLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr for Partners</div>
          <Button
            data-testid="partner-signup-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-3 font-bold"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto text-center">
          <Button
            data-testid="back-home-button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none font-heading mb-6">
            Grow Your Business
            <br />
            <span className="text-primary">With Verified Customers</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Partner with Lynkr to reach customers who are genuinely interested in your products. 
            No ads, no tracking, just real, verified purchases.
          </p>

          <Button
            data-testid="become-partner-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-bold glow-primary"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Become a Partner
          </Button>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-heading text-center mb-16">Why Partner with Lynkr?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div data-testid="benefit-verified" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Shield className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Verified Customers Only</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every purchase is verified through email confirmations. No fake orders, no fraud, just real customers.
              </p>
            </div>
            
            <div data-testid="benefit-insights" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <TrendingUp className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Aggregated Insights</h3>
              <p className="text-muted-foreground leading-relaxed">
                Understand customer behavior through anonymous, aggregated data. Make informed decisions without compromising privacy.
              </p>
            </div>
            
            <div data-testid="benefit-tracking" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Users className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">No Tracking Required</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlike affiliate programs, we don't use cookies or browser tracking. Clean, consent-based architecture.
              </p>
            </div>
            
            <div data-testid="benefit-performance" className="bg-card rounded-3xl border border-white/5 shadow-2xl p-8">
              <Award className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Performance-Based Rewards</h3>
              <p className="text-muted-foreground leading-relaxed">
                You only pay when customers make verified purchases. Fair, transparent, and performance-driven.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold font-heading mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our pilot program and be among the first partners on Lynkr
          </p>
          <Button
            data-testid="cta-partner-button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-lg font-bold glow-primary"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Apply Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PartnerLanding;