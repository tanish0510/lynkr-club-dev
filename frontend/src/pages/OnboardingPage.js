import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '@/utils/api';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.lynkr_email || '');
    setCopied(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const completeOnboarding = async () => {
    try {
      await api.post('/user/complete-onboarding');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {step === 1 && (
          <div data-testid="onboarding-step-1" className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center">
              <h1 className="text-3xl md:text-6xl font-bold font-heading mb-4">
                Welcome to Lynkr! 🎉
              </h1>
              <p className="text-xl text-muted-foreground">
                Let's get you started in 3 simple steps
              </p>
            </div>
            
            <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Get Your Lynkr Email</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We've created a unique email just for you. This is your key to automatic rewards.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Use It When Shopping</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Whenever you shop online at partner stores, use your Lynkr email at checkout instead of your personal email.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Earn Rewards Automatically</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We'll detect your purchase confirmations and credit reward points to your account. No extra steps needed!
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                data-testid="continue-button"
                onClick={() => setStep(2)}
                className="w-full min-h-11 mt-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
              >
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="onboarding-step-2" className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center">
              <h1 className="text-3xl md:text-6xl font-bold font-heading mb-4">
                Your Lynkr Email
              </h1>
              <p className="text-xl text-muted-foreground">
                Save this email and use it for all your online shopping
              </p>
            </div>
            
            <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 md:p-12">
              <div className="bg-secondary/50 border border-white/10 rounded-2xl p-8 mb-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-3">Your Lynkr Email</p>
                  <div data-testid="lynkr-email" className="text-3xl md:text-4xl font-bold font-heading mb-6 break-all">
                    {user.lynkr_email}
                  </div>
                  <Button
                    data-testid="copy-email-button"
                    onClick={handleCopy}
                    variant="outline"
                    className="min-h-11 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary rounded-full px-6 py-3"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="mr-2 w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 w-5 h-5" />
                        Copy Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-3 text-accent-foreground">Privacy First</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lynkr only reads purchase confirmation emails sent to <strong>this email address</strong>. 
                  We never access your personal inbox. Your shopping data stays private and secure.
                </p>
              </div>
              
              <Button
                data-testid="got-it-button"
                onClick={completeOnboarding}
                className="w-full min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
              >
                Got It! Take Me to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;