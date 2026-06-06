/**
 * Bandwidth Usage Monitoring
 * Tracks Supabase free tier bandwidth usage
 * Alerts when approaching 2GB/month limit
 */

interface BandwidthStats {
  currentUsage: number; // in MB
  monthlyLimit: number; // 2000 MB = 2 GB
  percentageUsed: number; // 0-100%
  daysRemainingInMonth: number;
  projectedUsage: number; // if trend continues
  status: 'healthy' | 'warning' | 'critical'; // based on thresholds
}

// Track in-memory (in production, use Supabase real-time DB)
let bandwidthUsage = {
  totalForMonth: 0,
  trackingStartDate: new Date(),
  downloads: [] as Array<{ date: Date; sizeInMB: number; file: string }>,
};

/**
 * Log a file download (called when serving files from Supabase)
 */
export function logBandwidthUsage(fileSizeInMB: number, filename: string): void {
  const now = new Date();

  // Reset if new month
  if (
    now.getMonth() !== bandwidthUsage.trackingStartDate.getMonth() ||
    now.getFullYear() !== bandwidthUsage.trackingStartDate.getFullYear()
  ) {
    bandwidthUsage = {
      totalForMonth: 0,
      trackingStartDate: now,
      downloads: [],
    };
  }

  bandwidthUsage.totalForMonth += fileSizeInMB;
  bandwidthUsage.downloads.push({
    date: now,
    sizeInMB: fileSizeInMB,
    file: filename,
  });

  // Warn if approaching limit
  if (bandwidthUsage.totalForMonth > 1800) {
    // 90% of 2000 MB
    // Approaching free tier limit
  }
}

/**
 * Get current bandwidth statistics
 */
export function getBandwidthStats(): BandwidthStats {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemainingInMonth = daysInMonth - currentDay;

  // Calculate projected usage if trend continues
  const projectedUsage =
    (bandwidthUsage.totalForMonth / currentDay) * daysInMonth;

  // Determine status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (bandwidthUsage.totalForMonth > 1800) {
    status = 'critical'; // 90%+
  } else if (bandwidthUsage.totalForMonth > 1200) {
    status = 'warning'; // 60%+
  }

  return {
    currentUsage: bandwidthUsage.totalForMonth,
    monthlyLimit: 2000,
    percentageUsed: (bandwidthUsage.totalForMonth / 2000) * 100,
    daysRemainingInMonth,
    projectedUsage: Math.min(projectedUsage, 2500), // Cap at 125% for display
    status,
  };
}

/**
 * Get detailed download history
 */
export function getDownloadHistory() {
  return bandwidthUsage.downloads;
}

/**
 * Get bandwidth status message
 */
export function getBandwidthStatusMessage(): string {
  const stats = getBandwidthStats();

  switch (stats.status) {
    case 'healthy':
      return `${stats.percentageUsed.toFixed(1)}% of free tier used. You're good to go! 🎉`;
    case 'warning':
      return `⚠️ You've used ${stats.percentageUsed.toFixed(1)}% of your free tier. Consider optimizing file serving.`;
    case 'critical':
      return `🔴 CRITICAL: ${stats.percentageUsed.toFixed(1)}% of free tier used this month. Downloads will incur costs!`;
    default:
      return 'Unknown status';
  }
}

/**
 * Recommend bandwidth-saving actions
 */
export function getBandwidthRecommendations(): string[] {
  const stats = getBandwidthStats();
  const recommendations: string[] = [];

  if (stats.status === 'healthy') {
    return ['✓ No action needed - bandwidth usage is healthy'];
  }

  if (stats.status === 'warning') {
    recommendations.push('• Enable stricter lazy loading for images');
    recommendations.push('• Check which files are most frequently downloaded');
    recommendations.push('• Consider compressing large files');
  }

  if (stats.status === 'critical') {
    recommendations.push('🔴 URGENTLY NEEDED:');
    recommendations.push('• Disable auto-download of PDFs');
    recommendations.push('• Revert PDF links to original WordPress URLs');
    recommendations.push('• Cache all images more aggressively');
    recommendations.push('• Consider paid tier if traffic remains high');
  }

  return recommendations;
}

/**
 * Reset bandwidth tracking (use carefully!)
 */
export function resetBandwidthTracking(): void {
  bandwidthUsage = {
    totalForMonth: 0,
    trackingStartDate: new Date(),
    downloads: [],
  };
}

/**
 * Export bandwidth data for analysis
 */
export function exportBandwidthData() {
  return {
    summary: getBandwidthStats(),
    detailed: {
      totalDownloads: bandwidthUsage.downloads.length,
      downloads: bandwidthUsage.downloads.sort(
        (a, b) => b.sizeInMB - a.sizeInMB
      ),
      topFiles: bandwidthUsage.downloads
        .reduce(
          (acc, d) => {
            const existing = acc.find((x) => x.file === d.file);
            if (existing) {
              existing.count++;
              existing.totalSizeMB += d.sizeInMB;
            } else {
              acc.push({
                file: d.file,
                count: 1,
                totalSizeMB: d.sizeInMB,
              });
            }
            return acc;
          },
          [] as Array<{ file: string; count: number; totalSizeMB: number }>
        )
        .sort((a, b) => b.totalSizeMB - a.totalSizeMB),
    },
  };
}
