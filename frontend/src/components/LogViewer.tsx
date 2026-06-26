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
    <div class="panel" style="flex: 1; display: flex; flex-direction: column; min-height: 0; margin-bottom: 0;">
      <h3 style="margin-top: 0; flex-shrink: 0;">Live Log Tail</h3>
      <div 
        ref={logContainerRef}
        style="flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-family: monospace; font-size: 0.875rem; color: #a78bfa; white-space: pre-wrap;"
      >
        {logs() || 'No logs generated yet.'}
      </div>
    </div>
  );
}
