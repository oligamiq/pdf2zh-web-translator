import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="container" style="padding: 40px; text-align: center;">
      <h1>404 Not Found</h1>
      <p>ページが見つかりません。</p>
      <A href="/" style="color: var(--accent);">トップへ戻る</A>
    </main>
  );
}
