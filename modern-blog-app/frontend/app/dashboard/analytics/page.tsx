'use client';

import { useEffect, useState } from 'react';
import { FaGlobeAmericas, FaNetworkWired, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';

interface VisitRow {
  id: number;
  ip_address: string;
  country: string;
  region: string;
  city: string;
  page_path: string;
  user_agent: string;
  created_at: string;
}

interface CountryCount {
  country: string;
  count: number;
}

export default function DashboardAnalyticsPage() {
  const { session } = useAuth();
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [topCountries, setTopCountries] = useState<CountryCount[]>([]);
  const [totalLogged, setTotalLogged] = useState(0);
  const [uniqueIps, setUniqueIps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadVisitors = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/analytics/visitors?limit=100', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const result = await response.json();
        setVisits(result.recent_visits || []);
        setTopCountries(result.top_countries || []);
        setTotalLogged(result.total_logged_visits || 0);
        setUniqueIps(result.unique_ips || 0);
        if (result.error) setNotice(result.error);
      } finally {
        setLoading(false);
      }
    };

    loadVisitors();
  }, [session?.access_token]);

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-600">
            <FaGlobeAmericas className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visitor Analytics</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Admin-only view of recent visits, IP addresses, and approximate location.
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="dashboard-card border border-amber-300 bg-amber-50 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="dashboard-card">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Logged Visits</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{loading ? '-' : totalLogged}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Unique IP Addresses</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{loading ? '-' : uniqueIps}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on the most recent 5,000 logged visits.</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Countries Reached</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{loading ? '-' : topCountries.length}</p>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <FaMapMarkerAlt className="text-cyan-600" /> Top Countries
        </h2>
        {topCountries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No country data yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topCountries.map((item) => (
              <div key={item.country} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                <span className="font-medium text-slate-800 dark:text-slate-200">{item.country}</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-300">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <FaNetworkWired className="text-cyan-600" /> Recent Visits
        </h2>
        {loading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Loading visitor logs…</div>
        ) : visits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            No visits logged yet. Run docs/VISITOR_ANALYTICS_SETUP.sql in Supabase to enable this feature.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/70">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(visit.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-200">{visit.ip_address}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {[visit.city, visit.region, visit.country].filter((v) => v && v !== 'Unknown').join(', ') || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{visit.page_path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
