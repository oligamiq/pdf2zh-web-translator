import { createSignal, onMount, For, Show } from 'solid-js';
import { getJobs } from '../api';
import { A } from '@solidjs/router';

export default function JobList() {
  const [jobs, setJobs] = createSignal<any[]>([]);
  const [error, setError] = createSignal("");

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  onMount(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  });

  return (
    <div class="panel">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin-top: 0;">Job Queue</h2>
        <button class="btn" onClick={fetchJobs}>Refresh</button>
      </div>
      {error() && <div style="color: var(--danger); margin-bottom: 16px;">{error()}</div>}
      
      <Show when={jobs().length > 0} fallback={<p style="color: var(--text-muted);">No jobs yet.</p>}>
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <For each={jobs()}>{(job) => (
              <tr>
                <td>{job.original_filename}</td>
                <td>
                  <span style={`padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; ${
                    job.status === 'queued' ? 'background: rgba(156, 163, 175, 0.2); color: #9ca3af;' :
                    job.status === 'running' ? 'background: rgba(59, 130, 246, 0.2); color: #60a5fa;' :
                    job.status === 'succeeded' ? 'background: rgba(16, 185, 129, 0.2); color: #34d399;' :
                    'background: rgba(239, 68, 68, 0.2); color: #f87171;'
                  }`}>
                    {job.status}
                  </span>
                  <Show when={job.status === 'running' && job.progress_percent !== undefined && job.progress_percent !== null}>
                    <div style="margin-top: 8px; width: 100%; max-width: 120px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                      <div style={`width: ${job.progress_percent * 100}%; background: #60a5fa; height: 100%; transition: width 0.3s;`} />
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                      {Math.round(job.progress_percent * 100)}% {job.progress_phase ? `- ${job.progress_phase}` : ''}
                    </div>
                  </Show>
                </td>
                <td>{new Date(job.created_at).toLocaleString()}</td>
                <td><A href={`/jobs/${job.id}`} class="btn">View</A></td>
              </tr>
            )}</For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
