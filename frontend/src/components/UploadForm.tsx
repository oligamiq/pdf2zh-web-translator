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
  
  const [isDragging, setIsDragging] = createSignal(false);
  let dragCounter = 0;

  const isGuest = () => authReady() && !currentUser();
  const isLoggedIn = () => authReady() && !!currentUser();

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
      setError("Initializing sign-in state... Please try again in a moment.");
      return;
    }

    if (isGuest() && !turnstileToken()) {
      setError("Please complete the Turnstile challenge first.");
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
      } else {
        setError(err.message);
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
            <h2 style={{ margin: 0, color: 'var(--accent)', "font-size": '2rem' }}>Drop PDF anywhere to upload</h2>
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
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)' }}>API Key Required</h3>
            <p style={{ margin: '0 0 24px 0' }}>You need an active LLM provider with an API key to perform this conversion. Please set one up in your settings.</p>
            <div style={{ display: 'flex', gap: '12px', "justify-content": 'flex-end' }}>
              <button class="btn btn-secondary" onClick={() => setShowApiKeyModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancel</button>
              <A href="/settings" class="btn" onClick={() => setShowApiKeyModal(false)}>Go to Settings</A>
            </div>
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
        <label style="display: block; font-weight: bold; margin-bottom: 4px;">Target Language</label>
        <select 
          class="input"
          value={targetLanguage()} 
          onChange={(e) => setTargetLanguage(e.currentTarget.value)}
          style="width: 100%; max-width: 400px;"
        >
          <option value="ja">Japanese</option>
          <option value="en">English</option>
          <option value="zh">Chinese</option>
          <option value="ko">Korean</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
        </select>
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
