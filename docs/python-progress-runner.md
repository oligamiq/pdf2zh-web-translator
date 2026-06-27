# Python Progress Runner Design

The `pc-api-python` service replaces the Go-based `pc-api` to better integrate with `pdf2zh-next`'s asynchronous and streaming capabilities, allowing for detailed progress reporting.

## Overview

1. **FastAPI Application**:
   - Replaces the original Go API, exposing the same endpoints (`/internal/files/*/input`, `/internal/jobs/*/log`, `/internal/jobs/*/download`, etc.).
   - This ensures backward compatibility with the `worker` component and the main job orchestration workflow.

2. **Asynchronous PDF Translation**:
   - Instead of launching `pdf2zh_next` as a subprocess and relying solely on logs, the Python service imports `pdf2zh_next` directly.
   - It utilizes `pdf2zh_next.high_level.do_translate_async_stream(settings, pdf_path)`, which yields stream events representing translation progress.

3. **Background Agent Loop**:
   - Similar to the Go implementation, a background `asyncio` task continuously polls the Worker API (`/agent/claim`) to acquire pending jobs.
   - Upon claiming a job, it constructs a `SettingsModel` from the provided LLM settings and begins the async translation stream.
   - As events are yielded by the stream (`progress_start`, `progress_update`, `finish`, etc.), it reports progress back to the Worker via `POST /agent/jobs/{job_id}/progress`.

4. **Progress Throttling**:
   - Progress updates are sent at most every ~0.5 seconds, or when there is a significant change in the percentage (e.g., >5%), minimizing load on the Worker database.

5. **Log and Secret Masking**:
   - The stream events and exceptions are logged, enabling the frontend to display a "log tail" for diagnostics.
   - Crucially, the code sanitizes logs by replacing any sensitive API keys from the configuration before persisting them or sending them back to the worker.

## Benefits

- **Real-Time Progress**: The frontend can now display a precise progress bar and phase information based on direct reporting rather than log parsing.
- **Tighter Integration**: Running `pdf2zh-next` directly as a Python library eliminates subprocess overhead and simplifies error capture.
- **Maintainability**: A single Python codebase can closely track updates to the `pdf2zh-next` Python package.
