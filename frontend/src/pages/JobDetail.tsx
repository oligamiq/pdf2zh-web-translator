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
      const [data, attemptsData] = await Promise.all([
        getJob(params.id!),
        getJobAttempts(params.id!)
      ]);
      setJob(data);
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
      alert("ダウンロードに失敗しました: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div class="container" style="display: flex; flex-direction: column; height: 100vh;">
      <div class="header" style="flex-shrink: 0;">
        <h1 style="margin: 0;">詳細</h1>
        <div style="display: flex; gap: 12px;">
          <A href="/" class="btn" style="background: transparent; border: 1px solid var(--border); color: var(--text);">← 戻る</A>
        </div>
      </div>

      {error() && <div class="panel" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger);">{error()}</div>}

      <Show when={job()} fallback={<p>{!authReady() ? "サインイン確認中..." : "詳細を読み込み中..."}</p>}>
        <div class="panel" style="flex-shrink: 0;">
          <div class="job-summary-grid" data-testid="job-summary">
            <div class="job-summary-item">
              <div style="color: var(--text-muted); font-size: 0.875rem;">ファイル名</div>
              <div class="job-summary-filename" data-testid="job-summary-filename" title={job().original_filename}>{job().original_filename}</div>
            </div>
            <div class="job-summary-status" data-testid="job-summary-status">
              <div style="color: var(--text-muted); font-size: 0.875rem;">ステータス</div>
              <div style="font-weight: 500;">
                {job().status === 'queued' ? '待機中' : job().status === 'running' ? '変換中' : job().status === 'completed' || job().status === 'succeeded' ? '完了' : '失敗'}
              </div>
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
            
            <div class="job-summary-status">
              <Show when={job().status === 'completed' || job().status === 'succeeded'}>
                <button class="btn" onClick={handleDownload} disabled={downloading()} style="margin-top: 18px;">
                  {downloading() ? 'ダウンロード中...' : 'ZIPをダウンロード'}
                </button>
              </Show>
            </div>
          </div>
          
          <Show when={job().status === 'failed' && job().error_message}>
            <div style="margin-top: 16px; color: var(--danger);">
              <div style="color: var(--text-muted); font-size: 0.875rem;">エラーメッセージ</div>
              <div style="font-weight: 500;">{job().error_message}</div>
              <Show when={job().log_tail}>
                <div class="live-log" data-testid="live-log" style="margin-top: 8px;">
                  <details>
                    <summary style="color: var(--text-muted); font-size: 0.875rem; user-select: none;">ライブログ</summary>
                    <pre class="log-tail" data-testid="live-log-pre" style="margin-top: 8px; background: rgba(0,0,0,0.2); font-size: 12px; color: var(--text); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; max-height: 18rem;">
                      {job().log_tail}
                    </pre>
                  </details>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        <Show when={attempts() && attempts().length > 0}>
          <div class="panel" style="flex-shrink: 0; margin-top: 16px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1rem; color: var(--text);">APIルーティング</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {attempts().map((stat: any) => (
                <div style={`padding: 12px; border-radius: 6px; background: rgba(0,0,0,0.2); border-left: 4px solid ${
                  stat.total_requests === 0 ? 'var(--border)' : (stat.success_count > 0 ? 'var(--success)' : 'var(--danger)')
                }`}>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="color: var(--text);">{stat.display_name} ({stat.model})</strong>
                  </div>
                  <Show when={stat.total_requests > 0} fallback={<div style="font-size: 0.875rem; color: var(--text-muted);">未使用</div>}>
                    <div style="display: flex; flex-direction: column; gap: 2px; font-size: 0.875rem; color: var(--text-muted);">
                      <div>リクエスト数: {stat.total_requests}</div>
                      <Show when={stat.success_count > 0}>
                        <div style="color: var(--success);">成功: {stat.success_count}</div>
                      </Show>
                      <Show when={stat.failure_count > 0}>
                        <div style="color: var(--danger);">失敗: {stat.failure_count}</div>
                      </Show>
                      <Show when={stat.rate_limit_count > 0}>
                        <div style="color: var(--accent);">レートリミット(429): {stat.rate_limit_count}</div>
                      </Show>
                      <Show when={stat.last_error}>
                        <div style="color: var(--danger); margin-top: 2px;">
                          最後のエラー: {stat.last_http_status ? `HTTP ${stat.last_http_status} ` : ''}{stat.last_error}
                        </div>
                      </Show>
                    </div>
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
