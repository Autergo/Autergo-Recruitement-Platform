/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevent ESLint warnings from failing production builds on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
