import asyncio
import httpx
import sys

async def run_tests():
    print("Starting router proxy tests...")
    
    # Wait for servers to be up
    async with httpx.AsyncClient() as client:
        # Test 1: Provider A returns 429, falls back to Provider B
        print("\n--- Test 1: 429 Fallback ---")
        
        # We simulate the router state directly in pc-api-python
        # But wait, we can't inject state easily unless we do it via a backdoor or directly import.
        # It's better to just write the test here, importing router directly and running it in a FastAPI app!
        from fastapi import FastAPI, Request
        from fastapi.responses import JSONResponse
        from uvicorn import Config, Server
        import sys
        sys.path.append("/srv/pdf2zh-web/v2/pc-api-python")
        from router import handle_router_request, ROUTER_STATES

        test_app = FastAPI()
        @test_app.post("/internal/router/{job_id}/{router_token}/v1/chat/completions")
        async def router_proxy(job_id: str, router_token: str, request: Request):
            if job_id not in ROUTER_STATES or ROUTER_STATES[job_id].get("token") != router_token:
                return JSONResponse({"error": "Unauthorized"}, status_code=404)
            return await handle_router_request(job_id, request)

        config = Config(app=test_app, host="127.0.0.1", port=8005, log_level="error")
        server = Server(config)
        
        # Run server in background
        task = asyncio.create_task(server.serve())
        await asyncio.sleep(1) # wait for start

        # Set up state
        ROUTER_STATES["job_test_1"] = {
            "token": "tok1",
            "providers": [
                {
                    "id": "prov_a",
                    "display_name": "Provider A",
                    "base_url": "http://127.0.0.1:8001/v1",
                    "api_key": "dummy_a",
                    "model": "llama3"
                },
                {
                    "id": "prov_b",
                    "display_name": "Provider B",
                    "base_url": "http://127.0.0.1:8002/v1",
                    "api_key": "dummy_b",
                    "model": "gpt-4o"
                }
            ],
            "stats": {},
            "active_provider_name": "Unknown"
        }

        # Make request to router
        payload = {"model": "test", "messages": [{"role": "user", "content": "hi"}], "stream": True}
        print("Sending request to router for Test 1...")
        async with httpx.AsyncClient(timeout=10.0) as client:
            async with client.stream("POST", "http://127.0.0.1:8005/internal/router/job_test_1/tok1/v1/chat/completions", json=payload) as resp:
                print(f"Router response status: {resp.status_code}")
                content = await resp.aread()
                print(f"Router response body: {content.decode('utf-8').strip()}")
        
        stats1 = ROUTER_STATES["job_test_1"]["stats"]
        print(f"Stats after Test 1: {stats1}")
        assert stats1["prov_a"]["rate_limit_count"] == 1
        assert stats1["prov_a"]["failure_count"] == 1
        assert stats1["prov_b"]["success_count"] == 1
        print("Test 1 passed: 429 successfully triggered fallback!")

        # Test 2: Provider A streams partial chunk then dies
        print("\n--- Test 2: Mid-stream disconnect ---")
        ROUTER_STATES["job_test_2"] = {
            "token": "tok2",
            "providers": [
                {
                    "id": "prov_a",
                    "display_name": "Provider A",
                    "base_url": "http://127.0.0.1:8001/v1/partial", # routes to partial
                    "api_key": "dummy_a",
                    "model": "llama3"
                },
                {
                    "id": "prov_b",
                    "display_name": "Provider B",
                    "base_url": "http://127.0.0.1:8002/v1",
                    "api_key": "dummy_b",
                    "model": "gpt-4o"
                }
            ],
            "stats": {},
            "active_provider_name": "Unknown"
        }

        print("Sending request to router for Test 2...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                async with client.stream("POST", "http://127.0.0.1:8005/internal/router/job_test_2/tok2/v1/chat/completions", json=payload) as resp:
                    print(f"Router response status: {resp.status_code}")
                    async for chunk in resp.aiter_raw():
                        print(f"Received chunk: {chunk}")
        except (httpx.ReadError, httpx.RemoteProtocolError) as e:
            print(f"Expected stream disconnect: {e}")
            
        stats2 = ROUTER_STATES["job_test_2"]["stats"]
        print(f"Stats after Test 2: {stats2}")
        assert stats2["prov_a"]["failure_count"] == 1
        assert stats2["prov_a"]["success_count"] == 0
        assert "prov_b" not in stats2 or stats2["prov_b"]["total_requests"] == 0
        print("Test 2 passed: Mid-stream disconnect did NOT fallback, correctly failed stream!")

        # Test 3: Stream=false fallback and model replacement
        print("\n--- Test 3: stream=false fallback & model replacement ---")
        ROUTER_STATES["job_test_3"] = {
            "token": "tok3",
            "providers": [
                {
                    "id": "prov_a",
                    "display_name": "Provider A",
                    "base_url": "http://127.0.0.1:8001/v1",
                    "api_key": "dummy_a",
                    "model": "llama-to-fail"
                },
                {
                    "id": "prov_b",
                    "display_name": "Provider B",
                    "base_url": "http://127.0.0.1:8002/v1",
                    "api_key": "dummy_b",
                    "model": "gpt-test-model"
                }
            ],
            "stats": {},
            "active_provider_name": "Unknown"
        }

        payload_false = {"model": "test", "messages": [{"role": "user", "content": "hi"}], "stream": False}
        print("Sending request to router for Test 3...")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("http://127.0.0.1:8005/internal/router/job_test_3/tok3/v1/chat/completions", json=payload_false)
            print(f"Router response status: {resp.status_code}")
            content = resp.text
            print(f"Router response body: {content}")
            
            # Provider B's fake server should return the model it received
            assert "gpt-test-model" in content, "Model was not replaced properly by router!"
            
        stats3 = ROUTER_STATES["job_test_3"]["stats"]
        print(f"Stats after Test 3: {stats3}")
        assert stats3["prov_a"]["failure_count"] == 1
        assert stats3["prov_b"]["success_count"] == 1
        print("Test 3 passed: stream=false successfully triggered fallback and model replaced!")

        server.should_exit = True
        await task

if __name__ == "__main__":
    asyncio.run(run_tests())
