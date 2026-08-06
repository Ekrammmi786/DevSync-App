import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, getFieldError } from '../lib/validation';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const { mutate, isPending } = useLogin();

  const result = loginSchema.safeParse(form);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (!result.success) return;
    mutate(form);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to your DevSync account"
      footer={
        <p className="text-sm text-center text-base-content/60">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
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

        <div>
          <FormField
            label="Password"
            name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
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
            error={attempted ? getFieldError(result, 'password') : undefined}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="text-sm text-base-content/70">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
          {isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
