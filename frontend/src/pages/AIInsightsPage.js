import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, TrendingUp, PieChart, User } from 'lucide-react';
import api from '@/utils/api';

const AIInsights = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai/insights');
      setInsights(response.data);
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12">
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
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Insights</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-heading mb-4">Your Shopping Intelligence</h1>
          <p className="text-xl text-muted-foreground">Understand your spending with AI</p>
        </div>

        {/* Spending Persona */}
        <div data-testid="spending-persona-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Shopping Persona</p>
              <h2 data-testid="spending-persona" className="text-3xl font-bold font-heading text-primary">{insights.spending_persona}</h2>
            </div>
          </div>
        </div>

        {/* Spending by Category */}
        <div data-testid="category-breakdown-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold font-heading">Spending by Category</h2>
          </div>
          
          {Object.keys(insights.spending_by_category).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No spending data yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(insights.spending_by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const total = Object.values(insights.spending_by_category).reduce((sum, val) => sum + val, 0);
                  const percentage = ((amount / total) * 100).toFixed(1);
                  
                  return (
                    <div key={category} data-testid={`category-${category}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">₹{amount.toFixed(2)}</span>
                      </div>
                      <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top Category */}
        <div data-testid="top-category-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold font-heading">Top Category</h2>
          </div>
          <p data-testid="top-category" className="text-4xl font-bold font-heading text-primary mb-2">{insights.top_category}</p>
          <p className="text-muted-foreground">{insights.monthly_trend}</p>
        </div>

        {/* Insights */}
        <div data-testid="insights-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold font-heading mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            Key Insights
          </h2>
          <div className="space-y-4">
            {insights.insights.map((insight, index) => (
              <div
                key={index}
                data-testid={`insight-${index}`}
                className="bg-secondary/30 rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-base leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div data-testid="recommendations-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          <h2 className="text-2xl font-bold font-heading mb-6">Recommendations</h2>
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div
                key={index}
                data-testid={`recommendation-${index}`}
                className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent text-sm font-bold">✓</span>
                </div>
                <p className="text-base leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;