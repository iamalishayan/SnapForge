/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pino worker deps out of the webpack bundle (prevents thread-stream crashes)
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
}

module.exports = nextConfig
