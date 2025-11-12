/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip lint errors during build
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined, // ✅ Generate standalone server build for Hostinger Node.js hosting
  images: {
    domains: ['localhost'], // ✅ Add allowed image domains (add more if needed)
  },
};

module.exports = nextConfig;
