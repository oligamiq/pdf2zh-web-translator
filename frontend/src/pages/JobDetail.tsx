import { createSignal, onMount, Show, onCleanup } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { getJob, apiFetch } from '../api';
import LogViewer from '../components/LogViewer';

export default function JobDetail() {
  const params = useParams();
  const [job, setJob] = createSignal<any>(null);
  const [error, setError] = createSignal("");
  const [downloading, setDownloading] = createSignal(false);

  const fetchJob = async () => {
    try {
      const data = await getJob(params.id!);
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  onMount(() => {
    fetchJob();
    const interval = setInterval(() => {
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
      const resp = await apiFetch(`/jobs/${job().id}/download`);
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

      <Show when={job()} fallback={<p>Loading...</p>}>
        <div class="panel" style="flex-shrink: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.875rem;">Filename</div>
            <div style="font-weight: 500;">{job().original_filename}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.875rem;">Status</div>
            <div style="font-weight: 500; text-transform: uppercase;">{job().status}</div>
          </div>
          <Show when={job().status === 'failed' && job().error_message}>
            <div style="grid-column: 1 / -1; color: var(--danger);">
              <div style="color: var(--text-muted); font-size: 0.875rem;">Error Message</div>
              <div style="font-weight: 500;">{job().error_message}</div>
            </div>
          </Show>
          <Show when={job().status === 'succeeded'}>
            <div style="grid-column: 1 / -1; margin-top: 16px;">
              <button class="btn" onClick={handleDownload} disabled={downloading()}>
                {downloading() ? 'Downloading...' : 'Download ZIP'}
              </button>
            </div>
          </Show>
        </div>
        
        <LogViewer jobId={params.id!} status={job().status} />
      </Show>
    </div>
  );
}
