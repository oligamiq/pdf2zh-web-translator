import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = join(rootDir, 'frontend', 'dist');

function findHtmlFiles(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      // _server, _worker などビルド中間ディレクトリは除外
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.warn(`Error reading directory ${dir}:`, e);
  }
  return results;
}

function inlineCss() {
  const htmlFiles = findHtmlFiles(distDir);
  // distDir 直下の HTML (index.html, 404.html, about.html 等) も確実に対象にする
  const rootFiles = readdirSync(distDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => join(distDir, entry.name));
  
  const allHtmlFiles = [...new Set([...htmlFiles, ...rootFiles])];
  let inlinedCount = 0;

  for (const htmlPath of allHtmlFiles) {
    let html = readFileSync(htmlPath, 'utf8');
    
    // <link href="...css" rel="stylesheet" ...> を正規表現で抽出
    const linkRegex = /<link[^>]*href="(\/_build\/assets\/[^"]+\.css)"[^>]*rel="stylesheet"[^>]*\/?>/g;
    
    html = html.replace(linkRegex, (match, cssPath) => {
      // cssPath は /_build/assets/... になるので、先頭の / を除去して distDir と結合
      const cssFile = join(distDir, cssPath.replace(/^\//, ''));
      try {
        const css = readFileSync(cssFile, 'utf8');
        inlinedCount++;
        // 1. インラインスタイル (レンダリングブロック解消)
        // 2. 非同期ロード (他のページや次回以降の訪問でのキャッシュ活用)
        // 3. noscript フォールバック
        return `<style>${css}</style>` +
               `<link rel="preload" href="${cssPath}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
               `<noscript><link rel="stylesheet" href="${cssPath}"></noscript>`;
      } catch (e) {
        console.warn(`Could not read CSS file: ${cssFile}`, e.message);
        return match; // エラー時は元に戻す
      }
    });
    
    writeFileSync(htmlPath, html);
  }
  console.log(`Inlined CSS in ${inlinedCount} places across ${allHtmlFiles.length} HTML files.`);
}

inlineCss();
