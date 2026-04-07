import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	serverExternalPackages: ['knex', 'mysql2'],
	devIndicators: false,
};

export default nextConfig;
