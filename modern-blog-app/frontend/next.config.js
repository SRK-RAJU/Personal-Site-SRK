/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
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
      // Production domain
      {
        protocol: 'https',
        hostname: 'rjexa.com',
      },
      {
        protocol: 'https',
        hostname: '*.rjexa.com',
      },
    ],
  },
  async redirects() {
    return [
      // Add redirect rules here when migrating from WordPress
      // Example:
      // {
      //   source: '/2024/01/:slug',
      //   destination: '/blog/:slug',
      //   permanent: true,
      // },
    ];
  },
};

module.exports = nextConfig;
