# pdf2zh_next Web変換システム V2 実装計画

## 概要
Cloudflareエコシステム（Pages, Workers, D1, Tunnel）とFirebase Authを活用し、セキュアでスケーラブルなPDF翻訳Webサービスを構築する。実際のPDF変換処理（`pdf2zh_next`）はローカルPCのDockerコンテナ内で行い、外部からのアクセスはCloudflare Tunnel経由でのみ許可する。

## 構成図
```text
Browser (ユーザー)
  ↓ [HTTPS]
Cloudflare Pages (Frontend / SolidJS)
  ├ Firebase Auth ログイン
  └ APIリクエストを発行
  ↓ [HTTPS + Firebase ID Token]
Cloudflare Worker (Public API)
  ├ ID Token の検証
  ├ Cloudflare D1 操作（ジョブの状態管理、メタデータ）
  └ Workers VPC Service Binding経由でローカルPCへ通信
  ↓ [VPC]
Cloudflare Tunnel (Private Connector)
  ↓ [Local Network]
PC Local Docker Network
  ├ API Container (Go製プライベートAPI)
  │  ├ PDFアップロード受信・ファイルシステム保存
  │  ├ `pdf2zh_next` コマンド呼び出し (コンテナ内)
  │  └ ログ・ダウンロード配信
  └ Data Volume (HDD Bind Mount: uploads, outputs, logs, work)
```

## フェーズ分け

### Phase 1: 基礎インフラとDBの構築
- [ ] Cloudflare D1 データベーススキーマ設計（`jobs` テーブル）と作成
- [ ] PC側Docker環境の整備
  - `docker-compose.yml` 作成（Go APIコンテナ、`cloudflared` トンネルコンテナ）
  - ローカルデータディレクトリのマウント設定
- [ ] Cloudflare Tunnelのプライベートネットワーク設定、Workers VPCへの接続確認

### Phase 2: バックエンドAPIの実装
- [ ] **Cloudflare Worker (Public API)**
  - Firebase Admin SDK（または軽量なJWT検証）を用いたIDトークンの検証
  - D1へのジョブ登録・状態更新・取得エンドポイント（GET/POST /api/jobs）
  - PC側APIへのファイルアップロード中継（StreamまたはFormData転送）
  - ログ取得用オフセット付きポーリングエンドポイント中継
- [ ] **PC側 Go Private API**
  - Workerからのリクエストのみを受け付ける内部向けAPI
  - ファイル保存と `pdf2zh_next` プロセスの実行管理
  - ジョブ終了後、ダウンロード期限（1週間）を過ぎたファイルのクリーンアップバッチ

### Phase 3: フロントエンドの実装
- [ ] **SolidJS + Vite アプリケーション構築**
  - TailwindCSS等を用いたモダンで美しいUIの実装（Glassmorphism, Darkmode）
  - Firebase Auth SDKの導入（Googleログイン等）
  - ジョブ一覧画面、アップロードUI（ドラッグ＆ドロップ対応）
  - ジョブ詳細画面（SSEではなく、オフセット指定によるログのポーリング表示）
  - ダウンロードボタン実装（一括ZIP含む）

### Phase 4: 結合テストとデプロイ
- [ ] ローカル環境でのE2Eテスト
- [ ] Cloudflare Pages へのフロントエンドのデプロイ
- [ ] Cloudflare Workers への公開APIのデプロイ
- [ ] 本番環境（Firebase/Cloudflare）の設定変数の調整

## 留意事項
- **Python禁止（Web層）**: Web/API周りはGo(ローカル)とTypeScript(Cloudflare)で統一し、Pythonは実行環境(`pdf2zh_next`)内のみに限定する。
- **データ保管**: すべてのPDF、ログ、作業ファイルはPCのHDD上に配置し、Cloudflare上にはメタデータ（D1）のみを保存する。
- **セキュリティ**: PC側Dockerコンテナはポートを外部（ホストマシンのインターフェース等）に公開せず、TunnelコンテナとDocker内部ネットワークのみで通信させる。
