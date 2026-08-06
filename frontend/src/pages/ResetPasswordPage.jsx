import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';
import { useResetPassword } from '../hooks/useAuth';
import { resetPasswordSchema, getFieldError, passwordStrength, strengthLabel } from '../lib/validation';

const ResetPasswordPage = () => {
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [form, setForm] = useState({
    email: initialEmail,
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const { mutate, isPending } = useResetPassword();

  const result = resetPasswordSchema.safeParse(form);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!result.success) return;
    const { confirmPassword, ...payload } = form;
    void confirmPassword;
    mutate(payload);
  };

  const strength = passwordStrength(form.newPassword);

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password"
      footer={
        <p className="text-sm text-center text-base-content/60">
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Resend / request a new code
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
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          icon={<i className="fa-solid fa-envelope" />}
          error={attempted ? getFieldError(result, 'email') : undefined}
        />

        <FormField
          label="Reset Code (OTP)"
          name="otp"
          placeholder="4-6 digit code"
          value={form.otp}
          onChange={handleChange}
          autoComplete="one-time-code"
          icon={<i className="fa-solid fa-key" />}
          error={attempted ? getFieldError(result, 'otp') : undefined}
        />

        <div>
          <FormField
            label="New Password"
            name="newPassword"
            type={showPw ? 'text' : 'password'}
            placeholder="Min 6 chars, 1 upper, 1 lower, 1 number"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            icon={<i className="fa-solid fa-lock" />}
            rightSlot={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="btn btn-ghost btn-sm"
              >
                {showPw ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
              </button>
            }
            error={attempted ? getFieldError(result, 'newPassword') : undefined}
          />
          {form.newPassword && (
            <div className="mt-2">
              <progress
                className={`progress progress-${['error', 'warning', 'info', 'success', 'success'][strength]} w-full`}
                value={strength}
                max={4}
              />
              <span className="text-xs text-base-content/60">{strengthLabel[strength]} password</span>
            </div>
          )}
        </div>

        <FormField
          label="Confirm New Password"
          name="confirmPassword"
          type={showConfirmPw ? 'text' : 'password'}
          placeholder="Repeat new password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          icon={<i className="fa-solid fa-lock" />}
          rightSlot={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPw((v) => !v)}
              className="btn btn-ghost btn-sm"
            >
              {showConfirmPw ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
            </button>
          }
          error={attempted ? getFieldError(result, 'confirmPassword') : undefined}
        />

        <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
          {isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
