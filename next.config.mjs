/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['knex', 'mysql2'],
  devIndicators: false,
};

export default nextConfig;