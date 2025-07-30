/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig