/**
 * Image utility functions for handling SVG and image loading
 */

// Map of post/article IDs to their featured images
export const FEATURED_IMAGE_MAP: Record<string, string> = {
  'getting-started-nextjs-14': '/images/adv-banner.svg',
  'typescript-best-practices': '/images/tech-stack.svg',
  'realtime-supabase': '/images/devsecops-banner.svg',
  'aws-solutions-architect': '/images/tech-stack.svg',
  'devops-automation': '/images/adv-banner.svg',
  'default': '/images/adv-banner.svg',
};

// Map of project IDs to their images
export const PROJECT_IMAGE_MAP: Record<string, string> = {
  '1': '/projects/blog.svg',
  '2': '/projects/ecommerce.svg',
  '3': '/projects/tasks.svg',
  'default': '/projects/blog.svg',
};

/**
 * Get featured image for a post/article by slug
 */
export const getFeaturedImage = (slug: string, defaultImage?: string): string => {
  if (!slug) return defaultImage || FEATURED_IMAGE_MAP['default'];
  return FEATURED_IMAGE_MAP[slug] || FEATURED_IMAGE_MAP['default'];
};

/**
 * Get project image by ID
 */
export const getProjectImage = (id: string | number, defaultImage?: string): string => {
  const idStr = String(id);
  if (!idStr) return defaultImage || PROJECT_IMAGE_MAP['default'];
  return PROJECT_IMAGE_MAP[idStr] || PROJECT_IMAGE_MAP['default'];
};

/**
 * Ensure image URL starts with /
 */
export const ensureLeadingSlash = (url: string): string => {
  if (!url) return '/images/adv-banner.svg';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (!url.startsWith('/')) return '/' + url;
  return url;
};

/**
 * Validate if image URL is accessible
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.length > 0 && (url.startsWith('/') || url.startsWith('http') || url.startsWith('data:'));
};

/**
 * Get fallback image for errors
 */
export const getFallbackImage = (): string => {
  return '/images/adv-banner.svg';
};
