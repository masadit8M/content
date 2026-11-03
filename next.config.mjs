/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
    JWT_SECRET: process.env.JWT_SECRET || "arjuna_consulting_workspace_secret_key_super_secure_2026",
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"]
  }
};

export default nextConfig;
