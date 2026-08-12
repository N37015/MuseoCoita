/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  assetPrefix: './',
  
  // La forma oficial en Next.js 16 para proteger tu base de datos
  serverExternalPackages: ['better-sqlite3'],
  
  // Esto silencia el error del motor y le dice a Turbopack que todo está en orden
  turbopack: {},
};

module.exports = nextConfig;