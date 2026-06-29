import { createSignal, onMount, onCleanup } from 'solid-js';
import { getLog } from '../api';

export default function LogViewer(props: { jobId: string, status: string }) {
  const [logs, setLogs] = createSignal("");
  const [offset, setOffset] = createSignal(0);
  let logContainerRef: HTMLDivElement | undefined;

  const fetchLogs = async () => {
    try {
      const data = await getLog(props.jobId, offset());
      if (data && data.data) {
        setLogs(prev => prev + data.data);
        setOffset(data.next_offset);
        // Scroll to bottom if near bottom
        if (logContainerRef) {
          logContainerRef.scrollTop = logContainerRef.scrollHeight;
        }
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  onMount(() => {
    fetchLogs();
    
    const interval = setInterval(() => {
      // Poll faster if running
      if (props.status === 'running') {
        fetchLogs();
      }
    }, 2000);

    const queuedInterval = setInterval(() => {
      if (props.status === 'queued') {
        fetchLogs();
      }
    }, 5000);

    onCleanup(() => {
      clearInterval(interval);
      clearInterval(queuedInterval);
    });
  });

  return (
    <div class="panel live-log-card" style="margin-bottom: 0; margin-top: 24px;">
      <h3 style="margin-top: 0; flex-shrink: 0;">Live Log Tail</h3>
      <div 
        ref={logContainerRef}
        class="live-log-scroll live-log-body"
        data-testid="live-log-tail-body"
        style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-family: monospace; font-size: 0.875rem; color: #a78bfa;"
      >
        <pre class="live-log-pre">
          {logs() || 'No logs generated yet.'}
        </pre>
      </div>
    </div>
  );
}
