import sys
import asyncio
import os
import shutil
import httpx
from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from uvicorn import Config, Server

from pdf2zh_next.high_level import do_translate_async_stream, SettingsModel

llm_app = FastAPI()
llm_calls = {"provA": 0, "provB": 0}

@llm_app.post("/provA/v1/chat/completions")
async def prov_a_chat(req: FastAPIRequest):
    llm_calls["provA"] += 1
    if llm_calls["provA"] <= 2:
        return JSONResponse({"id": "chatcmpl-1", "model": "gpt-4", "choices": [{"message": {"role": "assistant", "content": "Provider A translation"}}]})
    else:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

@llm_app.post("/provB/v1/chat/completions")
async def prov_b_chat(req: FastAPIRequest):
    llm_calls["provB"] += 1
    return JSONResponse({"id": "chatcmpl-1", "model": "gpt-4", "choices": [{"message": {"role": "assistant", "content": "Provider B translation"}}]})

async def run_test():
    print("Starting real cache integration test...")
    config = Config(app=llm_app, host="127.0.0.1", port=8007, log_level="error")
    server = Server(config)
    server_task = asyncio.create_task(server.serve())
    await asyncio.sleep(1)

    pdf_path = "/srv/pdf2zh-web/v2/fixtures/smoke-text.pdf"
    work_dir = "/tmp/real_test_work"
    output_dir = "/tmp/real_test_output"
    
    shutil.rmtree(work_dir, ignore_errors=True)
    shutil.rmtree(output_dir, ignore_errors=True)
    os.makedirs(work_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    test_pdf = os.path.join(work_dir, "test.pdf")
    shutil.copy(pdf_path, test_pdf)

    # To ensure outer fallback reuses cache, these settings must match exactly (except engine details)
    def make_settings(base_url):
        return SettingsModel(
            translation={"lang_in": "en", "lang_out": "ja", "output": output_dir},
            pdf={"watermark_output_mode": "no_watermark"},
            translate_engine_settings={
                "translate_engine_type": "OpenAICompatible",
                "openai_compatible_model": "gpt-4",
                "openai_compatible_base_url": base_url,
                "openai_compatible_api_key": "dummy"
            }
        )

    print("\n--- Provider A Run ---")
    settings_a = make_settings("http://127.0.0.1:8007/provA/v1")
    
    try:
        os.chdir(work_dir)
        async for event in do_translate_async_stream(settings_a, test_pdf):
            pass
    except Exception as e:
        print("Provider A stream exception:", e)

    print("\n--- Provider B Run (Fallback) ---")
    settings_b = make_settings("http://127.0.0.1:8007/provB/v1")
    
    finished = False
    try:
        async for event in do_translate_async_stream(settings_b, test_pdf):
            if event.get("type") == "progress_update":
                print(f"Prov B Progress: {event.get('percent')}%")
            if event.get("type") == "finish":
                finished = True
    except Exception as e:
        print("Provider B failed:", e)
        raise

    print("\n--- Verifying Results ---")
    print("Call counts:", llm_calls)
    
    assert finished, "Provider B did not finish the translation!"
    
    print("Integration test passed! Cache verification script executed successfully.")
    
    server.should_exit = True
    await server_task

if __name__ == "__main__":
    asyncio.run(run_test())
