import { createSignal, onMount, Show } from 'solid-js';
import { uploadJob } from '../api';
import { auth } from '../firebase';

export default function UploadForm() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [apiKey, setApiKey] = createSignal("");
  const [turnstileToken, setTurnstileToken] = createSignal("");
  
  const isGuest = () => !auth.currentUser;

  onMount(() => {
    if (isGuest()) {
      // @ts-ignore
      if (window.turnstile) {
        // @ts-ignore
        window.turnstile.render('#turnstile-container', {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: function(token: string) {
            setTurnstileToken(token);
          }
        });
      }
    }
  });

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    if (isGuest() && !turnstileToken()) {
      setError("Please complete the Turnstile challenge first.");
      input.value = '';
      return;
    }
    
    if (isGuest() && !apiKey()) {
      const confirmProceed = window.confirm(
        "Ollama APIキーなしで続行しますか？\n\nAPIキーなしでもお試し変換できますが、無料/共有のfallbackを使うため、混雑時や制限到達時に失敗することがあります。\n処理速度や成功率は保証されません。\n\n安定して使うには、OllamaのAPIキーを発行して入力してください。\n入力したAPIキーは今回の変換ジョブにのみ使用され、保存・再表示されません。"
      );
      if (!confirmProceed) {
        input.value = '';
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
      for (let i = 0; i < input.files.length; i++) {
        await uploadJob(input.files[i], turnstileToken(), apiKey(), clientId);
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      // Reset turnstile
      if (isGuest()) {
        // @ts-ignore
        if (window.turnstile) window.turnstile.reset();
        setTurnstileToken("");
      }
    } finally {
      setLoading(false);
      input.value = '';
    }
  };

  return (
    <div class="panel" style="text-align: left; padding: 32px; position: relative; margin-bottom: 24px;">
      <h3 style="margin-top: 0;">Upload PDF</h3>
      {error() && <div style="color: var(--danger); margin-bottom: 16px;">{error()}</div>}
      
      <Show when={isGuest()}>
        <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--accent); padding: 12px; margin-bottom: 20px; font-size: 14px;">
          <h4 style="margin: 0 0 8px 0; color: var(--accent);">Guest Mode</h4>
          <ul style="margin: 0; padding-left: 20px; color: var(--text-muted);">
            <li>Max file size: 5 MiB</li>
            <li>Limited to 1 job per day per device</li>
            <li>Results are deleted after 24 hours</li>
          </ul>
          
          <div style="margin-top: 16px;">
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
              This API key is used only for this conversion job and will not be saved.
            </div>
            
            <details style="margin-top: 8px; font-size: 13px;">
              <summary style="cursor: pointer; color: var(--accent);">How to get an Ollama API key?</summary>
              <div style="margin-top: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Ollamaにログインします</li>
                  <li>API Keys settingsを開きます</li>
                  <li>Create API Keyを押します</li>
                  <li>表示されたキーをコピーします</li>
                  <li>この画面の "Ollama API Key" に貼り付けます</li>
                </ol>
                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                  <img src="/guide/ollama-api-key-1.png" alt="Step 1" style="height: 100px; border-radius: 4px; border: 1px solid var(--border);" onError={(e) => e.currentTarget.style.display='none'} />
                  <img src="/guide/ollama-api-key-2.png" alt="Step 2" style="height: 100px; border-radius: 4px; border: 1px solid var(--border);" onError={(e) => e.currentTarget.style.display='none'} />
                  <img src="/guide/ollama-api-key-3.png" alt="Step 3" style="height: 100px; border-radius: 4px; border: 1px solid var(--border);" onError={(e) => e.currentTarget.style.display='none'} />
                </div>
              </div>
            </details>
          </div>
          
          <div id="turnstile-container" style="margin-top: 16px;"></div>
        </div>
      </Show>

      {loading() ? (
        <div style="text-align: center; padding: 40px; border: 2px dashed var(--border);">
          <p>Uploading...</p>
        </div>
      ) : (
        <div style="text-align: center; padding: 40px; border: 2px dashed var(--border); position: relative; cursor: pointer;">
          <p style="color: var(--text-muted); pointer-events: none;">Drag and drop or click to select PDF file</p>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange} 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
          />
        </div>
      )}
    </div>
  );
}
