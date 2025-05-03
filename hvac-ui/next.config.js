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
    localeDetection: true,
  },
};

module.exports = withPWA(nextConfig);