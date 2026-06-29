import os
import glob
import json
import uuid
import shutil
import asyncio
import logging
from typing import Optional, Dict, Any
from zipfile import ZipFile

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import httpx
import aiofiles

from pdf2zh_next.high_level import do_translate_async_stream, SettingsModel
from router import handle_router_request, ROUTER_STATES

app = FastAPI()

@app.api_route("/router/{job_id}/v1/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def router_proxy(job_id: str, path: str, request: Request):
    return await handle_router_request(job_id, request)

@app.api_route("/router/{job_id}/v1", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def router_proxy_root(job_id: str, request: Request):
    return await handle_router_request(job_id, request)
logger = logging.getLogger("pc-api-python")
logging.basicConfig(level=logging.INFO)

WAKE_EVENT = asyncio.Event()

DATA_DIR = "/data"
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
OUTPUT_DIR = os.path.join(DATA_DIR, "outputs")
LOG_DIR = os.path.join(DATA_DIR, "logs")
WORK_DIR = os.path.join(DATA_DIR, "work")

for d in [UPLOAD_DIR, OUTPUT_DIR, LOG_DIR, WORK_DIR]:
    os.makedirs(d, exist_ok=True)

class LLMSettings(BaseModel):
    source: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.middleware("http")
async def verify_secret(request: Request, call_next):
    if request.url.path.startswith("/router/"):
        return await call_next(request)
    secret = os.environ.get("PROXY_SECRET")
    if secret and request.headers.get("X-Proxy-Secret") != secret:
        logger.warning(f"proxy secret rejected: path={request.url.path}")
        return Response(status_code=403, content="Forbidden")
    response = await call_next(request)
    return response

@app.get("/internal/healthz")
async def healthz():
    return Response("OK", status_code=200)

@app.post("/internal/wake")
async def wake_agent():
    WAKE_EVENT.set()
    return Response("Waked", status_code=200)

@app.put("/internal/files/{job_id}/input")
async def put_input(job_id: str, request: Request):
    logger.info(f"received input upload: job_id={job_id}")
    job_upload_dir = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(job_upload_dir, exist_ok=True)
    input_path = os.path.join(job_upload_dir, "input.pdf")
    
    async with aiofiles.open(input_path, 'wb') as out_file:
        async for chunk in request.stream():
            await out_file.write(chunk)
    return Response(status_code=200)

@app.get("/internal/jobs/{job_id}/log")
async def get_log(job_id: str, offset: int = 0, limit: int = 65536):
    log_path = os.path.join(LOG_DIR, f"{job_id}.log")
    if not os.path.exists(log_path):
        return JSONResponse({"data": "", "next_offset": 0})
    
    with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
        f.seek(0, os.SEEK_END)
        size = f.tell()
        
        offset = min(offset, size)
        read_len = min(limit, size - offset)
        
        f.seek(offset)
        data = f.read(read_len)
        return JSONResponse({"data": data, "next_offset": offset + len(data)})

@app.get("/internal/jobs/{job_id}/download")
async def download_output(job_id: str, type: str = "zip", filename: str = "translated"):
    dir_path = os.path.join(OUTPUT_DIR, job_id)
    
    pdfs = glob.glob(os.path.join(dir_path, "*.pdf"))
    if not pdfs:
        return JSONResponse({"error": "no_output_pdf"}, status_code=409)
    
    if type in ("dual", "mono"):
        target_suffix = f"{type}.pdf"
        target_pdf = None
        for p in pdfs:
            if target_suffix in p.lower() or f"_{type}" in p.lower() or f"-{type}" in p.lower():
                target_pdf = p
                break
        if not target_pdf:
            target_pdf = pdfs[0]
            
        base_name = filename
        if base_name.lower().endswith('.pdf'):
            base_name = base_name[:-4]
            
        real_filename = f"{base_name}_{type}.pdf"
        # Use content-disposition inline for PDF so the browser can display it
        headers = {"Content-Disposition": f'inline; filename="{real_filename}"'}
        return FileResponse(target_pdf, media_type="application/pdf", headers=headers)
    
    base_name = filename
    if base_name.lower().endswith('.pdf'):
        base_name = base_name[:-4]
        
    zip_name = f"{base_name}.zip"
    zip_path = os.path.join(WORK_DIR, f"{job_id}.zip")
    with ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = file
                lower_file = file.lower()
                
                # Check for dual/mono to rename cleanly
                if "dual" in lower_file and lower_file.endswith(".pdf"):
                    arcname = f"{base_name}_dual.pdf"
                elif "mono" in lower_file and lower_file.endswith(".pdf"):
                    arcname = f"{base_name}_mono.pdf"
                elif lower_file.startswith("input"):
                    arcname = file.replace("input", base_name, 1)
                    
                zipf.write(file_path, arcname)
                
    headers = {"Content-Disposition": f'attachment; filename="{zip_name}"'}
    return FileResponse(zip_path, media_type="application/zip", headers=headers)

@app.post("/internal/files/{job_id}/delete")
async def delete_job(job_id: str):
    for d in [UPLOAD_DIR, OUTPUT_DIR, WORK_DIR]:
        shutil.rmtree(os.path.join(d, job_id), ignore_errors=True)
    log_file = os.path.join(LOG_DIR, f"{job_id}.log")
    if os.path.exists(log_file):
        os.remove(log_file)
    return Response(status_code=200)

async def run_job(job_id: str, llm_settings: dict = None):
    input_path = os.path.join(UPLOAD_DIR, job_id, "input.pdf")
    output_dir = os.path.join(OUTPUT_DIR, job_id)
    log_path = os.path.join(LOG_DIR, f"{job_id}.log")
    work_dir = os.path.join(WORK_DIR, job_id)
    
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(work_dir, exist_ok=True)
    
    with open(log_path, 'w') as f:
        f.write(f"Starting job {job_id}\n")
    
    llm = llm_settings or {}
    service = llm.get("source") or os.environ.get("PDF2ZH_TRANSLATOR_SERVICE", "openaicompatible")
    model = llm.get("model") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_MODEL", "")
    base_url = llm.get("base_url") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_BASE_URL", "")
    api_key = llm.get("api_key") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_API_KEY", "")
    
    service_lower = service.lower()
    service_map = {
        "openaicompatible": "OpenAICompatible",
        "openai": "OpenAI",
        "deepseek": "DeepSeek",
        "gemini": "Gemini"
    }
    engine_type = service_map.get(service_lower, "OpenAICompatible")
    
    translate_engine_settings = {"translate_engine_type": engine_type}
    if engine_type == "OpenAICompatible":
        translate_engine_settings["openai_compatible_model"] = model
        translate_engine_settings["openai_compatible_base_url"] = base_url
        translate_engine_settings["openai_compatible_api_key"] = api_key
    elif engine_type == "OpenAI":
        translate_engine_settings["openai_model"] = model
        translate_engine_settings["openai_base_url"] = base_url
        translate_engine_settings["openai_api_key"] = api_key
    elif engine_type == "DeepSeek":
        translate_engine_settings["deepseek_model"] = model
        translate_engine_settings["deepseek_api_key"] = api_key
    elif engine_type == "Gemini":
        translate_engine_settings["gemini_model"] = model
        translate_engine_settings["gemini_api_key"] = api_key
        
    lang_in = llm.get("lang_in", "en")
    lang_out = llm.get("lang_out", "ja")
    watermark_output_mode = llm.get("watermark_output_mode", "no_watermark")

    settings = SettingsModel(
        translation={"lang_in": lang_in, "lang_out": lang_out, "output": output_dir},
        pdf={"watermark_output_mode": watermark_output_mode},
        translate_engine_settings=translate_engine_settings
    )
    
    # Run async stream and log
    try:
        async for event in do_translate_async_stream(settings, input_path):
            with open(log_path, 'a') as f:
                f.write(f"event: {event}\n")
    except Exception as e:
        logger.exception(f"Job {job_id} failed")
        with open(log_path, 'a') as f:
            f.write(f"Exception: {str(e)}\n")

@app.post("/internal/jobs/{job_id}/run")
async def trigger_run(job_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_job, job_id)
    return Response(status_code=202)

async def agent_loop():
    worker_api = os.environ.get("WORKER_API_BASE_URL", "").rstrip("/")
    if os.environ.get("PC_AGENT_MODE") == "mock" and os.environ.get("WORKER_API_BASE_URL_MOCK"):
        worker_api = os.environ.get("WORKER_API_BASE_URL_MOCK").rstrip("/")
        
    agent_token = os.environ.get("AGENT_TOKEN")
    worker_id = os.environ.get("WORKER_ID", "pc-agent-python-1")
    
    if not worker_api or not agent_token:
        logger.info("Agent loop disabled (missing WORKER_API_BASE_URL or AGENT_TOKEN)")
        return
        
    logger.info(f"Agent loop started, polling: {worker_api}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            WAKE_EVENT.clear()
            while True:
                try:
                    resp = await client.post(
                        f"{worker_api}/agent/claim",
                        json={"worker_id": worker_id},
                        headers={"Authorization": f"Bearer {agent_token}"}
                    )
                    if resp.status_code != 200:
                        break
                    
                    data = resp.json()
                    job = data.get("job")
                    if not job:
                        break
                    
                    job_id = job["id"]
                    logger.info(f"Claimed job: {job_id}")
                
                    error = None
                    log_tail = []
                
                    async def report_progress(percent, phase, message, status="running", error_msg=None, active_provider_name=None, **kwargs):
                        payload = {
                            "status": status,
                            "progress_percent": percent,
                            "progress_phase": phase,
                            "progress_message": message
                        }
                        if active_provider_name:
                            payload["active_provider_name"] = active_provider_name
                        if error_msg:
                            payload["error_message"] = error_msg
                        
                        passed_log_tail = kwargs.get("log_tail")
                        if passed_log_tail is not None:
                            if isinstance(passed_log_tail, list):
                                payload["log_tail"] = "\n".join(passed_log_tail)[-4000:]
                            else:
                                payload["log_tail"] = str(passed_log_tail)[-4000:]
                        elif error_msg:
                            payload["log_tail"] = "\n".join(log_tail)[-4000:]
                    
                        try:
                            await client.post(
                                f"{worker_api}/agent/jobs/{job_id}/progress",
                                json=payload,
                                headers={"Authorization": f"Bearer {agent_token}"}
                            )
                        except Exception as e:
                            logger.warning(f"Failed to report progress: {e}")

                    async def report_attempt(provider_snapshot_id, provider_order, display_name, model, status, http_status=None, error_message=None):
                        payload = {
                            "provider_snapshot_id": provider_snapshot_id,
                            "provider_order": provider_order,
                            "display_name": display_name,
                            "model": model,
                            "status": status,
                            "http_status": http_status,
                            "error_message": error_message
                        }
                        try:
                            await client.post(
                                f"{worker_api}/agent/jobs/{job_id}/attempts",
                                json=payload,
                                headers={"Authorization": f"Bearer {agent_token}"}
                            )
                        except Exception as e:
                            logger.warning(f"Failed to report attempt: {e}")

                    def normalize_progress(value):
                        if value is None:
                            return None
                        try:
                            v = float(value)
                        except Exception:
                            return None
                        if 0 <= v <= 1:
                            v = v * 100
                        return max(0, min(100, int(round(v))))

                    def iter_exception_chain(exc, seen=None):
                        if seen is None:
                            seen = set()
                        if exc is None or id(exc) in seen:
                            return
                        seen.add(id(exc))
                        yield exc
                        
                        yield from iter_exception_chain(getattr(exc, "__cause__", None), seen)
                        yield from iter_exception_chain(getattr(exc, "__context__", None), seen)
                        
                        if type(exc).__name__ == "RetryError" and hasattr(exc, "last_attempt"):
                            attempt = exc.last_attempt
                            if hasattr(attempt, "exception"):
                                yield from iter_exception_chain(attempt.exception(), seen)
                        
                        if hasattr(exc, "exceptions"):
                            for e in exc.exceptions:
                                yield from iter_exception_chain(e, seen)

                    def extract_http_status_error(exc):
                        for e in iter_exception_chain(exc):
                            if isinstance(e, httpx.HTTPStatusError):
                                return e
                            if type(e).__name__ == "APIStatusError" and getattr(type(e).__module__, "", "").startswith("openai"):
                                return e
                        return None

                    async def report_provider_stats(provider_id, http_status, error_msg):
                        if not provider_id:
                            return
                        payload = {"stats": [{
                            "provider_snapshot_id": provider_id,
                            "total_requests": 1,
                            "success_count": 0,
                            "failure_count": 1,
                            "last_http_status": http_status,
                            "last_error": error_msg,
                            "rate_limit_count": 1 if http_status == 429 else 0
                        }]}
                        try:
                            await client.post(
                                f"{worker_api}/agent/jobs/{job_id}/provider_stats",
                                json=payload,
                                headers={"Authorization": f"Bearer {agent_token}"}
                            )
                        except Exception as e:
                            logger.warning(f"Failed to report provider stats: {e}")

                    try:
                        await report_progress(5, "claimed", "Job claimed")
                    
                        provider_snapshots = job.get("provider_snapshots")
                        if not provider_snapshots:
                            llm_settings = job.get("llm_settings", {})
                            provider_snapshots = [{
                                "id": None,
                                "display_name": "Legacy",
                                "provider_type": llm_settings.get("source"),
                                "base_url": llm_settings.get("base_url"),
                                "model": llm_settings.get("model"),
                                "api_key": llm_settings.get("api_key"),
                                "priority": 1
                            }]
                        
                        input_path = os.path.join(UPLOAD_DIR, job_id, "input.pdf")
                        output_dir = os.path.join(OUTPUT_DIR, job_id)
                        log_path = os.path.join(LOG_DIR, f"{job_id}.log")
                    
                        os.makedirs(output_dir, exist_ok=True)
                    
                        lang_in = job.get("lang_in", "en")
                        lang_out = job.get("lang_out", "ja")
                        watermark_output_mode = job.get("watermark_output_mode", "no_watermark")
                    
                        job_success = False
                        final_error_str = "All providers failed."
                        
                        from router import ROUTER_STATES
                        ROUTER_STATES[job_id] = {
                            "providers": provider_snapshots,
                            "stats": {},
                            "consecutive_router_failures": 0,
                            "active_provider_name": provider_snapshots[0].get("display_name") if provider_snapshots else "Unknown"
                        }
                        
                        translate_engine_settings = {
                            "translate_engine_type": "OpenAICompatible",
                            "openai_compatible_model": "router",
                            "openai_compatible_base_url": f"{os.environ.get('PC_API_INTERNAL_BASE_URL', 'http://127.0.0.1:8080')}/router/{job_id}/v1",
                            "openai_compatible_api_key": "dummy"
                        }
                        logger.info(f"Using router proxy base url: {os.environ.get('PC_API_INTERNAL_BASE_URL', 'http://127.0.0.1:8080')}/router/<redacted>/v1")
                        
                        settings = SettingsModel(
                            translation={"lang_in": lang_in, "lang_out": lang_out, "output": output_dir},
                            pdf={"watermark_output_mode": watermark_output_mode},
                            translate_engine_settings=translate_engine_settings
                        )

                        await report_progress(10, "preparing", "Preparing translation via local proxy router")
                        if provider_snapshots:
                            await report_attempt(provider_snapshots[0].get("id"), 1, provider_snapshots[0].get("display_name"), provider_snapshots[0].get("model"), "running")

                        last_progress_time = asyncio.get_event_loop().time()
                        last_progress_percent = 15
                        stream_started = False
                        
                        try:
                            async for event in do_translate_async_stream(settings, input_path):
                                stream_started = True
                                ev_type = event.get("type")
                                
                                state = ROUTER_STATES.get(job_id, {})
                                display_name = state.get("active_provider_name", "Unknown")
                                
                                log_msg = str(event)
                                
                                if not log_tail or log_tail[-1] != log_msg:
                                    log_tail.append(log_msg)
                            
                                if len(log_tail) > 50:
                                    log_tail.pop(0)
                                
                                with open(log_path, 'a', encoding='utf-8') as f:
                                    f.write(log_msg + "\n")
                                
                                if ev_type in ("progress_start", "progress_update", "progress_end", "finish"):
                                    new_percent = normalize_progress(event.get("overall_progress", event.get("percent")))
                                    if new_percent is None:
                                        percent = last_progress_percent
                                    else:
                                        percent = max(last_progress_percent, new_percent)

                                    phase = event.get("phase", "processing")
                                
                                    if phase == "processing" or ev_type != "finish":
                                        percent = max(percent, 20)
                                
                                    if ev_type == "finish":
                                        percent = 100
                                        phase = "completed"

                                    now_t = asyncio.get_event_loop().time()
                                
                                    if ev_type == "finish" or now_t - last_progress_time > 0.5 or percent > last_progress_percent:
                                        last_progress_time = now_t
                                        last_progress_percent = percent
                                        await report_progress(percent, phase, event.get("message", ""), active_provider_name=display_name)
                                    
                            job_success = True
                            
                        except Exception as e:
                            import traceback
                            state = ROUTER_STATES.get(job_id, {})
                            display_name = state.get("active_provider_name", "Unknown")
                            logger.exception(f"Job {job_id} failed with provider {display_name}")
                        
                            error_str = str(e)
                            http_status_code = None
                            http_err = extract_http_status_error(e)
                            if http_err:
                                http_status_code = getattr(http_err.response, "status_code", getattr(http_err.response, "status", None))
                                body = getattr(http_err.response, "text", getattr(http_err.response, "content", b""))
                                if isinstance(body, bytes):
                                    body = body.decode('utf-8', errors='replace')
                                body = body[:2048]
                                req_url = str(getattr(http_err.request, "url", ""))
                            
                                if http_status_code in (301, 302, 307, 308):
                                    error_str = f"HTTP {http_status_code} Base URL redirects. Please use the final API URL."
                                elif http_status_code == 401:
                                    error_str = f"HTTP {http_status_code} API key is invalid."
                                elif http_status_code == 429:
                                    error_str = f"HTTP {http_status_code} Rate limit or quota exceeded."
                                elif http_status_code == 400:
                                    error_str = f"HTTP {http_status_code} Model/Base URL/request parameter may be invalid."
                                elif http_status_code and http_status_code >= 500:
                                    error_str = f"HTTP {http_status_code} Provider server error."
                                else:
                                    error_str = f"HTTP {http_status_code} API request failed."
                                
                                log_tail.append(f"--- HTTPStatusError Detail ---")
                                log_tail.append(f"Provider: {display_name}")
                                log_tail.append(f"Request URL: {req_url}")
                                log_tail.append(f"Status Code: {http_status_code}")
                                log_tail.append(f"Stream Started: {stream_started}")
                                if http_status_code in (301, 302, 307, 308):
                                    log_tail.append("Response Body: <HTML response omitted due to redirect>")
                                elif "<html" in body.lower() or "<!doctype html>" in body.lower():
                                    log_tail.append("Response Body: <HTML response omitted>")
                                else:
                                    log_tail.append(f"Response Body:\n{body}")
                                log_tail.append(f"------------------------------")

                            elif isinstance(e, (httpx.TimeoutException, httpx.ConnectError)):
                                error_str = f"LLM API request failed: Connection error or timeout."
                        
                            tb_str = traceback.format_exc()
                            log_tail.append(f"Exception:\n{tb_str}")
                            
                            final_error_str = error_str
                            
                            try:
                                await report_progress(last_progress_percent, "failed", error_str, active_provider_name=display_name, log_tail=log_tail[-200:])
                            except Exception:
                                logger.exception("failed to report failed progress")
                            
                            if provider_snapshots:
                                await report_attempt(provider_snapshots[0].get("id"), 1, display_name, provider_snapshots[0].get("model"), "failed", http_status=http_status_code, error_message=error_str)
                            
                        finally:
                            state = ROUTER_STATES.pop(job_id, None)
                            if state and state.get("stats"):
                                stats_list = list(state["stats"].values())
                                if stats_list:
                                    try:
                                        await client.post(
                                            f"{worker_api}/agent/jobs/{job_id}/provider_stats",
                                            json={"stats": stats_list},
                                            headers={"Authorization": f"Bearer {agent_token}"}
                                        )
                                    except Exception as e:
                                        logger.warning(f"Failed to flush stats: {e}")

                        if job_success:
                            await report_progress(
                                percent=100,
                                phase="completed",
                                message="Conversion completed",
                                status="completed",
                                active_provider_name=final_display_name
                            )
                        else:
                            await report_progress(
                                percent=100,
                                phase="failed",
                                message="Conversion failed",
                                status="failed",
                                error_msg=final_error_str,
                                active_provider_name=final_display_name
                            )
                    except Exception as e:
                        import traceback
                        logger.error(f"Agent loop job error: {e}")
                        tb_str = traceback.format_exc()
                        log_tail.append(tb_str)
                        await report_progress(
                            percent=100,
                            phase="failed",
                            message="Conversion failed",
                            status="failed",
                            error_msg=str(e)
                        )
                except Exception as e:
                    logger.error(f"Agent loop error: {e}")
                    break
            try:
                await asyncio.wait_for(WAKE_EVENT.wait(), timeout=60.0)
            except asyncio.TimeoutError:
                pass

@app.on_event("startup")
async def startup_event():
    if os.environ.get("PC_AGENT_AUTOSTART") != "false":
        asyncio.create_task(agent_loop())
