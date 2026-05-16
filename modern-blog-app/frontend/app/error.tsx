'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-max py-20 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-600 mb-4">Oops!</h1>
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Something went wrong
          </h2>
        </div>

        <p className="text-lg text-slate-800 dark:text-slate-200 mb-4">
          We encountered an unexpected error. Please try again.
        </p>

        <details className="text-left mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-200">
            Error details
          </summary>
          <p className="text-sm text-slate-800 dark:text-slate-200 mt-4 font-mono break-words">
            {error.message}
          </p>
        </details>

        <button
          onClick={reset}
          className="btn btn-primary px-6 py-3 inline-flex gap-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
