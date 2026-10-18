'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/security';
import { FaEye, FaEyeSlash, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

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

      if (!fullName.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }

      if (fullName.trim().length > 100) {
        setError('Name must be less than 100 characters');
        setLoading(false);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError('Password does not meet requirements');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      const sanitizedName = sanitizeInput(fullName.trim());

      // Sign up
      await signUp(sanitizedEmail, password, {
        full_name: sanitizedName,
      });

      setSuccess(
        'Account created successfully! Check your email to confirm your account.'
      );

      // Redirect to login after delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(
        err.message || 'Failed to create account. Please try again.'
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
            Create Account
          </h1>
          <p className="text-slate-800 dark:text-slate-200 mb-8">
            Join our community of tech enthusiasts
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="field"
                disabled={loading}
                required
              />
            </div>

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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Create a strong password"
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

              {/* Password Requirements */}
              {password && (
                <div className="mt-3 space-y-2 text-sm">
                  <p
                    className={
                      password.length >= 8
                        ? 'text-[rgb(var(--accent-rgb))]'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {password.length >= 8 ? (
                      <FaCheck className="inline mr-2" />
                    ) : (
                      <FaTimes className="inline mr-2" />
                    )}
                    At least 8 characters
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(password)
                        ? 'text-[rgb(var(--accent-rgb))]'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {/[A-Z]/.test(password) ? (
                      <FaCheck className="inline mr-2" />
                    ) : (
                      <FaTimes className="inline mr-2" />
                    )}
                    One uppercase letter
                  </p>
                  <p
                    className={
                      /[a-z]/.test(password)
                        ? 'text-[rgb(var(--accent-rgb))]'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {/[a-z]/.test(password) ? (
                      <FaCheck className="inline mr-2" />
                    ) : (
                      <FaTimes className="inline mr-2" />
                    )}
                    One lowercase letter
                  </p>
                  <p
                    className={
                      /[0-9]/.test(password)
                        ? 'text-[rgb(var(--accent-rgb))]'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {/[0-9]/.test(password) ? (
                      <FaCheck className="inline mr-2" />
                    ) : (
                      <FaTimes className="inline mr-2" />
                    )}
                    One number
                  </p>
                  <p
                    className={
                      /[!@#$%^&*]/.test(password)
                        ? 'text-[rgb(var(--accent-rgb))]'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {/[!@#$%^&*]/.test(password) ? (
                      <FaCheck className="inline mr-2" />
                    ) : (
                      <FaTimes className="inline mr-2" />
                    )}
                    One special character (!@#$%^&*)
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="field"
                disabled={loading}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordErrors.length > 0}
              className="btn-primary w-full !py-2.5"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-[var(--fg-muted)]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[rgb(var(--accent-rgb))] hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
