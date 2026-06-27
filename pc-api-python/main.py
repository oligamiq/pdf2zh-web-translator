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

app = FastAPI()
logger = logging.getLogger("pc-api-python")
logging.basicConfig(level=logging.INFO)

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
    secret = os.environ.get("PROXY_SECRET")
    if secret and request.headers.get("X-Proxy-Secret") != secret:
        logger.warning(f"proxy secret rejected: path={request.url.path}")
        return Response(status_code=403, content="Forbidden")
    response = await call_next(request)
    return response

@app.get("/internal/healthz")
async def healthz():
    return Response("OK", status_code=200)

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
async def download_output(job_id: str):
    dir_path = os.path.join(OUTPUT_DIR, job_id)
    zip_name = f"translated_{job_id}.zip"
    
    pdfs = glob.glob(os.path.join(dir_path, "*.pdf"))
    if not pdfs:
        return JSONResponse({"error": "no_output_pdf"}, status_code=409)
    
    zip_path = os.path.join(WORK_DIR, zip_name)
    with ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, dir_path)
                zipf.write(file_path, arcname)
                
    return FileResponse(zip_path, media_type="application/zip", filename=zip_name)

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
            try:
                resp = await client.post(
                    f"{worker_api}/agent/claim",
                    json={"worker_id": worker_id},
                    headers={"Authorization": f"Bearer {agent_token}"}
                )
                if resp.status_code != 200:
                    await asyncio.sleep(5)
                    continue
                    
                data = resp.json()
                job = data.get("job")
                if not job:
                    await asyncio.sleep(5)
                    continue
                    
                job_id = job["id"]
                logger.info(f"Claimed job: {job_id}")
                
                error = None
                log_tail = []
                
                async def report_progress(percent, phase, message, status="running", error_msg=None):
                    payload = {
                        "status": status,
                        "progress_percent": percent,
                        "progress_phase": phase,
                        "progress_message": message
                    }
                    if error_msg:
                        payload["error_message"] = error_msg
                        payload["log_tail"] = "\n".join(log_tail)[-4096:]
                    
                    try:
                        await client.post(
                            f"{worker_api}/agent/jobs/{job_id}/progress",
                            json=payload,
                            headers={"Authorization": f"Bearer {agent_token}"}
                        )
                    except Exception as e:
                        logger.warning(f"Failed to report progress: {e}")

                try:
                    await report_progress(5, "claimed", "Job claimed")
                    
                    llm_settings = job.get("llm_settings", {})
                    
                    input_path = os.path.join(UPLOAD_DIR, job_id, "input.pdf")
                    output_dir = os.path.join(OUTPUT_DIR, job_id)
                    log_path = os.path.join(LOG_DIR, f"{job_id}.log")
                    
                    os.makedirs(output_dir, exist_ok=True)
                    
                    await report_progress(10, "preparing", "Preparing input PDF")
                    
                    # Extract settings
                    service = llm_settings.get("source") or os.environ.get("PDF2ZH_TRANSLATOR_SERVICE", "openaicompatible")
                    model = llm_settings.get("model") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_MODEL", "")
                    base_url = llm_settings.get("base_url") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_BASE_URL", "")
                    api_key = llm_settings.get("api_key") or os.environ.get("PDF2ZH_OPENAI_COMPATIBLE_API_KEY", "")
                    
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
                    
                    await report_progress(15, "validating", "Validating translation settings")
                    
                    lang_in = job.get("lang_in", "en")
                    lang_out = job.get("lang_out", "ja")
                    watermark_output_mode = job.get("watermark_output_mode", "no_watermark")
                    
                    settings = SettingsModel(
                        translation={"lang_in": lang_in, "lang_out": lang_out, "output": output_dir},
                        pdf={"watermark_output_mode": watermark_output_mode},
                        translate_engine_settings=translate_engine_settings
                    )
                    
                    last_progress_time = asyncio.get_event_loop().time()
                    last_progress_percent = -1.0
                    
                    async for event in do_translate_async_stream(settings, input_path):
                        ev_type = event.get("type")
                        
                        # Store some log tail safely, masking secret
                        log_msg = str(event)
                        if api_key and api_key in log_msg:
                            log_msg = log_msg.replace(api_key, "***")
                        log_tail.append(log_msg)
                        if len(log_tail) > 50:
                            log_tail.pop(0)
                            
                        with open(log_path, 'a', encoding='utf-8') as f:
                            f.write(log_msg + "\n")
                            
                        # Send progress
                        if ev_type in ("progress_start", "progress_update", "progress_end", "finish"):
                            percent = event.get("percent", 0)
                            now = asyncio.get_event_loop().time()
                            
                            # Only send if significant change or time passed, to avoid spam
                            if ev_type == "finish" or now - last_progress_time > 0.5 or abs(percent - last_progress_percent) > 0.05:
                                last_progress_time = now
                                last_progress_percent = percent
                                await report_progress(percent, event.get("phase", "processing"), event.get("message", ""))
                                
                    # If stream finishes normally, mark as succeeded
                    await client.post(
                        f"{worker_api}/agent/jobs/{job_id}/succeeded",
                        headers={"Authorization": f"Bearer {agent_token}"}
                    )
                                    
                except Exception as e:
                    import traceback
                    logger.exception(f"Job {job_id} failed")
                    error_str = str(e)
                    if api_key and api_key in error_str:
                        error_str = error_str.replace(api_key, "***")
                    
                    tb_str = traceback.format_exc()
                    if api_key and api_key in tb_str:
                        tb_str = tb_str.replace(api_key, "***")
                        
                    log_tail.append(tb_str)
                    
                    # Ensure failed progress is updated
                    await report_progress(
                        percent=100,
                        phase="failed",
                        message="Conversion failed",
                        status="failed",
                        error_msg=error_str
                    )
            except Exception as e:
                logger.error(f"Agent loop error: {e}")
                await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    if os.environ.get("PC_AGENT_AUTOSTART") != "false":
        asyncio.create_task(agent_loop())
