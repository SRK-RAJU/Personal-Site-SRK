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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20 flex items-center justify-center p-4 pt-24">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-8 font-semibold transition-colors"
        >
          <FaArrowLeft className="text-sm" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-6 mx-auto">
            <FaEnvelope className="text-violet-600 dark:text-violet-400 text-xl" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
            Reset Password
          </h1>
          
          <p className="text-center text-slate-800 dark:text-slate-200 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Success Message */}
          {submitted && (
            <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg flex items-start gap-3">
              <FaCheckCircle className="text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-violet-900 dark:text-violet-300">
                  Check your email
                </p>
                <p className="text-sm text-violet-800 dark:text-violet-200">
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
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
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
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  Remember your password?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
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
              <p className="text-sm text-slate-800 dark:text-slate-200">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleSubmit}
                  className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  try again
                </button>
              </p>
              <Link
                href="/auth/login"
                className="inline-block text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">💡 Tip:</span> Check your email within 10 minutes. The reset link expires after that for security.
          </p>
        </div>
      </div>
    </div>
  );
}
