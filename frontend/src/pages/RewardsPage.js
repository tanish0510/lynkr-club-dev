import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Gift, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/utils/api';

const RewardsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (dashboard.points < reward.points) {
      toast.error('Insufficient points');
      return;
    }

    setRedeeming(reward.id);
    try {
      const response = await api.post(`/points/redeem?reward_id=${reward.id}&points=${reward.points}`);
      toast.success(
        <div data-testid="redeem-success-message">
          <p className="font-bold mb-1">Reward Redeemed!</p>
          <p className="text-sm">Coupon Code: <strong>{response.data.coupon_code}</strong></p>
        </div>,
        { duration: 5000 }
      );
      await fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Redemption failed');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Button
          data-testid="back-to-dashboard-button"
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-8 hover:bg-white/5 rounded-full"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Rewards</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-heading mb-4">Redeem Your Points</h1>
          <p className="text-xl text-muted-foreground mb-6">Choose from our exclusive rewards</p>
          
          <div data-testid="available-points-display" className="inline-block bg-card rounded-2xl px-8 py-4 border border-white/5">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Your Points</p>
            <p className="text-4xl font-bold font-heading text-primary">{dashboard.points}</p>
          </div>
        </div>

        <div data-testid="rewards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.available_rewards.map((reward) => {
            const canRedeem = dashboard.points >= reward.points;
            
            return (
              <div
                key={reward.id}
                data-testid={`reward-${reward.id}`}
                className={`bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 relative overflow-hidden ${
                  canRedeem ? 'hover:border-white/10' : 'opacity-60'
                }`}
              >
                <div className="mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                    <Gift className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2">{reward.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{reward.points}</span>
                    <span className="text-muted-foreground">points</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Value: ₹{reward.value}</p>
                </div>

                <Button
                  data-testid={`redeem-button-${reward.id}`}
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || redeeming === reward.id}
                  className={`w-full rounded-full py-6 font-bold ${
                    canRedeem
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-primary'
                      : 'bg-secondary text-secondary-foreground cursor-not-allowed'
                  }`}
                >
                  {redeeming === reward.id ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redeeming...
                    </>
                  ) : canRedeem ? (
                    <>
                      <CheckCircle2 className="mr-2 w-5 h-5" />
                      Redeem Now
                    </>
                  ) : (
                    `Need ${reward.points - dashboard.points} more points`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* AI Recommendation */}
        <div data-testid="ai-recommendation-card" className="mt-12 bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Smart Tip</h3>
              <p className="text-muted-foreground leading-relaxed">
                Saving your points for higher value rewards gives you better returns. 
                A ₹1000 gift card for 950 points is better value than a ₹500 card for 500 points!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;