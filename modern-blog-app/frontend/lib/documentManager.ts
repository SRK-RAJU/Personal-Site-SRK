/**
 * Document/PDF Utility for Supabase
 * Implements bandwidth-safe PDF serving strategy
 * 
 * STRATEGY: Don't download PDFs directly from Supabase storage
 * Instead: Link to original WordPress URLs or store metadata only
 */

import { supabase } from './supabaseClient'
import { logBandwidthUsage, getBandwidthStats } from './bandwidthMonitor'

interface DocumentMetadata {
  id: string
  title: string
  category: 'guide' | 'presentation' | 'certificate' | 'other'
  size: number // in MB
  sourceUrl: string // Original URL (WordPress or other)
  uploadedDate: string
  description?: string
}

/**
 * Get document metadata from Supabase
 * Uses minimal bandwidth since we're not downloading the PDF itself
 */
export async function getDocumentMetadata(
  documentId: string
): Promise<DocumentMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) {
      // Error fetching metadata
      return null
    }

    return data
  } catch (error) {
    // Exception in getDocumentMetadata
    return null
  }
}

/**
 * List all documents in a category
 * Low bandwidth - only metadata
 */
export async function listDocuments(
  category?: 'guide' | 'presentation' | 'certificate' | 'other'
): Promise<DocumentMetadata[]> {
  try {
    let query = supabase.from('documents').select('id,title,category,size,sourceUrl,uploadedDate,description')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      // Error listing documents
      return []
    }

    return data || []
  } catch (error) {
    // Exception in listDocuments
    return []
  }
}

/**
 * Get download URL for document
 * 
 * STRATEGY:
 * - For bandwidth-optimized setup: Return original WordPress URL
 * - For owned documents: Generate Supabase download link
 * 
 * IMPORTANT: Always check bandwidth before serving
 */
export async function getDocumentUrl(
  documentId: string,
  strategy: 'original' | 'supabase' = 'original'
): Promise<{ url: string | null; warning?: string }> {
  try {
    const metadata = await getDocumentMetadata(documentId)
    if (!metadata) {
      return { url: null, warning: 'Document not found' }
    }

    // Check bandwidth status
    const bandwidthStats = getBandwidthStats()
    const isNearLimit = bandwidthStats.percentageUsed > 80

    // Strategy 1: Use original source URL (RECOMMENDED FOR FREE TIER)
    if (strategy === 'original' || isNearLimit) {
      let warning = undefined
      if (metadata.sourceUrl.includes('wordpress') || metadata.sourceUrl.includes('42web.io')) {
        warning = `📥 Downloading from original site: ${metadata.title} (${metadata.size}MB)`
      }

      return {
        url: metadata.sourceUrl,
        warning,
      }
    }

    // Strategy 2: Use Supabase storage
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(documentId)

      const url = data?.publicUrl
      if (!url) {
        // Fallback to original
        return {
          url: metadata.sourceUrl,
          warning: 'Falling back to original URL',
        }
      }

      // Return Supabase URL with bandwidth warning
      return {
        url: data.publicUrl,
        warning: `⚠️ This will use ${metadata.size}MB of your bandwidth`,
      }
    } catch (err) {
      // Fallback to original on any error
      return {
        url: metadata.sourceUrl,
        warning: 'Falling back to original URL',
      }
    }
  } catch (error) {
    return { url: null, warning: 'Error getting document URL' }
  }
}

/**
 * Component helper: Get safe document link
 * Returns info needed to display document download safely
 */
export async function getSafeDocumentLink(documentId: string) {
  const metadata = await getDocumentMetadata(documentId)
  if (!metadata) return null

  const { url, warning } = await getDocumentUrl(documentId, 'original')

  return {
    title: metadata.title,
    url,
    size: metadata.size,
    warning,
    category: metadata.category,
  }
}

/**
 * Download document with bandwidth tracking
 * Should be called AFTER user clicks download
 */
export async function trackDocumentDownload(
  documentId: string,
  fileSizeInMB: number,
  filename: string
): Promise<void> {
  // Log to bandwidth monitor
  logBandwidthUsage(fileSizeInMB, filename)

  // Optional: Log to Supabase for analytics
  try {
    await supabase.from('document_downloads').insert([
      {
        document_id: documentId,
        file_size_mb: fileSizeInMB,
        downloaded_at: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    ] as never)
  } catch (error) {
    // Non-critical, just for analytics
    // Could not log download
  }
}

/**
 * Get bandwidth-aware message for document
 */
export function getDocumentDownloadMessage(
  filename: string,
  fileSizeInMB: number
): { message: string; severity: 'info' | 'warning' | 'critical' } {
  const bandwidthStats = getBandwidthStats()
  const percentageOfMonthly = (fileSizeInMB / 2000) * 100

  if (bandwidthStats.percentageUsed > 90) {
    return {
      message: `🔴 CRITICAL: Your bandwidth is nearly exhausted (${bandwidthStats.percentageUsed.toFixed(1)}%). This download may incur costs.`,
      severity: 'critical',
    }
  }

  if (bandwidthStats.percentageUsed > 80) {
    return {
      message: `⚠️ WARNING: Approaching bandwidth limit. Downloading "${filename}" (${fileSizeInMB}MB) will use ${percentageOfMonthly.toFixed(2)}% of remaining free tier.`,
      severity: 'warning',
    }
  }

  return {
    message: `💾 Downloading "${filename}" (${fileSizeInMB}MB) - ${percentageOfMonthly.toFixed(3)}% of free tier`,
    severity: 'info',
  }
}

/**
 * Database schema for documents table (run in Supabase SQL):
 * 
 * CREATE TABLE documents (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title TEXT NOT NULL,
 *   category TEXT NOT NULL, -- 'guide', 'presentation', 'certificate', 'other'
 *   size FLOAT NOT NULL, -- in MB
 *   sourceUrl TEXT NOT NULL, -- Original URL
 *   uploadedDate TIMESTAMP DEFAULT now(),
 *   description TEXT,
 *   created_at TIMESTAMP DEFAULT now()
 * );
 *
 * CREATE TABLE document_downloads (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   document_id UUID REFERENCES documents(id),
 *   file_size_mb FLOAT NOT NULL,
 *   downloaded_at TIMESTAMP,
 *   user_agent TEXT,
 *   created_at TIMESTAMP DEFAULT now()
 * );
 */
