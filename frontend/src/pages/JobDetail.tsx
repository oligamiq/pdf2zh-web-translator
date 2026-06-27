import { createSignal, onMount, Show, onCleanup, createEffect } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { getJob, downloadJob, getJobAttempts } from '../api';
import LogViewer from '../components/LogViewer';
import { authReady, currentUser } from '../authState';

export default function JobDetail() {
  const params = useParams();
  const [job, setJob] = createSignal<any>(null);
  const [attempts, setAttempts] = createSignal<any[]>([]);
  const [error, setError] = createSignal("");
  const [downloading, setDownloading] = createSignal(false);

  const fetchJob = async () => {
    try {
      const data = await getJob(params.id!);
      setJob(data);
      const attemptsData = await getJobAttempts(params.id!);
      setAttempts(attemptsData || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  createEffect(() => {
    if (!authReady()) return;
    if (currentUser()) {} else {}
    fetchJob();
  });

  onMount(() => {
    const interval = setInterval(() => {
      if (!authReady()) return;
      const currentStatus = job()?.status;
      if (currentStatus === 'queued' || currentStatus === 'running') {
        fetchJob();
      }
    }, 5000);
    onCleanup(() => clearInterval(interval));
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const resp = await downloadJob(job().id);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translated_${job().id}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Download failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div class="container" style="display: flex; flex-direction: column; height: 100vh;">
      <div class="header" style="flex-shrink: 0;">
        <h1 style="margin: 0;">Job Details</h1>
        <div style="display: flex; gap: 12px;">
          <A href="/" class="btn" style="background: transparent; border: 1px solid var(--border); color: var(--text);">← Back</A>
        </div>
      </div>

      {error() && <div class="panel" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger);">{error()}</div>}

      <Show when={job()} fallback={<p>{!authReady() ? "Checking sign-in..." : "Loading job details..."}</p>}>
        <div class="panel" style="flex-shrink: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.875rem;">Filename</div>
            <div style="font-weight: 500;">{job().original_filename}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.875rem;">Status</div>
            <div style="font-weight: 500; text-transform: uppercase;">{job().status}</div>
            <Show when={job().status === 'running' && job().progress_percent !== undefined && job().progress_percent !== null}>
              <div style="margin-top: 8px; width: 100%; max-width: 200px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style={`width: ${Math.max(0, Math.min(100, Math.round(job().progress_percent ?? 0)))}%; background: #60a5fa; height: 100%; transition: width 0.3s;`} />
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                {Math.max(0, Math.min(100, Math.round(job().progress_percent ?? 0)))}% 
                <Show when={job().progress_phase}> - {job().progress_phase}</Show>
              </div>
              <Show when={job().progress_message}>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">{job().progress_message}</div>
              </Show>
            </Show>
          </div>
          <Show when={job().status === 'failed' && job().error_message}>
            <div style="grid-column: 1 / -1; color: var(--danger);">
              <div style="color: var(--text-muted); font-size: 0.875rem;">Error Message</div>
              <div style="font-weight: 500;">{job().error_message}</div>
              <Show when={job().log_tail}>
                <details style="margin-top: 8px;">
                  <summary style="cursor: pointer; color: var(--text-muted); font-size: 0.875rem; user-select: none;">Live Log Tail</summary>
                  <pre class="log-tail" style="margin-top: 8px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; overflow-y: auto; color: var(--text); white-space: pre-wrap; word-break: break-word; max-height: 18rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                    {job().log_tail}
                  </pre>
                </details>
              </Show>
            </div>
          </Show>
          <Show when={job().status === 'completed' || job().status === 'succeeded'}>
            <div style="grid-column: 1 / -1; margin-top: 16px;">
              <button class="btn" onClick={handleDownload} disabled={downloading()}>
                {downloading() ? 'Downloading...' : 'Download ZIP'}
              </button>
            </div>
          </Show>
        </div>

        <Show when={attempts().length > 0}>
          <div class="panel" style="flex-shrink: 0; margin-top: 16px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1rem; color: var(--text);">API Provider Attempts</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {attempts().map((attempt: any) => (
                <div style={`padding: 12px; border-radius: 6px; background: rgba(0,0,0,0.2); border-left: 4px solid ${attempt.status === 'success' ? 'var(--success)' : attempt.status === 'failed' ? 'var(--danger)' : 'var(--accent)'}`}>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="color: var(--text);">{attempt.display_name} ({attempt.model})</strong>
                    <span style="font-size: 0.875rem; text-transform: capitalize; color: var(--text-muted);">{attempt.status}</span>
                  </div>
                  <Show when={attempt.error_message}>
                    <div style="font-size: 0.875rem; color: var(--danger); margin-top: 4px;">Error {attempt.http_status ? `(HTTP ${attempt.http_status})` : ''}: {attempt.error_message}</div>
                  </Show>
                </div>
              ))}
            </div>
          </div>
        </Show>
        
        <LogViewer jobId={params.id!} status={job().status} />
      </Show>
    </div>
  );
}
