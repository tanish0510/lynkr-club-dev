import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/utils/api';

const PartnerFirstLoginPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/partner/first-login-password-change?new_password=${encodeURIComponent(newPassword)}`);
      toast.success('Password changed successfully!');
      navigate('/app/partner');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-center mb-2">Change Your Password</h1>
        <p className="text-muted-foreground text-center mb-8">
          For security reasons, please create a new password before continuing.
        </p>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="bg-secondary/50 border-border rounded-xl h-12"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          
          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-secondary/50 border-border rounded-xl h-12"
              placeholder="Confirm your new password"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg font-bold glow-primary"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Changing Password...
              </>
            ) : (
              'Change Password & Continue'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PartnerFirstLoginPassword;