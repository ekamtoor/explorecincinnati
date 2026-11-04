/* Absolute origin for share tags, sitemap and canonical URLs. */
export const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://explorecincinnati.vercel.app');
