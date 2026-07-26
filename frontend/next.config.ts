import type { NextConfig } from 'next'

const getDestinationUrl = (path: string) => {
  const baseUrl = process.env.SAM_SERVER_URL ?? 'http://localhost:3001'
  return `${baseUrl}/${path}`;
}

const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: getDestinationUrl(':path*'),
      },
    ]
  },
}

export default config