import asyncio
from fastapi import Request

import sys
from pathlib import Path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root / "pc-api-python"))
import router

class MockRequest:
    def __init__(self, method="POST", url="http://localhost", headers=None, body=b"{}"):
        self.method = method
        self.url = url
        self.headers = headers or {}
        self._body = body

    async def body(self):
        return self._body

async def test_router():
    async def allow_test_provider_url(_url: str) -> bool:
        return True
    router.is_public_provider_url = allow_test_provider_url

    job_id = "test_429"
    router.ROUTER_STATES[job_id] = {
        "token": "test-token",
        "providers": [{
            "id": "p1",
            "base_url": "http://mock",
            "model": "test",
            "api_key": "test"
        }],
        "stats": {},
        "consecutive_router_failures": 0
    }
    
    # Invalid per-job router capability must be rejected before any upstream request.
    req = MockRequest()
    unauthorized = await router.handle_router_request(job_id, req, "wrong-token")
    assert unauthorized.status_code == 404

    # Mock httpx client
    import httpx
    class MockResponse:
        def __init__(self, status_code):
            self.status_code = status_code
        async def aclose(self): pass

    class MockAsyncClient:
        def __init__(self, **kwargs): pass
        def build_request(self, *args, **kwargs): return args
        async def send(self, *args, **kwargs): return MockResponse(429)
        async def aclose(self): pass

    original_client = httpx.AsyncClient
    httpx.AsyncClient = MockAsyncClient
    
    res = await router.handle_router_request(job_id, req, "test-token")
    
    stats = router.ROUTER_STATES[job_id]["stats"]["p1"]
    assert stats["total_requests"] == 1
    assert stats["failure_count"] == 1
    assert stats["last_http_status"] == 429
    assert stats["rate_limit_count"] == 1
    assert res.status_code == 429
    
    # test 400
    router.ROUTER_STATES[job_id]["providers"][0]["id"] = "p2"
    
    class MockAsyncClient400(MockAsyncClient):
        async def send(self, *args, **kwargs): return MockResponse(400)
    httpx.AsyncClient = MockAsyncClient400
    
    res2 = await router.handle_router_request(job_id, req, "test-token")
    stats2 = router.ROUTER_STATES[job_id]["stats"]["p2"]
    assert stats2["total_requests"] == 1
    assert stats2["failure_count"] == 1
    assert stats2["last_http_status"] == 400
    assert stats2["rate_limit_count"] == 0
    assert res2.status_code == 400
    
    httpx.AsyncClient = original_client
    print("All router stats tests passed!")

if __name__ == "__main__":
    asyncio.run(test_router())
