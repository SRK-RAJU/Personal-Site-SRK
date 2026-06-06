/**
 * Supabase Storage Utility
 * Handles lazy-loading images and documents with free tier optimization
 * 
 * FREE TIER LIMITS:
 * - Storage: 1 GB (we have ~70 MB, OK)
 * - Monthly Egress (Bandwidth): 2 GB (CRITICAL!)
 * 
 * STRATEGY:
 * - Lazy load images only when visible (Intersection Observer)
 * - Cache images in memory to avoid re-downloads
 * - For PDFs: Provide download link with warning about bandwidth
 * - Optional: Link to original WordPress URLs if still accessible
 */

import { supabase } from './supabaseClient'

interface CachedFile {
  url: string
  timestamp: number
}

// In-memory cache (clears on page refresh)
const fileCache = new Map<string, CachedFile>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Get public URL from Supabase Storage
 * Returns cached URL if available
 */
export async function getStorageUrl(
  bucket: string,
  path: string,
  cache = true
): Promise<string | null> {
  try {
    const cacheKey = `${bucket}/${path}`

    // Check cache first
    if (cache && fileCache.has(cacheKey)) {
      const cached = fileCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.url
      } else {
        fileCache.delete(cacheKey)
      }
    }

    // Get signed URL or public URL from Supabase
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!data || !data.publicUrl) {
      // Error getting URL for file
      return null
    }

    const url = data.publicUrl

    // Cache the URL
    if (cache) {
      fileCache.set(cacheKey, {
        url,
        timestamp: Date.now(),
      })
    }

    return url
  } catch (error) {
    // Exception in getFileUrl
    return null
  }
}

/**
 * List all files in a bucket folder
 * Useful for gallery views
 */
export async function listBucketFiles(bucket: string, folder: string = '') {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder)

    if (error) {
      // Error listing files
      return []
    }

    return data || []
  } catch (error) {
    // Exception listing files
    return []
  }
}

/**
 * Get image URL - optimized for lazy loading
 * Returns object with URL and metadata
 */
export async function getImageUrl(bucket: string, imagePath: string) {
  const url = await getStorageUrl(bucket, imagePath)
  return {
    url,
    alt: extractFileName(imagePath),
    loaded: false,
  }
}

/**
 * Get PDF URL with file size info
 * Returns metadata to help users understand bandwidth impact
 */
export async function getPdfUrl(
  bucket: string,
  pdfPath: string
): Promise<{ url: string | null; filename: string; size?: number }> {
  const url = await getStorageUrl(bucket, pdfPath)
  const filename = extractFileName(pdfPath)

  return {
    url,
    filename,
    size: undefined, // You can cache size separately if needed
  }
}

/**
 * Helper to extract filename from path
 */
function extractFileName(path: string): string {
  return path.split('/').pop() || 'file'
}

/**
 * Clear cache manually (useful for logout or refresh)
 */
export function clearStorageCache() {
  fileCache.clear()
}

/**
 * Get cache statistics (for monitoring free tier usage)
 */
export function getCacheStats() {
  return {
    cachedItems: fileCache.size,
    cacheSize: fileCache.size, // Rough estimate
  }
}

/**
 * Band width-aware file download warning
 * Shows warning before downloading large files on free tier
 */
export function getBandwidthWarning(fileSizeInMB: number): string {
  const freeMonthlyBandwidth = 2000 // MB
  const percentageOfMonthly = ((fileSizeInMB / freeMonthlyBandwidth) * 100).toFixed(2)

  return `This file is ~${fileSizeInMB}MB (${percentageOfMonthly}% of free tier monthly bandwidth). Continue?`
}
