# 開発ガイドライン (Contributing)

PDF翻訳 Web Translator プロジェクトへようこそ！

## 開発環境のセットアップ

Node.js (v24+) と Python (v3.11+) が必要です。

```bash
# リポジトリのクローン
git clone https://github.com/oligamiq/pdf2zh-web-translator.git
cd pdf2zh-web-translator

# 依存パッケージのインストール
npm ci
```

## 主要コマンド

* **`npm ci`**: 依存関係のクリーンインストール
* **`npm run dev`**: ローカル開発サーバー起動
* **`npm run build`**: 本番用ビルドとSSGファイルの生成
* **`npm run test:e2e`**: E2Eテスト（Playwright）の実行

## コミット時の注意事項

1. **シークレットを含めない**: 絶対に実APIキーやシークレットをコミットしないでください。
2. **`package-lock.json` の同期**: `package.json` を変更した場合は、必ず repo root で `npm install` または `npm install --package-lock-only` を実行し、`package-lock.json` も一緒にコミットしてください。
3. **ライセンスの更新**: 新しいOSS依存を追加した場合は、必ず `THIRD_PARTY_NOTICES.md` を更新するスクリプトを実行してください。

## Pull Request を作成する前の確認

PRを作成する前に、ローカルで以下のコマンドが通ることを確認してください。

```bash
npm ci
npm run build
npm run test:e2e
```
