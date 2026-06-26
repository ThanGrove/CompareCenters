/** @type {import('next').NextConfig} */
const nextConfig = {
  // The crawler pipeline imports Playwright/Cheerio; keep them server-only.
  serverExternalPackages: ["playwright", "@prisma/client"],
};

export default nextConfig;
