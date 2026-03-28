import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, otp_form
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');
  const emailFromState = location.state?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token) {
      verifyByToken();
    } else if (emailFromState) {
      setStatus('otp_form');
    } else {
      setStatus('otp_form');
    }
  }, [token]);

  const verifyByToken = async () => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message);
      setTimeout(() => navigate('/onboarding'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Verification failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const emailToUse = (email || '').trim();
    const otpDigits = (otp || '').replace(/\s/g, '');
    if (!emailToUse) {
      setMessage('Please enter your email address');
      return;
    }
    if (otpDigits.length !== 6) {
      setMessage('Please enter the 6-digit code from your email');
      return;
    }
    setOtpSubmitting(true);
    setMessage('');
    try {
      await api.post('/auth/verify-email-otp', { email: emailToUse, otp: otpDigits });
      setStatus('success');
      setMessage('Email verified successfully');
      setTimeout(() => navigate('/onboarding'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage('');
    try {
      await api.post('/auth/resend-verification');
      setMessage('A new code has been sent to your email.');
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Could not resend. Try logging in and request again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-8 max-w-md w-full text-center">
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
            <p className="text-sm text-muted-foreground">Redirecting to onboarding...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold font-heading mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button
              onClick={() => navigate('/app/home')}
              className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3"
            >
              Go to Home
            </Button>
          </>
        )}

        {status === 'otp_form' && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-2">Verify your email</h1>
            <p className="text-muted-foreground mb-6">
              We sent a 6-digit code to your email from <strong>admin@lynkr.club</strong>. Enter it below.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              {!emailFromState && (
                <div>
                  <label htmlFor="verify-email" className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    id="verify-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              )}
              {emailFromState && (
                <p className="text-sm text-muted-foreground">Code sent to <strong>{emailFromState}</strong></p>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Verification code</label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="rounded-lg border-border h-12 w-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              {message && (
                <p className={`text-sm ${message.toLowerCase().includes('success') ? 'text-green-500' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
              <Button
                type="submit"
                disabled={otpSubmitting || otp.replace(/\s/g, '').length !== 6 || (!emailFromState && !email.trim())}
                className="w-full min-h-11 rounded-full"
              >
                {otpSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full min-h-11 rounded-full"
                disabled={resendLoading}
                onClick={handleResend}
              >
                {resendLoading ? 'Sending...' : 'Resend code'}
              </Button>
            </form>
            <Button
              variant="outline"
              className="mt-4 min-h-11 rounded-full w-full"
              onClick={() => navigate('/app/home')}
            >
              Skip for now
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
