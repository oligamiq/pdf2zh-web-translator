import { A } from "@solidjs/router";

export default function Index() {
  return (
    <main class="container">
      <div style="padding: 40px; text-align: center;">
        <h1>PDF翻訳</h1>
        <p>PDFをアップロードして翻訳済みPDFと対訳PDFを作成できます。</p>
        
        <div style="margin: 32px 0;">
          <A href="/app" class="btn primary-cta" style="font-size: 1.25rem; padding: 12px 24px; background: var(--accent); color: white; border-radius: 8px; text-decoration: none;">PDFを翻訳する</A>
        </div>

        <div style="margin-top: 48px; display: flex; gap: 16px; justify-content: center;">
          <A href="/about" style="color: var(--accent);">利用制限と注意事項</A>
          <A href="/licenses" style="color: var(--accent);">ライセンス</A>
          <a href="https://github.com/oligamiq/pdf2zh-web-translator" style="color: var(--accent);">GitHubリポジトリ</a>
        </div>
      </div>
    </main>
  );
}
