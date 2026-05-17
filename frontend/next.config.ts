import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.SAM_SERVER_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ]
  },
}

export default config
