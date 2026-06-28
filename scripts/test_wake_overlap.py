import asyncio
import os
import sys
import time
from unittest.mock import patch

from fastapi import FastAPI
from pydantic import BaseModel

import httpx

import sys
from unittest.mock import MagicMock
sys.modules['pdf2zh_next'] = MagicMock()
sys.modules['pdf2zh_next.high_level'] = MagicMock()

# Add pc-api-python to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../pc-api-python')))

import main
main.DATA_DIR = "./test_data"
main.UPLOAD_DIR = os.path.join(main.DATA_DIR, "uploads")
main.OUTPUT_DIR = os.path.join(main.DATA_DIR, "outputs")
main.LOG_DIR = os.path.join(main.DATA_DIR, "logs")
main.WORK_DIR = os.path.join(main.DATA_DIR, "work")
for d in [main.UPLOAD_DIR, main.OUTPUT_DIR, main.LOG_DIR, main.WORK_DIR]:
    os.makedirs(d, exist_ok=True)

from main import app as pc_api_app, WAKE_EVENT

# Mock Worker API
worker_app = FastAPI()

class ClaimResponse(BaseModel):
    job: dict = None

class ProgressPayload(BaseModel):
    status: str
    progress_percent: int
    progress_phase: str

jobs_queue = []
claim_timestamps = []
finish_timestamps = []

inject_wake = False

@worker_app.post("/agent/claim")
async def claim():
    global inject_wake
    if inject_wake:
        print("Injecting wake just before returning empty claim!")
        transport = httpx.ASGITransport(app=pc_api_app)
        # Cannot await directly here since httpx async client might block if we don't do it right, but this is fine in a test
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            await client.post("/internal/wake")
        inject_wake = False
        return {}
        
    if jobs_queue:
        job = jobs_queue.pop(0)
        claim_timestamps.append(time.time())
        return {"job": job}
    return {}

@worker_app.post("/agent/jobs/{job_id}/progress")
async def progress(job_id: str, payload: ProgressPayload):
    if payload.status in ("completed", "failed"):
        finish_timestamps.append(time.time())
    return {"success": True}

@worker_app.post("/agent/jobs/{job_id}/attempts")
async def attempts(job_id: str):
    return {"success": True}

@worker_app.post("/agent/jobs/{job_id}/provider_stats")
async def stats(job_id: str):
    return {"success": True}

async def mock_do_translate_async_stream(settings, input_path):
    yield {"type": "progress_start", "percent": 0}
    await asyncio.sleep(2.0)  # Simulate 2 seconds of translation
    yield {"type": "finish", "percent": 100}

async def test_wake_overlap():
    # Setup test environment
    os.environ["WORKER_API_BASE_URL"] = "http://localhost:8001"
    os.environ["AGENT_TOKEN"] = "test-token"
    os.environ["PC_AGENT_MODE"] = "mock"
    os.environ["WORKER_API_BASE_URL_MOCK"] = "http://localhost:8001"
    
    # Start mock worker API
    import uvicorn
    config = uvicorn.Config(worker_app, host="127.0.0.1", port=8001, log_level="error")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    
    # Wait for server to start
    await asyncio.sleep(1)
    
    # Scenario 1: Multiple jobs in queue are processed continuously without 60s wait
    job_a = {"id": "job_a", "provider_snapshots": [{"id": "prov1", "display_name": "Prov1", "provider_type": "openai_compatible", "base_url": "http://mock"}]}
    job_b = {"id": "job_b", "provider_snapshots": [{"id": "prov1", "display_name": "Prov1", "provider_type": "openai_compatible", "base_url": "http://mock"}]}
    job_c = {"id": "job_c", "provider_snapshots": [{"id": "prov1", "display_name": "Prov1", "provider_type": "openai_compatible", "base_url": "http://mock"}]}
    
    jobs_queue.append(job_a)
    
    with patch("main.do_translate_async_stream", new=mock_do_translate_async_stream):
        agent_task = asyncio.create_task(main.agent_loop())
        await asyncio.sleep(0.5)
        
        # Scenario 1 & 2
        jobs_queue.append(job_b)
        jobs_queue.append(job_c)
        
        transport = httpx.ASGITransport(app=pc_api_app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            await client.post("/internal/wake")
            
        await asyncio.sleep(7.0)
        
        # Scenario 3: Wake between empty claim and wait
        global inject_wake
        inject_wake = True
        job_d = {"id": "job_d", "provider_snapshots": [{"id": "prov1", "display_name": "Prov1", "provider_type": "openai_compatible", "base_url": "http://mock"}]}
        jobs_queue.append(job_d)
        
        # Wake agent from current idle
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            await client.post("/internal/wake")
            
        await asyncio.sleep(3.0)
        
        agent_task.cancel()
        server.should_exit = True
        
        assert len(claim_timestamps) == 4, f"Job D was not claimed! Claims: {len(claim_timestamps)}"
        assert len(finish_timestamps) == 4, f"Job D was not finished! Finishes: {len(finish_timestamps)}"
        print("All test scenarios passed! Wake overlap and drain loop correctly handled.")

if __name__ == "__main__":
    asyncio.run(test_wake_overlap())
