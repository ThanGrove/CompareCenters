/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Prisma client server-only (it has native bits).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
