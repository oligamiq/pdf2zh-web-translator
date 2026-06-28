# PDF翻訳 (pdf2zh-web-translator)

PDFをアップロードすると、翻訳済みPDFと対訳PDFを生成してダウンロードできるWebアプリです。
内部で [pdf2zh-next](https://github.com/oligamiq/pdf2zh-next) 等を利用し、各社のLLM APIを通じて高品質な翻訳を行います。

## リンク

* **公開URL**: https://pdftr.pages.dev
* **ソースコード**: https://github.com/oligamiq/pdf2zh-web-translator

## 構成

このリポジトリは以下の3つのコンポーネントで構成されるモノレポです：

1. **frontend**: Cloudflare Pages でホストされるWeb UI。React(Solid.js) + Vite。一部ページ(`/about`, `/licenses`)はSSGで静的生成されます。
2. **worker**: Cloudflare Workers + D1 で動作するAPIサーバー。ユーザー管理、ジョブ管理、設定管理を行います。
3. **pc-api-python**: 実際のPDF翻訳処理を担当するPythonバックエンド。Cloudflare Accessを通してWorkerから非同期ジョブを受け取ります。

## ローカル開発手順

### 必須環境
- Node.js 24+
- Python 3.11+
- Wrangler CLI

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/oligamiq/pdf2zh-web-translator.git
   cd pdf2zh-web-translator
   npm ci
   ```

2. **環境変数の設定**
   各ディレクトリの `.env.example` をコピーして `.env` または `.dev.vars` を作成します。
   **注意: 絶対に実APIキーやシークレットをコミットしないでください。**
   
   * `worker/.dev.vars`:
     ```
     ENVIRONMENT=development
     CORS_ORIGIN=http://localhost:5173
     AUTH_MODE=mock
     ```
   * `pc-api-python/.env`:
     ```
     ENVIRONMENT=development
     WORKER_API_BASE_URL=http://localhost:8787
     AGENT_TOKEN=mock_agent_token
     ```
   * `frontend/.env.local`:
     ```
     VITE_API_BASE_URL=http://localhost:8787
     ```

3. **ローカルサーバーの起動**
   ```bash
   npm run dev
   ```
   これで frontend, worker, pc-api-python 全てが連動して起動します。

## デプロイ手順

本番環境(Cloudflare)へのデプロイは以下のコマンドで行います。事前に `wrangler login` が必要です。

```bash
# 全体をデプロイ
npm run deploy

# 個別にデプロイ
npm run deploy:worker
npm run deploy:frontend
```

## ライセンス注意

このアプリ自体の独自コードは **MIT License** として提供します。
ただし、変換処理の中核として利用している `pdf2zh-next` は **AGPL-3.0** ライセンスで提供されています。

ご自身でこのアプリをホストして公開サービスとして提供する場合、バックエンド処理がネットワーク経由で利用されるため、AGPL-3.0の条項に基づきバックエンド側のソースコード（修正事項含む）を利用者に公開する義務が生じる可能性があります。詳細なライセンス情報は `/licenses` ページまたは `THIRD_PARTY_NOTICES.md` を参照してください。
