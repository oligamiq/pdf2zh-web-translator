import { createSignal, onMount, onCleanup, For, Show, createEffect } from 'solid-js';
import { getJobs, deleteJob, viewPdf } from '../api';
import { A } from '@solidjs/router';

export default function JobList(props: { authReady?: boolean, user?: any, refreshFlag?: number }) {
  const [jobs, setJobs] = createSignal<any[]>([]);
  const [error, setError] = createSignal("");
  const [initialLoading, setInitialLoading] = createSignal(true);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleOpenPdf = async (id: string) => {
    try {
      await viewPdf(id, 'dual');
    } catch (e: any) {
      alert("Failed to get download URL: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this job from history? The translated files may no longer be easy to access from this browser.")) {
      try {
        await deleteJob(id);
        fetchJobs();
      } catch (e: any) {
        alert("Failed to delete job: " + e.message);
      }
    }
  };

  createEffect(() => {
    if (props.authReady !== undefined && !props.authReady) {
      return; // wait for auth
    }
    // Track refreshFlag and user changes
    if (props.refreshFlag) {}
    if (props.user) {} else {}
    fetchJobs();
  });

  onMount(() => {
    const interval = setInterval(() => {
      if (props.authReady === undefined || props.authReady) {
        fetchJobs();
      }
    }, 5000);
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="panel" data-testid="job-queue">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin-top: 0;">変換履歴</h2>
        <button class="btn" onClick={fetchJobs}>更新</button>
      </div>
      {error() && <div style="color: var(--danger); margin-bottom: 16px;">{error()}</div>}
      
      <Show when={!initialLoading()} fallback={<p style="color: var(--text-muted); font-size: 0.9rem;">履歴を読み込み中...</p>}>
        <Show when={jobs().length > 0} fallback={<p style="color: var(--text-muted);">履歴はありません。</p>}>
        <div class="job-list" data-testid="job-list">
          <For each={jobs()}>{(job) => (
            <div class="job-card" data-testid="job-row">
              <div class="job-card-main">
                <div
                  class="job-filename"
                  data-testid="job-filename"
                  title={job.original_filename}
                >
                  {job.original_filename}
                </div>
              </div>
              <div class="job-status-cell" data-testid="job-status">
                <span class="status-badge" style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; ${
                  job.status === 'queued' ? 'background: rgba(156, 163, 175, 0.2); color: #9ca3af;' :
                  job.status === 'running' ? 'background: rgba(59, 130, 246, 0.2); color: #60a5fa;' :
                  job.status === 'completed' || job.status === 'succeeded' ? 'background: rgba(16, 185, 129, 0.2); color: #34d399;' :
                  'background: rgba(239, 68, 68, 0.2); color: #f87171;'
                }`}>
                  {job.status === 'queued' ? '待機中' : job.status === 'running' ? '変換中' : job.status === 'completed' || job.status === 'succeeded' ? '完了' : '失敗'}
                </span>
                <Show when={job.status === 'running' && job.progress_percent !== undefined && job.progress_percent !== null}>
                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <div style="width: 100px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                      <div style={`width: ${Math.max(0, Math.min(100, Math.round(job.progress_percent ?? 0)))}%; background: #60a5fa; height: 100%; transition: width 0.3s;`} />
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted);">
                      {Math.max(0, Math.min(100, Math.round(job.progress_percent ?? 0)))}%
                    </span>
                  </div>
                </Show>
              </div>

              <div class="job-created-cell" data-testid="job-created">
                {new Date(job.created_at).toLocaleString()}
              </div>

              <div class="job-actions" data-testid="job-actions">
                <Show when={job.status === 'completed' || job.status === 'succeeded'}>
                  <button class="btn" style="background: transparent; border: 1px solid var(--border); color: var(--text);" onClick={() => handleOpenPdf(job.id)}>PDFを表示</button>
                </Show>
                <A href={`/jobs/${job.id}`} class="btn">詳細</A>
                <button class="btn btn-danger" onClick={() => handleDelete(job.id)}>削除</button>
              </div>
            </div>
          )}</For>
        </div>
        <div style="margin-top: 16px; font-size: 0.875rem; color: var(--text-muted); text-align: center;">
          変換履歴は一定期間で自動的に削除されます。
        </div>
        </Show>
      </Show>
    </div>
  );
}
