import type { NextConfig } from 'next'

const getRewrites = () => {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.SAM_SERVER_URL ?? 'http://localhost:3001'}/:path*`,
    },
  ]
}

const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000'],
  async rewrites() {
    return getRewrites()
  },
}

export default config