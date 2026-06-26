import { createSignal } from 'solid-js';
import { uploadJob } from '../api';

export default function UploadForm() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    setLoading(true);
    setError("");
    try {
      for (let i = 0; i < input.files.length; i++) {
        await uploadJob(input.files[i]);
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      input.value = '';
    }
  };

  return (
    <div class="panel" style="text-align: center; border-style: dashed; padding: 40px; position: relative;">
      <h3 style="margin-top: 0;">Upload PDF</h3>
      {error() && <div style="color: var(--danger); margin-bottom: 12px;">{error()}</div>}
      {loading() ? (
        <p>Uploading...</p>
      ) : (
        <div>
          <p style="color: var(--text-muted);">Drag and drop or click to select files</p>
          <input 
            type="file" 
            accept="application/pdf" 
            multiple 
            onChange={handleFileChange} 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
          />
        </div>
      )}
    </div>
  );
}
