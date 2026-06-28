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

# Global counter to verify cache reuse
call_counts = {"router": 0, "siliconflow_free": 0}

async def fake_do_translate_async_stream(settings, input_path):
    engine = settings.kwargs.get("translate_engine_settings", {}).get("translate_engine_type")
    
    if engine == "OpenAICompatible":
        call_counts["router"] += 1
        yield {"type": "progress_start", "percent": 0, "phase": "processing"}
        await asyncio.sleep(0.1)
        # Router successfully translates up to 50%
        yield {"type": "progress_update", "percent": 25, "phase": "processing"}
        await asyncio.sleep(0.1)
        yield {"type": "progress_update", "percent": 50, "phase": "processing"}
        # Then fails (e.g. 429)
        from httpx import HTTPStatusError, Request, Response
        req = Request("POST", "http://fake")
        resp = Response(429, request=req)
        raise HTTPStatusError("429 Too Many Requests", request=req, response=resp)

    elif engine == "SiliconFlowFree":
        call_counts["siliconflow_free"] += 1
        # Fallback provider: Thanks to Babeldoc cache, it INSTANTLY starts from 50%
        # It does NOT re-translate 0-50%
        yield {"type": "progress_start", "percent": 50, "phase": "processing"}
        await asyncio.sleep(0.1)
        yield {"type": "progress_update", "percent": 75, "phase": "processing"}
        await asyncio.sleep(0.1)
        yield {"type": "finish", "percent": 100, "phase": "completed"}
    else:
        raise Exception(f"Unknown engine {engine}")

mock_pdf2zh_high_level.do_translate_async_stream = fake_do_translate_async_stream

# 2. Mock the Worker API
from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from uvicorn import Config, Server

worker_app = FastAPI()
progress_history = []

@worker_app.post("/agent/claim")
async def claim(req: FastAPIRequest):
    # Only claim once, then empty
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
    print(f"Progress Update: {body}")
    return JSONResponse({"ok": True})

@worker_app.post("/agent/jobs/{job_id}/attempts")
async def attempts(job_id: str, req: FastAPIRequest):
    return JSONResponse({"ok": True})

@worker_app.post("/agent/jobs/{job_id}/provider_stats")
async def stats(job_id: str, req: FastAPIRequest):
    return JSONResponse({"ok": True})

async def run_tests():
    print("Starting Outer Fallback tests...")
    
    config = Config(app=worker_app, host="127.0.0.1", port=8006, log_level="error")
    server = Server(config)
    server_task = asyncio.create_task(server.serve())
    await asyncio.sleep(1)

    # 3. Setup env vars and run agent_loop once
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

    # Patch agent_loop so it stops after 1 iteration
    class StopAgentLoop(BaseException):
        pass

    original_sleep = asyncio.sleep
    async def mock_sleep(seconds):
        if seconds == 5:
            raise StopAgentLoop("Stop Agent Loop")
        await original_sleep(seconds)
    
    asyncio.sleep = mock_sleep
    try:
        await main.agent_loop()
    except StopAgentLoop:
        pass
    finally:
        asyncio.sleep = original_sleep

    # 4. Assertions
    print("\n--- Verifying Results ---")
    print("Call counts:", call_counts)
    
    # Assert do_translate_async_stream was called exactly once for each provider
    assert call_counts["router"] == 1, "Router should be called once"
    assert call_counts["siliconflow_free"] == 1, "SiliconFlowFree should be called once"
    
    # Assert that progress percent never rolled back
    percents = [p["progress_percent"] for p in progress_history if "progress_percent" in p]
    for i in range(1, len(percents)):
        assert percents[i] >= percents[i-1], f"Progress rolled back! {percents[i-1]} -> {percents[i]}"
    
    # Verify the fallback message
    fallback_messages = [p for p in progress_history if "Retrying with SiliconFlow Free" in p.get("progress_message", "")]
    assert len(fallback_messages) > 0, "Fallback message not found"
    
    # Verify final completion
    assert progress_history[-1]["status"] == "completed", "Job did not complete successfully"
    assert progress_history[-1]["progress_percent"] == 100, "Progress did not reach 100%"
    
    print("Outer fallback successfully used cache and didn't drop progress!")
    
    server.should_exit = True
    await server_task

if __name__ == "__main__":
    asyncio.run(run_tests())
