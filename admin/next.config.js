/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@taxhelper/shared'],
  images: {
    unoptimized: true,
  },
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    distDir: '../build/admin',
  }),
}

module.exports = nextConfig
