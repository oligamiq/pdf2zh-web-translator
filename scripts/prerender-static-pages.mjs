import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://pdftr.pages.dev';

const pages = [
  {
    route: '/about',
    title: '利用制限と注意事項 - PDF翻訳',
    description: 'PDF翻訳Webアプリの利用制限、保存期間、APIキー、外部サービス利用時の注意事項を説明します。',
    ogDescription: 'PDF翻訳Webアプリの利用制限、保存期間、APIキー、外部サービス利用時の注意事項を説明します。',
    content: `
      <div style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
        <h1>利用制限と注意事項</h1>
        <p>PDFをアップロードすると、翻訳済みPDFと対訳PDFを生成してダウンロードできます。</p>
        <ul>
          <li>ゲスト利用: PDFは5 MiBまで、1日3件まで。</li>
          <li>ログイン利用: PDFは20 MiBまで、1日10件まで。</li>
        </ul>
        <h2>外部サービスについて</h2>
        <p>本サービスは翻訳処理に外部APIを利用する場合があります。</p>
        <a href="/licenses">ライセンスを見る</a>
      </div>
    `
  },
  {
    route: '/licenses',
    title: 'ライセンス - PDF翻訳',
    description: 'PDF翻訳Webアプリのライセンス、使用しているOSS、AGPL-3.0コンポーネント、第三者ライセンス情報を掲載しています。',
    ogDescription: 'PDF翻訳Webアプリのライセンス、使用しているOSS、AGPL-3.0コンポーネント、第三者ライセンス情報を掲載しています。',
    content: `
      <div style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
        <h1>ライセンス</h1>
        <p>このアプリのソースコードは MIT License のもとで提供されます。</p>
        <p>pdf2zh-next は AGPL-3.0 ライセンスで提供されています。</p>
        <h2>第三者ライセンス</h2>
        <p>詳細な第三者ライセンスは THIRD_PARTY_NOTICES.md を参照してください。</p>
        <p>ソースコードを見る:</p>
        <a href="https://github.com/oligamiq/pdf2zh-web-translator">https://github.com/oligamiq/pdf2zh-web-translator</a>
      </div>
    `
  }
];

function prerender() {
  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('dist/index.html not found. Build first.');
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace base URL if PUBLIC_SITE_URL is set
  if (SITE_URL !== 'https://pdftr.pages.dev') {
    template = template.replaceAll('https://pdftr.pages.dev', SITE_URL);
  }

  for (const page of pages) {
    let html = template.replace('<div id="root"></div>', '<div id="root">' + page.content + '</div>');
    
    // Replace SEO tags
    html = html.replace(/<title>.*?<\/title>/, '<title>' + page.title + '</title>');
    html = html.replace(/<meta name="description" content=".*?" \/>/, '<meta name="description" content="' + page.description + '" />');
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, '<link rel="canonical" href="' + SITE_URL + page.route + '" />');
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, '<meta property="og:title" content="' + page.title + '" />');
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, '<meta property="og:description" content="' + page.ogDescription + '" />');
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, '<meta property="og:url" content="' + SITE_URL + page.route + '" />');
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, '<meta name="twitter:title" content="' + page.title + '" />');
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, '<meta name="twitter:description" content="' + page.ogDescription + '" />');
    
    const routeName = page.route.replace(/^\//, ''); // e.g. "about"
    
    // Write as about/index.html (for /about/ requests)
    const targetDir = path.join(distDir, routeName);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), html);
    console.log(`Prerendered ${page.route}/index.html`);

    // Write as about.html (for /about requests to avoid 308 redirect)
    fs.writeFileSync(path.join(distDir, routeName + '.html'), html);
    console.log(`Prerendered ${page.route}.html`);
  }

  // Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${SITE_URL}/licenses</loc>
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

Sitemap: ${SITE_URL}/sitemap.xml`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
  console.log('Generated robots.txt');
}

prerender();
