const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    // During development, type errors are reported but don't fail the build
    // In production, we want to fail the build on type errors
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // During development, linting errors are reported but don't fail the build
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  env: {
    // Default environment variables that can be overridden in production
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
    APP_ENV: process.env.APP_ENV || 'development',
  },
  // Enable CORS and allow embedding in iframes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
  // Optimize build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Handle images
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Internationalization
  i18n: {
    locales: ['en', 'pl'],
    defaultLocale: 'en',
    localeDetection: false, // Updated this line
  },
};

module.exports = withPWA(nextConfig);
