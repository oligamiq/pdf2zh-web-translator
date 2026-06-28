import { A } from '@solidjs/router';

export default function About() {
  return (
    <div style="padding: 32px; max-width: 800px; margin: 0 auto;">
      <h1 style="color: var(--accent); margin-bottom: 24px;">利用制限と注意事項</h1>
      <A href="/" style="display: inline-block; margin-bottom: 24px; color: var(--accent); text-decoration: none;">&larr; アップロード画面へ戻る</A>
      
      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">このサイトについて</h2>
        <p>pdf2zhの公式Web UIです。お好みのLLM Providerを使ってPDFドキュメントを多言語に翻訳できます。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">利用制限</h2>
        <p><strong>ゲスト利用:</strong></p>
        <ul>
          <li>最大PDFサイズ: 5 MiB</li>
          <li>1日の変換上限: 3回</li>
        </ul>
        <p><strong>ログイン中:</strong></p>
        <ul>
          <li>最大PDFサイズ: 20 MiB</li>
          <li>1日の変換上限: 10回</li>
        </ul>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">APIキーについて</h2>
        <p>OpenAI互換のサービス（SiliconFlow、OpenAI、DeepSeekなど）のAPIキーをご自身で登録して利用できます。APIキーは暗号化されて保存され、あなたのドキュメント翻訳のみに使用されます。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">外部サービスと注意事項</h2>
        <p>本サービスでは外部のLLM Providerを利用します。利用にあたっては各Providerの利用規約やプライバシーポリシーに同意したものとみなされます。機密情報や個人情報のアップロードはお控えください。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">データ保持期間</h2>
        <p>ゲスト利用のファイルは約24時間で削除されます。ログインユーザーの履歴は7日間保持されます。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">禁止事項</h2>
        <p>システムの悪用、不正なスクレイピング、利用制限の意図的な回避などは固く禁じられています。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">ライセンス</h2>
        <p>このアプリのソースコード、および利用しているオープンソースソフトウェアのライセンスについては、以下のページをご確認ください。</p>
        <A href="/licenses" style="display: inline-block; margin-top: 16px; color: var(--accent);">ライセンスを見る</A>
      </div>
    </div>
  );
}
