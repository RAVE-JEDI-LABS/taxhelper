/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 420, 840],
    minimumCacheTTL: 60,
  },
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    distDir: '../build-landing',
  }),
}

module.exports = nextConfig
