import fs from 'fs';
import path from 'path';
import { CITIES } from './src/config/cityConfig.js';

const BASE_URL = 'https://bussikartta.koodauslahtinen.fi';

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]; // Kuinka muotoiltu pvm: YYYY-MM-DD
  let citiesCount = 0;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Etusivu / Oletussivu
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Kaikki kaupunkisivut
  Object.values(CITIES).forEach((city) => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/${city.id.toLowerCase()}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
    citiesCount++;
  });

  xml += `</urlset>`;

  // Kirjoitetaan tiedosto public/sitemap.xml
  const outputPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');

  console.log(`✅ sitemap.xml luotu osoitteeseen public/sitemap.xml! (${citiesCount} kaupunkia)`);
}

generateSitemap();