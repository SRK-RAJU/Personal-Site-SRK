'use client';

import { useState, useEffect, useRef } from 'react';
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
  const trackedRef = useRef(false);

  useEffect(() => {
    const trackPageView = async () => {
      // Only track once per session
      if (trackedRef.current) return;
      trackedRef.current = true;

      try {
        // Track the page view (fire and forget, don't block on this)
        axios.post('/api/analytics', {
          action: 'track-page-view',
          data: {
            page_name: 'homepage',
            user_ip: 'unknown',
            user_agent: navigator.userAgent,
          },
        }).catch(err => { /* silent tracking error */ });

        // Get total views with timeout
        try {
          const response = await axios.get('/api/analytics?action=page-views', {
            timeout: 5000
          });
          setTotalViews(response.data.total_views || 0);
        } catch (err) {
          // Could not fetch page views
          setTotalViews(0); // Default to 0
        }
      } finally {
        setLoading(false);
      }
    };

    trackPageView();
  }, []);

  return { totalViews, loading };
}
