/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
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
