import Link from 'next/link';
import { FaHome } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center">
      <div className="page-frame max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-cyan-600 mb-4">404</h1>
          <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Page Not Found
          </h2>
        </div>

        <p className="text-xl text-slate-800 dark:text-slate-200 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn btn-primary px-6 py-3 inline-flex gap-2">
            <FaHome /> Go to Home
          </Link>
          <Link href="/blog" className="btn btn-secondary px-6 py-3">
            Browse Blog
          </Link>
        </div>

        <div className="page-panel mt-16 p-8">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            Need help? You can always reach out through the{' '}
            <Link href="/contact" className="text-cyan-600 hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
