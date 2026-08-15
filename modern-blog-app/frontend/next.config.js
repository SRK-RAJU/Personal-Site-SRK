/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Optimize local images in public folder
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Supabase storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Production domains
      {
        protocol: 'https',
        hostname: 'rjexa.com',
      },
      {
        protocol: 'https',
        hostname: '*.rjexa.com',
      },
      // Unsplash and other image sources
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/posts',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/learning-images',
        destination: '/images',
        permanent: true,
      },
      // Add redirect rules here when migrating from WordPress
      // Example:
      // {
      //   source: '/2024/01/:slug',
      //   destination: '/blog/:slug',
      //   permanent: true,
      // },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
