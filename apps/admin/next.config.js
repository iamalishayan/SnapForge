/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pino worker deps and sharp out of the webpack bundle
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'sharp'],
  },
}

module.exports = nextConfig
