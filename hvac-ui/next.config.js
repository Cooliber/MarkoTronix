const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
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
  // Security headers and CORS configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // CORS headers - more restrictive in production
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? process.env.ALLOWED_ORIGINS || 'https://yourdomain.com'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          // Security headers
          {
            key: 'X-Frame-Options',
            value: process.env.ALLOW_IFRAME === 'true' ? 'SAMEORIGIN' : 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.yourdomain.com; frame-ancestors 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' *; frame-ancestors 'self';"
          },
        ],
      },
    ];
  },
  // Optimize build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production
  optimizeFonts: true,
  swcMinify: true,
  compress: true,
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

// Apply all plugins
module.exports = withBundleAnalyzer(withPWA(nextConfig));
