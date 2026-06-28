import { createResource, For, Show } from 'solid-js';
import { A } from '@solidjs/router';

interface LicenseItem {
  name: string;
  version: string;
  license: string;
  url: string;
  type: string;
}

import { isServer } from 'solid-js/web';

const fetchLicenses = async () => {
  if (isServer) return [];
  try {
    const res = await fetch('/third-party-licenses.json');
    if (!res.ok) throw new Error('Failed to fetch licenses');
    return await res.json() as LicenseItem[];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default function Licenses() {
  const [licenses] = createResource(fetchLicenses);

  return (
    <div style="padding: 32px; max-width: 800px; margin: 0 auto;">
      <h1 style="color: var(--accent); margin-bottom: 24px;">ライセンス</h1>
      <A href="/" style="display: inline-block; margin-bottom: 24px; color: var(--accent); text-decoration: none;">&larr; アップロード画面へ戻る</A>

      <div class="panel" style="margin-bottom: 24px; padding: 24px; border-left: 4px solid var(--danger);">
        <h2 style="margin-top: 0; color: var(--danger);">重要なライセンス上の注意</h2>
        <p>このアプリは変換処理に pdf2zh-next などのOSSを利用しています。</p>
        <p><strong>pdf2zh-next は AGPL-3.0 ライセンス</strong>で提供されています。</p>
        <p style="margin-top: 16px;">
          このアプリ自体の独自コードは MIT License として提供しますが、
          AGPLライセンスのコンポーネントを利用する部分には、各OSSのライセンス条件が適用されます。
        </p>
        <div style="margin-top: 16px;">
          ソースコードを見る: <br />
          <a href="https://github.com/oligamiq/pdf2zh-web-translator" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">
            https://github.com/oligamiq/pdf2zh-web-translator
          </a>
        </div>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">このアプリのライセンス</h2>
        <p>このアプリのソースコードは MIT License のもとで提供されます。</p>
        <p>ただし、利用している外部ライブラリやサービスには、それぞれのライセンス・利用規約が適用されます。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">翻訳対象PDFの権利についての注意</h2>
        <p>アップロードするPDFの著作権・利用権は利用者自身が確認してください。</p>
        <p>権利上問題のあるPDFや、第三者に送信できない文書はアップロードしないでください。</p>
      </div>

      <div class="panel" style="margin-bottom: 24px; padding: 24px;">
        <h2 style="margin-top: 0; color: var(--accent);">主要な依存ライブラリ</h2>
        <p style="margin-bottom: 16px;">このプロジェクトは以下のオープンソースソフトウェアを利用しています。</p>

        <Show when={licenses.loading}>
          <div>読み込み中...</div>
        </Show>
        <Show when={licenses() && licenses()!.length > 0}>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <For each={licenses()}>
              {(pkg) => (
                <div style="border: 1px solid var(--border); padding: 16px; border-radius: 8px; background: var(--bg-surface-hover);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold;">{pkg.name} <span style="font-weight: normal; font-size: 0.9em; opacity: 0.7;">v{pkg.version}</span></div>
                    <div style="font-size: 0.8em; padding: 2px 6px; background: var(--bg-body); border-radius: 4px;">{pkg.type}</div>
                  </div>
                  <div style="font-size: 0.9em; margin-bottom: 4px;">License: <strong>{pkg.license}</strong></div>
                  <Show when={pkg.url}>
                    <a href={pkg.url} target="_blank" rel="noopener noreferrer" style="font-size: 0.85em; color: var(--accent); text-decoration: underline;">
                      {pkg.url}
                    </a>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
