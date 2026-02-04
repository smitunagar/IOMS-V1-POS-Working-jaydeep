import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Exclude test files and temporary directories from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Fix webpack configuration for production builds
  webpack: (config, { dev, isServer }) => {
    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    
    // Exclude test files and temporary directories
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader',
    })
    
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dining-area-setup',
        destination: '/pos/table-management',
        permanent: true,
      },
      // Keep backward compatibility for existing table-management route
      {
        source: '/table-management',
        destination: '/pos/table-management',
        permanent: true,
      },
      // Redirect /apps/ioms to /ioms
      {
        source: '/apps/ioms',
        destination: '/ioms',
        permanent: true,
      },
      // Redirect /apps/ai-ingredient-generator to /ai-ingredient-generator
      {
        source: '/apps/ai-ingredient-generator',
        destination: '/ai-ingredient-generator',
        permanent: true,
      },
      // Redirect /apps/government-portal to /government-portal
      {
        source: '/apps/government-portal',
        destination: '/government-portal',
        permanent: true,
      },
      // Redirect /apps/waste-watchdog to /waste-watchdog
      {
        source: '/apps/waste-watchdog',
        destination: '/waste-watchdog',
        permanent: true,
      },
      // Redirect /apps/supply-sync to /supply-sync
      {
        source: '/apps/supply-sync',
        destination: '/supply-sync',
        permanent: true,
      },
      // Redirect /apps/smart-chef-bot to /smart-chef-pod
      {
        source: '/apps/smart-chef-bot',
        destination: '/smart-chef-pod',
        permanent: true,
      },
      // Redirect old institutional-ioms routes to mensa-ioms for backward compatibility
      {
        source: '/institutional-ioms/:path*',
        destination: '/mensa-ioms/:path*',
        permanent: true,
      },
      {
        source: '/institutional-signup',
        destination: '/mensa-signup',
        permanent: true,
      },
      {
        source: '/api/institutional-orders/:path*',
        destination: '/api/mensa-orders/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig 