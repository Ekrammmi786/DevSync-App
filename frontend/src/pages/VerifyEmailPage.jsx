import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { useSendVerificationOtp, useVerifyEmail, useResendOtp } from '../hooks/useAuth';
import { verifyEmailSchema, getFieldError } from '../lib/validation';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otp, setOtp] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = useSendVerificationOtp();
  const verify = useVerifyEmail();
  const resend = useResendOtp();

  const result = verifyEmailSchema.safeParse({ otp });

  const handleSendOtp = () => {
    sendOtp.mutate(undefined, {
      onSuccess: () => setOtpSent(true),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!result.success) return;
    verify.mutate({ otp }, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We need to confirm ${user?.email || 'your email'} is yours`}
      footer={
        <p className="text-sm text-center text-base-content/60">
          <button
            type="button"
            onClick={handleSendOtp}
            className="text-primary font-medium hover:underline"
            disabled={sendOtp.isPending}
          >
            {sendOtp.isPending ? 'Sending...' : otpSent ? 'Resend verification code' : 'Send verification code'}
          </button>
        </p>
      }
    >
      {!otpSent ? (
        <div className="space-y-4">
          <div className="alert alert-warning shadow">
            <span>⚠️</span>
            <span>
              Your email isn't verified yet. Click below to send a 6-digit verification code to your inbox.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleSendOtp}
            disabled={sendOtp.isPending}
          >
            {sendOtp.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Verification Code (OTP)"
            name="otp"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoComplete="one-time-code"
            icon={<i className="fa-solid fa-key" />}
            error={attempted ? getFieldError(result, 'otp') : undefined}
          />

          <button type="submit" className="btn btn-primary w-full" disabled={verify.isPending}>
            {verify.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
          >
            {resend.isPending ? 'Resending...' : 'Resend code'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default VerifyEmailPage;
