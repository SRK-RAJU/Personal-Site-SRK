'use client';

import { FaCog, FaInfoCircle } from 'react-icons/fa';

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
            <FaCog className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Admin configuration and access management.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
          <FaInfoCircle className="mt-0.5" />
          <div>
            <p className="font-semibold">Admin email configuration</p>
            <p className="mt-1">Set admin allowlists only in server-side environment variables and redeploy for role recognition.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Production note</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Admin email values are intentionally not exposed in the client UI.</p>
        </div>
      </div>
    </div>
  );
}
