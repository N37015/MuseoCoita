/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Esto silencia el error del motor y le dice a Turbopack que todo está en orden
  turbopack: {},
};

module.exports = nextConfig;