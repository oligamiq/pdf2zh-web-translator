import { createSignal, onMount, onCleanup, createEffect, Show } from 'solid-js';
import { uploadJob, getApiBasicSettings } from '../api';
import { currentUser, authReady } from '../authState';
import { A } from '@solidjs/router';

export default function UploadForm(props: { onUploadSuccess?: () => void }) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [showApiKeyModal, setShowApiKeyModal] = createSignal(false);
  const [turnstileToken, setTurnstileToken] = createSignal("");
  const [targetLanguage, setTargetLanguage] = createSignal("ja"); // Default
  const [limits, setLimits] = createSignal<any>(null);
  
  const [isDragging, setIsDragging] = createSignal(false);
  let dragCounter = 0;

  const isGuest = () => authReady() && !currentUser();

  onMount(() => {
    // Turnstile logic...
    const renderTurnstile = () => {
      // @ts-ignore
      if (window.turnstile && document.getElementById('turnstile-container')) {
        // @ts-ignore
        window.turnstile.render('#turnstile-container', {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: function(token: string) {
            setTurnstileToken(token);
          }
        });
      }
    };
    
    const loadTurnstile = () => {
      // @ts-ignore
      if (window.turnstile || document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
        setTimeout(renderTurnstile, 500);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(renderTurnstile, 500);
      document.head.appendChild(script);
    };

    loadTurnstile();

    // Drag and drop logic...
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!isDragging()) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type !== 'application/pdf') {
          setError("PDFファイルをアップロードしてください。");
          return;
        }
        await processFiles(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    onCleanup(() => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    });
  });

  createEffect(() => {
    if (authReady()) {
      import('../api').then(({ getLimits }) => {
        getLimits().then(setLimits).catch(console.error);
      });
    }
    if (currentUser()) {
      getApiBasicSettings().then(data => {
        if (data.target_language) {
          setTargetLanguage(data.target_language);
        }
      }).catch(console.error);
    }
  });

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    if (!authReady()) {
      setError("サインイン状態を初期化中です... 少し待ってからもう一度お試しください。");
      return;
    }

    if (isGuest() && !turnstileToken()) {
      setError("まずはTurnstileチャレンジを完了してください。");
      return;
    }

    setLoading(true);
    setError("");
    setShowApiKeyModal(false);
    
    let clientId = localStorage.getItem('public_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('public_client_id', clientId);
    }
    
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadJob(files[i], targetLanguage(), turnstileToken(), clientId);
      }
      if (props.onUploadSuccess) {
        props.onUploadSuccess();
      }
    } catch (err: any) {
      if (err.message && err.message.includes('api_key_required')) {
        setShowApiKeyModal(true);
      } else if (err.message && err.message.includes('file_too_large')) {
        setError(`PDFサイズが大きすぎます。${isGuest() ? 'ゲスト利用では5 MiBまでです。' : ''}`);
      } else if (err.message && err.message.includes('rate_limit_exceeded')) {
        setError('今日の変換回数上限に達しました。明日以降に再試行してください。');
      } else if (err.message && err.message.includes('Failed to fetch')) {
        setError('変換サーバーに接続できません。');
      } else {
        setError(`変換に失敗しました: ${err.message}`);
      }
      if (isGuest()) {
        // @ts-ignore
        if (window.turnstile) window.turnstile.reset();
        setTurnstileToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await processFiles(input.files);
    input.value = '';
  };

  return (
    <>
      <Show when={isDragging()}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          "z-index": 9999,
          display: 'flex',
          "align-items": 'center',
          "justify-content": 'center',
          "backdrop-filter": 'blur(4px)'
        }}>
          <div style={{
            padding: '48px',
            border: '4px dashed var(--accent)',
            "border-radius": '16px',
            background: 'var(--bg-color)',
            "text-align": 'center',
            "box-shadow": '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ margin: 0, color: 'var(--accent)', "font-size": '2rem' }}>どこでもドロップしてアップロード</h2>
          </div>
        </div>
      </Show>

      <Show when={showApiKeyModal()}>
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          "z-index": 9998,
          display: 'flex', "align-items": 'center', "justify-content": 'center'
        }}>
          <div style={{ background: 'var(--bg-color)', padding: '24px', "border-radius": '8px', "max-width": '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)' }}>APIキーが必要です</h3>
            <p style={{ margin: '0 0 24px 0' }}>APIキーが設定されていません。設定画面でAPIキーを登録してください。</p>
            <div style={{ display: 'flex', gap: '12px', "justify-content": 'flex-end' }}>
              <button class="btn btn-secondary" onClick={() => setShowApiKeyModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>キャンセル</button>
              <A href="/settings" class="btn" onClick={() => setShowApiKeyModal(false)}>設定へ移動</A>
            </div>
          </div>
        </div>
      </Show>

      <div class="panel upload-card" style="text-align: left; position: relative; margin-bottom: 24px;">
        <h3 class="upload-title" style="margin-top: 0;">アップロード</h3>
        {error() && <div style="color: var(--danger); margin-bottom: 16px; white-space: pre-wrap;">{error()}</div>}

      {loading() ? (
        <div style="text-align: center; padding: 40px; border: 2px dashed var(--border);">
          <p>アップロード中...</p>
        </div>
      ) : (
        <>
          <div class="dropzone" style="text-align: center; padding: 40px; border: 2px dashed var(--border); position: relative; cursor: pointer; margin-bottom: 16px;">
            <Show when={!authReady()}>
              <p style="color: var(--accent); margin-bottom: 8px; font-weight: bold;">サインイン状態を初期化中...</p>
            </Show>
            <p style="color: var(--text-muted); pointer-events: none;">ドラッグ＆ドロップ、またはクリックしてPDFファイルを選択</p>
            <input 
              data-testid="pdf-file-input"
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange} 
              disabled={!authReady()}
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
            />
          </div>

          <div class="mobile-file-picker" style="margin-bottom: 16px;">
            <input 
              id="mobile-pdf-file-input"
              data-testid="mobile-pdf-file-input"
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange} 
              disabled={!authReady()}
              hidden
            />
            <label 
              for="mobile-pdf-file-input"
              data-testid="file-select-button" 
              class={`btn primary-file-button ${!authReady() ? 'disabled' : ''}`}
            >
              {!authReady() ? 'サインイン確認中...' : 'PDFファイルを選択'}
            </label>
            <Show when={limits()}>
              <div class="file-help-text">
                PDFのみ / 最大{limits()!.pdf_max_bytes / (1024 * 1024)} MiB
              </div>
            </Show>
          </div>
        </>
      )}

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: bold; margin-bottom: 4px;">翻訳先言語</label>
        <select 
          class="input"
          value={targetLanguage()} 
          onChange={(e) => setTargetLanguage(e.currentTarget.value)}
          style="width: 100%; max-width: 400px;"
        >
          <option value="ja">日本語</option>
          <option value="en">英語</option>
          <option value="zh">中国語</option>
          <option value="ko">韓国語</option>
          <option value="fr">フランス語</option>
          <option value="de">ドイツ語</option>
          <option value="es">スペイン語</option>
        </select>
      </div>

      <Show when={limits()}>
        <details class="guest-limit-details" style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--accent); padding: 12px; margin-bottom: 16px; font-size: 14px;">
          <summary style="cursor: pointer; font-weight: bold; color: var(--accent);">
            {limits().scope === 'public' 
              ? `ゲスト利用: ${limits().pdf_max_bytes / (1024 * 1024)} MiB / 1日${limits().jobs_per_day}件 / ${limits().public_job_expiry_hours}時間保存`
              : `ログイン中: ${limits().pdf_max_bytes / (1024 * 1024)} MiB / 1日${limits().jobs_per_day}件 / ${limits().retention_days}日間保存`
            }
          </summary>
          <p style="margin: 8px 0 0 0; color: var(--text-muted);">
            {limits().scope === 'public' 
              ? `PDFは${limits().pdf_max_bytes / (1024 * 1024)} MiBまで、1日${limits().jobs_per_day}件まで。結果は${limits().public_job_expiry_hours}時間程度で期限切れになります。`
              : `PDFは${limits().pdf_max_bytes / (1024 * 1024)} MiBまで、1日${limits().jobs_per_day}件まで。履歴は${limits().retention_days}日間保持されます。`
            }
          </p>
          <A href="/about" style="color: var(--accent); text-decoration: none; font-weight: bold;">&rarr; 利用制限と注意事項</A>
          <span style="margin: 0 8px; color: var(--border);">|</span>
          <A href="/licenses" style="color: var(--accent); text-decoration: none; font-weight: bold;">ライセンス</A>
        </details>
      </Show>

      <Show when={limits() && limits().scope === 'public'}>
        <div id="turnstile-container" class="turnstile-container" style="margin-top: 16px;"></div>
        <Show when={turnstileToken()}>
          <div data-testid="turnstile-ready" style="display: none;"></div>
        </Show>
      </Show>
    </div>
    </>
  );
}
