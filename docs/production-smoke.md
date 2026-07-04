# 本番環境 Smoke Test 手順

本番環境 (Production) では E2E Auth Bypass や Turnstile Mock が完全に無効化されているため、Playwright 等の Headless Browser 自動テストがブロックされる場合があります。
そのため、デプロイ後には以下の手順で人間が手動検証 (Smoke Test) を行ってください。

## 手順

1. `https://pdftr.pages.dev/` を開く
2. `/` がランディングページ (LP) として表示されることを確認する
3. `https://pdftr.pages.dev/app` を開く
4. ゲスト状態（未ログイン）で小さいサイズのPDFを選択する
5. PDF選択後に Cloudflare Turnstile のウィジェットが表示されることを確認する
6. Turnstile を通過して翻訳を開始する
7. ジョブのステータスが `queued` → `running` → `completed` になることを確認する
8. 完了後にPDFの表示およびダウンロードができることを確認する
9. Googleログインボタンを開き、ポップアップをキャンセルした後に再度クリックできることを確認する
10. `/settings` を開くと `/app/settings` にリダイレクト（または誘導）されることを確認する
11. `/jobs/:id` を開くと `/app/jobs/:id` にリダイレクト（または誘導）されることを確認する
