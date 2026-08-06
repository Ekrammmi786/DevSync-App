import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';
import { useForgotPassword } from '../hooks/useAuth';
import { forgotPasswordSchema, getFieldError } from '../lib/validation';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const { mutate, isPending } = useForgotPassword();

  const result = forgotPasswordSchema.safeParse({ email });

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!result.success) return;
    mutate({ email }, {
      onSuccess: () => navigate('/reset-password', { state: { email } }),
    });
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <p className="text-sm text-center text-base-content/60">
          Remembered it?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          icon={<i className="fa-solid fa-envelope" />}
          error={attempted ? getFieldError(result, 'email') : undefined}
        />

        <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
          {isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Sending...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
