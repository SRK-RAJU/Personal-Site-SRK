import Link from 'next/link';
import { FaLock } from 'react-icons/fa';

export default function UnauthorizedPage() {
  return (
    <div className="auth-shell">
      <div className="max-w-md">
        <div className="auth-card text-center">
          <FaLock className="text-6xl text-red-500 mx-auto mb-4" />

          <h1 className="mb-2 text-3xl font-bold text-[rgb(var(--fg-rgb))]">
            Access Denied
          </h1>

          <p className="mb-8 text-[var(--fg-muted)]">
            You do not have permission to access this page. Admin access required.
          </p>

          <div className="flex gap-4 flex-col">
            <Link
              href="/"
              className="btn-primary w-full justify-center"
            >
              Go to Home
            </Link>
            <Link
              href="/dashboard"
              className="btn-secondary w-full justify-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="page-panel mt-6 text-sm">
          <p className="font-semibold mb-2">Need Admin Access?</p>
          <p>
            Contact your site administrator to request higher privileges.
          </p>
        </div>
      </div>
    </div>
  );
}
