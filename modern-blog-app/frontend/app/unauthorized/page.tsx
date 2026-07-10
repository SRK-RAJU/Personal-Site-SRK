import Link from 'next/link';
import { FaLock } from 'react-icons/fa';

export default function UnauthorizedPage() {
  return (
    <div className="auth-shell">
      <div className="max-w-md">
        <div className="auth-card text-center">
          <FaLock className="text-6xl text-red-500 mx-auto mb-4" />

          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
            Access Denied
          </h1>

          <p className="text-slate-800 dark:text-slate-200 mb-8">
            You do not have permission to access this page. Admin access required.
          </p>

          <div className="flex gap-4 flex-col">
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-block bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 p-6 bg-slate-800/70 rounded-lg text-slate-100 text-sm">
          <p className="font-semibold mb-2">Need Admin Access?</p>
          <p>
            Contact your site administrator to request higher privileges.
          </p>
        </div>
      </div>
    </div>
  );
}
