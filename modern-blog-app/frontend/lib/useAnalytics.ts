'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export interface WebsiteStats {
  articles: number;
  monthly_views: number;
  topics: number;
  projects: number;
  total_visits: number;
}

export function useWebsiteStats() {
  const [stats, setStats] = useState<WebsiteStats>({
    articles: 0,
    monthly_views: 0,
    topics: 0,
    projects: 0,
    total_visits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/analytics?action=stats');
        setStats({
          articles: response.data.articles ?? 0,
          monthly_views: response.data.monthly_views ?? 0,
          topics: response.data.topics ?? 0,
          projects: response.data.projects ?? 0,
          total_visits: response.data.total_visits ?? 0,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Use default values on error
        setError('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function usePageViews() {
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Track the page view
        await axios.post('/api/analytics', {
          action: 'track-page-view',
          data: {
            page_name: 'homepage',
            user_ip: 'unknown',
            user_agent: navigator.userAgent,
          },
        });

        // Get total views
        const response = await axios.get('/api/analytics?action=page-views');
        setTotalViews(response.data.total_views || 0);
      } catch (err) {
        console.error('Error tracking page view:', err);
      } finally {
        setLoading(false);
      }
    };

    trackPageView();
  }, []);

  return { totalViews, loading };
}
