'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/security';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());

      // Sign in
      await signIn(sanitizedEmail, password);
      setSuccess('Logged in successfully! Redirecting...');

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.message || 'Failed to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[rgb(var(--accent-rgb))] border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--fg-muted)] hover:text-[rgb(var(--fg-rgb))] mb-8 transition-colors"
        >
          <FaArrowLeft className="text-sm" />
          Back to Site
        </Link>

        {/* Card */}
        <div className="auth-card">
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-slate-800 dark:text-slate-200 mb-8">
            Sign in to your account to access the blog
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 rounded-xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)] p-4 text-sm text-[rgb(var(--fg-rgb))]">
              {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="field"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="field !pr-11"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[rgb(var(--accent-rgb))] hover:underline"
            >
              Forgot your password?
            </Link>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-[var(--fg-muted)]">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-[rgb(var(--accent-rgb))] hover:underline font-semibold"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 glass rounded-xl text-[var(--fg-muted)] text-sm">
          <p className="font-semibold mb-2">Demo credentials (for testing):</p>
          <p>Email: User-Name@google.com</p>
          <p>Password: Any High Secured password</p>
        </div>
      </div>
    </div>
  );
}
