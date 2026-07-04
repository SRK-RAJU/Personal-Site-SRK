'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';

export interface WebsiteStats {
  articles: number;
  monthly_views: number;
  topics: number;
  total_visits: number;
}

export function useWebsiteStats() {
  const [stats, setStats] = useState<WebsiteStats>({
    articles: 0,
    monthly_views: 0,
    topics: 0,
    total_visits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/analytics?action=stats', {
          timeout: 5000 // 5 second timeout
        });
        
        // Ensure we have valid numbers
        setStats({
          articles: response.data.articles ?? 0,
          monthly_views: response.data.monthly_views ?? 0,
          topics: response.data.topics ?? 0,
          total_visits: response.data.total_visits ?? 0,
        });
        setError(null);
      } catch (err) {
        // Using default stats
        // Use sensible defaults on error
        setError('Using default values');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}

export function usePageViews() {
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = async () => {
      if (typeof window === 'undefined') return;

      const currentPath = pathname || '/';
      const viewKey = `analytics:${currentPath}`;
      const hasTracked = window.sessionStorage.getItem(viewKey);
      const siteTotalKey = 'analytics:site-total';
      const previousLocalCount = Number(window.localStorage.getItem(siteTotalKey) || '0');

      if (!hasTracked) {
        window.sessionStorage.setItem(viewKey, 'tracked');
        const nextLocalCount = previousLocalCount + 1;
        window.localStorage.setItem(siteTotalKey, String(nextLocalCount));
        setTotalViews(nextLocalCount);

        axios.post('/api/analytics', {
          action: 'track-page-view',
          data: {
            page_name: currentPath === '/' ? 'homepage' : currentPath,
            page_path: currentPath,
            user_ip: 'unknown',
            user_agent: navigator.userAgent,
          },
        }, {
          headers: {
            'x-analytics-fallback': String(nextLocalCount),
          },
        }).catch(() => {
          // Silent tracking error
        });
      } else {
        setTotalViews(previousLocalCount || 0);
      }

      try {
        const response = await axios.get('/api/analytics?action=page-views', {
          timeout: 5000,
          headers: {
            'x-analytics-fallback': String(previousLocalCount || 0),
          },
        });
        const remoteTotal = Number(response.data.total_views || 0);
        if (remoteTotal > 0) {
          setTotalViews(remoteTotal);
        }
      } catch (err) {
        setTotalViews(previousLocalCount || 0);
      } finally {
        setLoading(false);
      }
    };

    trackPageView();
  }, [pathname]);

  return { totalViews, loading };
}
