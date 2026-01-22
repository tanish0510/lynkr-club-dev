import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/utils/api';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-12 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold font-heading mb-2">Verifying Email...</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold font-heading mb-2">Email Verified!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold font-heading mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3"
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;