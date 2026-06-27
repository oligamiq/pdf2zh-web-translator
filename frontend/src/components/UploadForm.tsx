import { createSignal, onMount, onCleanup, createEffect, Show } from 'solid-js';
import { uploadJob, getLlmSettings, updateLlmSettings } from '../api';
import { currentUser, authReady } from '../authState';

export default function UploadForm(props: { onUploadSuccess?: () => void }) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [apiKey, setApiKey] = createSignal("");
  const [saveApiKeyToSettings, setSaveApiKeyToSettings] = createSignal(false);
  const [turnstileToken, setTurnstileToken] = createSignal("");
  
  const [showSavePrompt, setShowSavePrompt] = createSignal(false);
  const [promptLoading, setPromptLoading] = createSignal(false);
  const [promptDismissed, setPromptDismissed] = createSignal(false);
  
  const [isDragging, setIsDragging] = createSignal(false);
  let dragCounter = 0;

  const isGuest = () => authReady() && !currentUser();
  const isLoggedIn = () => authReady() && !!currentUser();

  onMount(() => {
    // We can't definitively check isGuest() here because auth may still be initializing,
    // but we can render turnstile anytime, or we could wait for authReady.
    // Turnstile requires DOM element, let's render it when container exists.
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

    // Global Drag & Drop handlers
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
          setError("Please upload a PDF file.");
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
    if (currentUser() && apiKey() && !promptDismissed()) {
      // Check if user has API key
      getLlmSettings().then(data => {
        if (!data.has_api_key && apiKey()) {
          setShowSavePrompt(true);
        }
      }).catch(console.error);
    } else {
      setShowSavePrompt(false);
    }
  });

  const handleSaveToSettings = async () => {
    setPromptLoading(true);
    try {
      await updateLlmSettings({ api_key: apiKey().trim() });
      setShowSavePrompt(false);
      setPromptDismissed(true);
    } catch (err: any) {
      setError("Failed to save API key: " + err.message);
    } finally {
      setPromptLoading(false);
    }
  };

  const handleDismissSave = () => {
    setShowSavePrompt(false);
    setPromptDismissed(true);
  };

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    if (!authReady()) {
      setError("Initializing sign-in state... Please try again in a moment.");
      return;
    }

    if (isGuest() && !turnstileToken()) {
      setError("Please complete the Turnstile challenge first.");
      return;
    }
    
    if (isGuest() && !apiKey()) {
      const confirmProceed = window.confirm(
        "Ollama APIキーなしで続行しますか？\n\nAPIキーなしでもお試し変換できますが、無料/共有のfallbackを使うため、混雑時や制限到達時に失敗することがあります。\n処理速度や成功率は保証されません。\n\n安定して使うには、OllamaのAPIキーを発行して入力してください。\n入力したAPIキーは今回の変換ジョブにのみ使用され、保存・再表示されません。"
      );
      if (!confirmProceed) {
        return;
      }
    }

    setLoading(true);
    setError("");
    
    // Get client id from localstorage or create it
    let clientId = localStorage.getItem('public_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('public_client_id', clientId);
    }
    
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadJob(files[i], turnstileToken(), apiKey(), clientId, saveApiKeyToSettings());
      }
      if (props.onUploadSuccess) {
        props.onUploadSuccess();
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Public fallback LLM is not configured')) {
        setError("APIキーなしのお試し変換は現在利用できません。\nOllama APIキーを入力して再試行するか、Googleログイン後にSettingsでAPIキーを保存してください。");
      } else {
        setError(err.message);
      }
      // Reset turnstile
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
            <h2 style={{ margin: 0, color: 'var(--accent)', "font-size": '2rem' }}>Drop PDF anywhere to upload</h2>
          </div>
        </div>
      </Show>

      <div class="panel" style="text-align: left; padding: 32px; position: relative; margin-bottom: 24px;">
        <h3 style="margin-top: 0;">Upload PDF</h3>
        {error() && <div style="color: var(--danger); margin-bottom: 16px; white-space: pre-wrap;">{error()}</div>}
      
      <Show when={isGuest()}>
        <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--accent); padding: 12px; margin-bottom: 20px; font-size: 14px;">
          <h4 style="margin: 0 0 8px 0; color: var(--accent);">Guest Mode</h4>
          <ul style="margin: 0; padding-left: 20px; color: var(--text-muted);">
            <li>Max file size: 5 MiB</li>
            <li>Limited to 1 job per day per device</li>
            <li>Results are deleted after 24 hours</li>
          </ul>
          
          <div id="turnstile-container" style="margin-top: 16px;"></div>
          <Show when={turnstileToken()}>
            <div data-testid="turnstile-ready" style="display: none;"></div>
          </Show>
        </div>
      </Show>

      <div style="margin-top: 16px; margin-bottom: 24px;">
        <label style="display: block; font-weight: bold; margin-bottom: 4px;">Ollama API Key (Optional for stable conversion)</label>
        <input 
          type="password" 
          class="input"
          placeholder="sk-..." 
          value={apiKey()} 
          onInput={(e) => setApiKey(e.currentTarget.value)}
          style="width: 100%; max-width: 400px;"
        />
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          <Show when={isGuest()}>
            このAPI keyは今回の変換ジョブにのみ使用され、ログインしていないため保存されません。<br/>
            Googleログインすると、アカウント設定に保存できます。
          </Show>
          <Show when={isLoggedIn()}>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 8px;">
              <input 
                type="checkbox" 
                checked={saveApiKeyToSettings()} 
                onChange={(e) => setSaveApiKeyToSettings(e.currentTarget.checked)}
              />
              Save this API key to my account settings
            </label>
          </Show>
        </div>
        
        <Show when={showSavePrompt()}>
          <div style="margin-top: 16px; padding: 16px; background: var(--bg-color, #1f2937); border: 1px solid var(--accent); border-radius: 8px;">
            <p style="margin: 0 0 12px 0;">入力済みのOllama APIキーをアカウント設定に保存しますか？<br/>保存すると次回から入力不要になります。</p>
            <div style="display: flex; gap: 12px;">
              <button class="btn" onClick={handleSaveToSettings} disabled={promptLoading()}>
                {promptLoading() ? 'Saving...' : '保存する'}
              </button>
              <button class="btn btn-secondary" onClick={handleDismissSave} disabled={promptLoading()} style="background: transparent; border: 1px solid var(--border);">
                今回は保存しない
              </button>
            </div>
          </div>
        </Show>
        
        <details style="margin-top: 16px; font-size: 13px;">
          <summary style="cursor: pointer; color: var(--accent); display: inline-flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 16px; height: 16px; text-align: center; border-radius: 50%; background: var(--accent); color: white; line-height: 16px; font-size: 11px;">?</span>
            How to get an Ollama API key
          </summary>
          <div style="margin-top: 8px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid var(--border);">
            <ol style="margin: 0 0 16px 0; padding-left: 24px; line-height: 1.6;">
              <li>Ollamaにログインします</li>
              <li>上部メニューの <strong>Keys</strong> を開きます</li>
              <li><strong>Add API Key</strong> を押してキーを作成します</li>
              <li>表示されたキーをコピーします</li>
              <li>このアプリの “Ollama API Key” 欄に貼り付けます</li>
            </ol>
            
            <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 4px; border-left: 3px solid var(--accent); margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0; line-height: 1.5;">APIキーなしでもお試し変換はできますが、無料/共有枠を使うため、混雑時や制限到達時に失敗することがあります。</p>
              <p style="margin: 0; line-height: 1.5;">安定して使うには、自分のOllama API keyを入力してください。</p>
            </div>

            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px;">
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Keys タブの場所</div>
                <img src="/guide/ollama-api-key-keys.png" alt="Ollama API Keys UI" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.2);" onError={(e) => e.currentTarget.style.display='none'} />
              </div>
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">無料枠・使用量の制限</div>
                <img src="/guide/ollama-cloud-usage.png" alt="Ollama Usage Limits" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.2);" onError={(e) => e.currentTarget.style.display='none'} />
              </div>
            </div>
          </div>
        </details>
      </div>

      {loading() ? (
        <div style="text-align: center; padding: 40px; border: 2px dashed var(--border);">
          <p>Uploading...</p>
        </div>
      ) : (
        <div style="text-align: center; padding: 40px; border: 2px dashed var(--border); position: relative; cursor: pointer;">
          <Show when={!authReady()}>
            <p style="color: var(--accent); margin-bottom: 8px; font-weight: bold;">Initializing sign-in state...</p>
          </Show>
          <p style="color: var(--text-muted); pointer-events: none;">Drag and drop or click to select PDF file</p>
          <input 
            data-testid="pdf-file-input"
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange} 
            disabled={!authReady()}
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
          />
        </div>
      )}
    </div>
    </>
  );
}
