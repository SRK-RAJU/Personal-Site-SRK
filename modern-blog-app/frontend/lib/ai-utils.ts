/**
 * ============================================================================
 * AI AGENT UTILITY FUNCTIONS
 * ============================================================================
 * File: lib/ai-utils.ts
 *
 * Purpose: Helper functions for AI blog post generation
 * - Slugification
 * - Text processing
 * - Date/time utilities
 * - Markdown parsing
 *
 * ============================================================================
 */

/**
 * Convert title to URL-friendly slug
 * Example: "Kubernetes 1.30 Release" -> "kubernetes-1-30-release"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get current time in IST (Indian Standard Time)
 */
export function getCurrentIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utcOffset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() + utcOffset + istOffset);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(
  markdown: string
): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks: Array<{ language: string; code: string }> = [];

  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return codeBlocks;
}

/**
 * Count words in markdown (rough estimate)
 */
export function countWords(markdown: string): number {
  // Remove markdown syntax
  const cleanText = markdown
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*|__/g, '') // Remove bold
    .replace(/\*|_/g, '') // Remove italics
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .trim();

  return cleanText.split(/\s+/).length;
}

/**
 * Estimate read time in minutes
 */
export function estimateReadTime(markdown: string): number {
  const wordCount = countWords(markdown);
  const wordsPerMinute = 200; // Average reading speed
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

/**
 * Extract CVE IDs from text
 */
export function extractCVEIds(text: string): string[] {
  const cveRegex = /CVE-\d{4}-\d+/g;
  return Array.from(new Set(text.match(cveRegex) || []));
}

/**
 * Extract mentions of tools/technologies
 */
export function extractToolMentions(
  text: string,
  knownTools: string[]
): string[] {
  const mentions = new Set<string>();

  for (const tool of knownTools) {
    const toolRegex = new RegExp(`\\b${tool}\\b`, 'gi');
    if (toolRegex.test(text)) {
      mentions.add(tool);
    }
  }

  return Array.from(mentions);
}

/**
 * Generate hash for topic (for duplicate detection)
 */
export async function generateTopicHash(
  toolName: string,
  topic: string
): Promise<string> {
  const combined = `${toolName}:${topic}`.toLowerCase();

  // Using Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse markdown frontmatter (if using Jekyll-style posts)
 */
export function parseFrontmatter(
  markdown: string
): {
  metadata: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content: markdown };
  }

  const metadata: Record<string, string> = {};
  const frontmatterLines = match[1].split('\n');

  for (const line of frontmatterLines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  }

  return {
    metadata,
    content: match[2],
  };
}

/**
 * Sanitize markdown for safe display
 */
export function sanitizeMarkdown(markdown: string): string {
  return markdown
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ''); // Remove script tags
}

/**
 * Check if markdown is valid
 */
export function isValidMarkdown(markdown: string): boolean {
  if (!markdown || markdown.trim().length === 0) {
    return false;
  }

  // Must have at least one heading
  if (!/^#+\s+/m.test(markdown)) {
    return false;
  }

  // Must have reasonable length
  if (markdown.length < 500) {
    return false;
  }

  return true;
}

/**
 * Generate table of contents from markdown
 */
export function generateTableOfContents(
  markdown: string
): Array<{ level: number; title: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: Array<{ level: number; title: string; id: string }> = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2];
    const id = slugify(title);

    toc.push({ level, title, id });
  }

  return toc;
}

/**
 * Add anchor links to headings in markdown
 */
export function addAnchorLinks(markdown: string): string {
  return markdown.replace(
    /^(#{1,6})\s+(.+)$/gm,
    (match: string, hashes: string, title: string) => {
      const id = slugify(title);
      return `${hashes} ${title} {#${id}}`;
    }
  );
}

/**
 * Extract metadata from blog post
 */
export function extractPostMetadata(markdown: string): {
  title: string;
  wordCount: number;
  readTime: number;
  cveCount: number;
  headingCount: number;
} {
  return {
    title: extractTitle(markdown),
    wordCount: countWords(markdown),
    readTime: estimateReadTime(markdown),
    cveCount: extractCVEIds(markdown).length,
    headingCount: (markdown.match(/^#+\s+/gm) || []).length,
  };
}

/**
 * Extract title from markdown (first h1 heading)
 */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Extract excerpt from markdown (first paragraph)
 */
export function extractExcerpt(
  markdown: string,
  maxLength: number = 200
): string {
  // Remove title
  const withoutTitle = markdown.replace(/^#\s+.+\n\n/, '');

  // Find first paragraph
  const lines = withoutTitle.split('\n');
  let excerpt = '';

  for (const line of lines) {
    if (line.trim().length > 0 && !line.startsWith('#')) {
      excerpt = line.trim();
      break;
    }
  }

  // Clean markdown syntax
  excerpt = excerpt
    .replace(/\*\*|__/g, '') // Remove bold
    .replace(/\*|_/g, '') // Remove italics
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Convert links

  return excerpt.substring(0, maxLength) + (excerpt.length > maxLength ? '...' : '');
}

/**
 * Validate blog post content quality
 */
export function validatePostQuality(markdown: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check minimum length
  if (countWords(markdown) < 500) {
    issues.push('Post is too short (minimum 500 words)');
  }

  // Check for title
  if (!markdown.match(/^#\s+/m)) {
    issues.push('Post must start with a main title (# format)');
  }

  // Check for sections
  const sectionCount = (markdown.match(/^##\s+/gm) || []).length;
  if (sectionCount < 2) {
    issues.push('Post should have at least 2 sections (## format)');
  }

  // Check for sources
  if (!markdown.match(/\[.*\]\(https?:\/\/.*\)/)) {
    issues.push('Post should include at least one source link');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Clean and normalize markdown
 */
export function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .trim(); // Remove leading/trailing whitespace
}


const aiUtils = {
  slugify,
  getCurrentIST,
  formatDate,
  extractCodeBlocks,
  countWords,
  estimateReadTime,
  extractCVEIds,
  extractToolMentions,
  generateTopicHash,
  parseFrontmatter,
  sanitizeMarkdown,
  isValidMarkdown,
  generateTableOfContents,
  addAnchorLinks,
  extractPostMetadata,
  extractTitle,
  extractExcerpt,
  validatePostQuality,
  normalizeMarkdown,  
};

export default aiUtils;

