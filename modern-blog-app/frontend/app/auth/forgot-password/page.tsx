'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // For now, show success message (implement actual email sending)
      // In production, integrate with email service
      toast.success('Password reset link sent to your email!');
      setSubmitted(true);
      setEmail('');

      // Reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
      toast.error('Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/login"
          className="mb-8 inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
        >
          <FaArrowLeft className="text-sm" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="auth-card">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)]">
            <FaEnvelope className="text-xl text-[rgb(var(--accent-rgb))]" />
          </div>

          <h1 className="mb-2 text-center text-3xl font-bold text-[rgb(var(--fg-rgb))]">
            Reset Password
          </h1>
          
          <p className="mb-8 text-center text-[var(--fg-muted)]">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Success Message */}
          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.08)] p-4">
              <FaCheckCircle className="mt-0.5 flex-shrink-0 text-[rgb(var(--accent-rgb))]" />
              <div>
                <p className="font-semibold text-[rgb(var(--fg-rgb))]">
                  Check your email
                </p>
                <p className="text-sm text-[var(--fg-muted)]">
                  We've sent a password reset link to {email}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <FaExclamationCircle className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[rgb(var(--fg-rgb))]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="field"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-[var(--fg-muted)]">
                  Remember your password?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Additional Info */}
          {submitted && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--fg-muted)]">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleSubmit}
                  className="font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
                >
                  try again
                </button>
              </p>
              <Link
                href="/auth/login"
                className="inline-block font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="page-panel mt-6 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            <span className="font-semibold text-[rgb(var(--accent-rgb))]">Tip:</span> Check your email within 10 minutes. The reset link expires after that for security.
          </p>
        </div>
      </div>
    </div>
  );
}
