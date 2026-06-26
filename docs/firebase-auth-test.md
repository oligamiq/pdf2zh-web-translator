# Firebase Auth Mode E2E Test Strategy

Firebase Authモード（`AUTH_MODE=firebase`）でのWorkerとPC APIの挙動を検証するため、2種類のE2Eテストを用意しています。

## 1. Local Firebase JWT verification E2E (`scripts/e2e-firebase-local-smoke.sh`)
* **目的**: 外部のFirebaseプロジェクトに依存せず、CI環境などで高速に「JWT検証」「UIDの抽出と隔離」「未認証拒否」を検証する。
* **仕組み**: 
  * E2Eスクリプト内で動的にRSA鍵ペアを生成します。
  * 署名用の秘密鍵でテスト用のJWT（Firebase ID token相当）を生成します。
  * Workerに `.dev.vars` 経由で公開鍵（JWKS）を渡し、このテスト用JWTのみを検証するように上書き（Override）します。
  * これにより、完全にローカルでFirebase Auth同等の認証認可のテストが完結します。
* **検証内容**: tokenなし拒否、不正token拒否、正常token受容、他人のジョブへのアクセス拒否（UID isolation）。
* **用途**: 日常的な開発、CIでの自動実行向け。

## 2. Real Firebase Auth E2E (`scripts/e2e-firebase-real-auth-smoke.sh`) (今後実装)
* **目的**: 本物のFirebase Authプロジェクトから発行されたID tokenをWorkerがGoogleの公開鍵を用いて検証できるかを確認する。
* **仕組み**: 
  * 外部のFirebase Auth REST APIを叩いて専用のテストユーザー（`FIREBASE_E2E_EMAIL`, `FIREBASE_E2E_PASSWORD`）でログインし、本物のID tokenを取得します。
  * 取得したtokenでWorkerの `/jobs` APIを叩き、エンドツーエンドでの動作を確認します。
* **注意点**:
  * 外部のFirebaseに依存するため、CIには組み込まず手元での本番前確認用とします。
  * **テストユーザーは必ず専用のアカウントを使用し、本番ユーザーは使用しないでください。**
  * **token、パスワード、API keyはログに出力することを固く禁じます。**
