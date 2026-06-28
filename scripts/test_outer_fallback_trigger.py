import sys
import asyncio
import os
import types

# 1. Mock pdf2zh_next globally before main is imported
class MockSettingsModel:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

mock_pdf2zh = types.ModuleType('pdf2zh_next')
mock_pdf2zh_high_level = types.ModuleType('pdf2zh_next.high_level')
sys.modules['pdf2zh_next'] = mock_pdf2zh
sys.modules['pdf2zh_next.high_level'] = mock_pdf2zh_high_level
mock_pdf2zh_high_level.SettingsModel = MockSettingsModel

test_case = "A"

async def fake_do_translate_async_stream(settings, input_path):
    import main
    job_id = "job_outer_test"
    
    if test_case == "A":
        # Test A: Provider A fails constantly, Provider B succeeds.
        # So consecutive_router_failures never reaches 3.
        # But failure_count for Prov A is high.
        if job_id in main.ROUTER_STATES:
            main.ROUTER_STATES[job_id]["consecutive_router_failures"] = 0
            
        yield {"type": "progress_start", "percent": 0, "phase": "processing"}
        await asyncio.sleep(0.1)
        yield {"type": "finish", "percent": 100, "phase": "completed"}
        
    elif test_case == "B":
        # Test B: Router completely fails. consecutive_router_failures >= 3
        if job_id in main.ROUTER_STATES:
            main.ROUTER_STATES[job_id]["consecutive_router_failures"] = 3
            
        yield {"type": "progress_start", "percent": 0, "phase": "processing"}
        await asyncio.sleep(0.1)
        # The main loop should raise an exception here when it checks the stats
        yield {"type": "progress_update", "percent": 10, "phase": "processing"}
        await asyncio.sleep(0.1)
        yield {"type": "finish", "percent": 100, "phase": "completed"}

mock_pdf2zh_high_level.do_translate_async_stream = fake_do_translate_async_stream

from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from uvicorn import Config, Server

worker_app = FastAPI()
progress_history = []

@worker_app.post("/agent/claim")
async def claim(req: FastAPIRequest):
    if claim.claimed:
        return JSONResponse({"job": None})
    claim.claimed = True
    return JSONResponse({
        "job": {
            "id": "job_outer_test",
            "provider_snapshots": [
                {
                    "id": "prov_a",
                    "display_name": "Provider A",
                    "provider_type": "openai",
                    "base_url": "http://127.0.0.1:8001/v1",
                    "api_key": "dummy_a",
                    "model": "gpt-4o"
                },
                {
                    "id": "prov_b",
                    "display_name": "SiliconFlow Free",
                    "provider_type": "siliconflow_free",
                    "base_url": "",
                    "api_key": "",
                    "model": ""
                }
            ],
            "llm_settings": {"lang_in": "en", "lang_out": "ja"}
        }
    })
claim.claimed = False

@worker_app.post("/agent/jobs/{job_id}/progress")
async def progress(job_id: str, req: FastAPIRequest):
    body = await req.json()
    progress_history.append(body)
    return JSONResponse({"ok": True})

@worker_app.post("/agent/jobs/{job_id}/attempts")
async def attempts(job_id: str, req: FastAPIRequest):
    return JSONResponse({"ok": True})

@worker_app.post("/agent/jobs/{job_id}/provider_stats")
async def stats(job_id: str, req: FastAPIRequest):
    return JSONResponse({"ok": True})

async def run_tests():
    global test_case
    
    config = Config(app=worker_app, host="127.0.0.1", port=8006, log_level="error")
    server = Server(config)
    server_task = asyncio.create_task(server.serve())
    await asyncio.sleep(1)

    os.environ["WORKER_API_BASE_URL_MOCK"] = "http://127.0.0.1:8006"
    os.environ["PC_AGENT_MODE"] = "mock"
    os.environ["AGENT_TOKEN"] = "test-token"
    os.makedirs("/tmp/job_outer_test", exist_ok=True)
    with open("/tmp/job_outer_test/input.pdf", "w") as f:
        f.write("dummy")

    sys.path.append("/srv/pdf2zh-web/v2/pc-api-python")
    import main
    main.UPLOAD_DIR = "/tmp"
    main.OUTPUT_DIR = "/tmp"
    main.WORK_DIR = "/tmp"
    main.LOG_DIR = "/tmp"

    class StopAgentLoop(BaseException):
        pass

    original_sleep = asyncio.sleep
    async def mock_sleep(seconds):
        if seconds == 5:
            raise StopAgentLoop("Stop Agent Loop")
        await original_sleep(seconds)
    
    asyncio.sleep = mock_sleep

    # RUN TEST A
    print("--- Running Test A: failure_count high, consecutive_router_failures = 0 ---")
    test_case = "A"
    claim.claimed = False
    progress_history.clear()
    try:
        await main.agent_loop()
    except StopAgentLoop:
        pass
        
    fallback_messages = [p for p in progress_history if "Retrying with SiliconFlow Free" in p.get("progress_message", "")]
    assert len(fallback_messages) == 0, "Test A FAILED: Outer fallback was incorrectly triggered!"
    assert progress_history[-1]["status"] == "completed", "Test A FAILED: Job did not complete!"
    print("Test A PASSED!")

    # RUN TEST B
    print("\n--- Running Test B: consecutive_router_failures = 3 ---")
    test_case = "B"
    claim.claimed = False
    progress_history.clear()
    try:
        await main.agent_loop()
    except StopAgentLoop:
        pass

    fallback_messages = [p for p in progress_history if "Retrying with SiliconFlow Free" in p.get("progress_message", "")]
    assert len(fallback_messages) > 0, "Test B FAILED: Outer fallback was NOT triggered!"
    assert progress_history[-1]["status"] == "completed", "Test B FAILED: Job did not complete via fallback!"
    print("Test B PASSED!")

    server.should_exit = True
    await server_task
    asyncio.sleep = original_sleep

if __name__ == "__main__":
    asyncio.run(run_tests())
