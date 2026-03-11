/**
 * Generates sitemap-partners.xml with all /partners/:city/:businessType URLs.
 * Run from project root: node scripts/generate-partner-sitemap.cjs
 * Must match frontend/src/data/partnerSEO.js (CITIES and BUSINESS_TYPES slugs).
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://lynkr.club';
const LASTMOD = '2025-02-26';
const CITIES = ['delhi', 'mumbai', 'bangalore', 'pune', 'hyderabad', 'gurgaon', 'noida', 'chandigarh', 'ahmedabad', 'jaipur'];
const BUSINESS_TYPES = ['cafes', 'restaurants', 'gyms', 'retail-stores', 'salons', 'bars', 'coffee-shops', 'fitness-studios'];

const urls = [];
for (const city of CITIES) {
  for (const business of BUSINESS_TYPES) {
    urls.push(`  <url>\n    <loc>${BASE}/partners/${city}/${business}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

const outPath = path.join(__dirname, '..', 'public', 'sitemap-partners.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log('Wrote', outPath, 'with', CITIES.length * BUSINESS_TYPES.length, 'URLs');
