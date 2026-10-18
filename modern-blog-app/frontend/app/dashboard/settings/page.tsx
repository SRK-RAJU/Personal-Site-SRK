'use client';

import { FaCog, FaInfoCircle } from 'react-icons/fa';

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))]">
            <FaCog className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg-rgb))]">Settings</h1>
            <p className="text-sm text-[var(--fg-muted)]">Admin configuration and access management.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex items-start gap-3 rounded-xl border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.08)] p-4 text-sm text-[var(--fg-muted)]">
          <FaInfoCircle className="mt-0.5 text-[rgb(var(--accent-rgb))]" />
          <div>
            <p className="font-semibold text-[rgb(var(--fg-rgb))]">Admin email configuration</p>
            <p className="mt-1">Set admin allowlists only in server-side environment variables and redeploy for role recognition.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-[rgb(var(--fg-rgb))]">Production note</p>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">Admin email values are intentionally not exposed in the client UI.</p>
        </div>
      </div>
    </div>
  );
}
