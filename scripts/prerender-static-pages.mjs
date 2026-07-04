import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://pdftr.pages.dev';



function prerender() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Generate sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${SITE_URL}/licenses</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log('Generated sitemap.xml');

  // Generate robots.txt
  const robots = `User-agent: *
Allow: /
Disallow: /settings
Disallow: /jobs
Disallow: /api
Disallow: /agent
Disallow: /internal
Disallow: /app

Sitemap: ${SITE_URL}/sitemap.xml`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
  console.log('Generated robots.txt');

  // Fix _redirects (SolidStart/Nitro injects an invalid /* /404.html 404 rule for CF Pages)
  const redirectsPath = path.join(distDir, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    let redirects = fs.readFileSync(redirectsPath, 'utf-8');
    if (redirects.includes('/* /404.html 404')) {
      redirects = redirects.replace(/\/\* \/404\.html 404\n?/g, '');
      fs.writeFileSync(redirectsPath, redirects);
      console.log('Removed invalid 404 fallback from _redirects');
    }
  }

  // Ensure about.html and licenses.html exist and create folder structure
  const pagesToCopy = ['about', 'licenses'];
  for (const page of pagesToCopy) {
    const sourceHtml = path.join(distDir, `${page}.html`);
    if (!fs.existsSync(sourceHtml)) {
      throw new Error(`Missing expected static page: ${page}.html`);
    }
    const pageDir = path.join(distDir, page);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }
    fs.copyFileSync(sourceHtml, path.join(pageDir, 'index.html'));
    console.log(`Copied ${page}.html to ${page}/index.html`);
  }

  // Handled natively by Vinxi / Nitro (cloudflare-pages preset) in app.config.ts
}

prerender();
