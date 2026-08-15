from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import httpx
import logging
import asyncio
import secrets
import socket
import ipaddress
from urllib.parse import urlparse

logger = logging.getLogger("pc-api-python")

ROUTER_STATES = {}

async def is_public_provider_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            return False
        if parsed.username or parsed.password:
            return False
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        infos = await asyncio.to_thread(socket.getaddrinfo, parsed.hostname, port, type=socket.SOCK_STREAM)
        if not infos:
            return False
        for info in infos:
            ip = ipaddress.ip_address(info[4][0])
            if not ip.is_global:
                return False
        return True
    except (OSError, ValueError):
        return False

async def handle_router_request(job_id: str, request: Request, router_token: str | None = None):
    state = ROUTER_STATES.get(job_id)
    if not state:
        return Response("Job state not found", status_code=404)

    expected_token = state.get("token")
    if not isinstance(expected_token, str) or not isinstance(router_token, str) or not secrets.compare_digest(router_token, expected_token):
        return Response("Job state not found", status_code=404)
        
    providers = state.get("providers", [])
    if not providers:
        return Response("No enabled providers found for job", status_code=400)
        
    req_body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    final_response = None
    
    for provider in providers:
        provider_id = provider.get("id")
        base_url = provider.get("base_url", "").rstrip("/")
        api_key = provider.get("api_key")
        model = provider.get("model")
        reasoning_effort = provider.get("reasoning_effort")
        try:
            timeout_seconds = float(provider.get("timeout_seconds") or 60.0)
        except (TypeError, ValueError):
            timeout_seconds = 60.0
        timeout_seconds = max(1.0, min(600.0, timeout_seconds))
        
        if not base_url:
            continue
            
        target_url = f"{base_url}/chat/completions"
        
        # Override model if provider has one
        import json
        payload = req_body
        try:
            body_json = json.loads(req_body)
            if model:
                body_json["model"] = model
            if reasoning_effort in ("low", "medium", "high"):
                body_json["reasoning_effort"] = reasoning_effort
            payload = json.dumps(body_json).encode("utf-8")
        except:
            pass
            
        req_headers = {k: v for k, v in headers.items() if k.lower() != "authorization"}
        if api_key:
            req_headers["Authorization"] = f"Bearer {api_key}"
            
        state["stats"].setdefault(provider_id, {
            "provider_snapshot_id": provider_id,
            "total_requests": 0,
            "success_count": 0,
            "failure_count": 0,
            "last_http_status": None,
            "last_error": None,
            "rate_limit_count": 0
        })
        
        stats = state["stats"][provider_id]
        stats["total_requests"] += 1

        if not await is_public_provider_url(target_url):
            stats["failure_count"] += 1
            stats["last_error"] = "Blocked non-public or invalid provider URL"
            final_response = Response("Provider URL is not allowed", status_code=400)
            continue
        
        # Check if streaming is requested
        is_stream = False
        try:
            if isinstance(req_body, bytes):
                body_json = json.loads(req_body)
                is_stream = body_json.get("stream", False)
        except:
            pass
            
        # Provider traffic must not inherit host HTTP(S)_PROXY settings; doing so could
        # bypass the destination checks above or leak user credentials to a proxy.
        client = httpx.AsyncClient(timeout=timeout_seconds, trust_env=False)
        try:
            req = client.build_request(request.method, target_url, headers=req_headers, content=payload)
            if is_stream:
                resp = await client.send(req, stream=True)
            else:
                resp = await client.send(req)
                
            stats["last_http_status"] = resp.status_code
            
            if resp.status_code < 200 or resp.status_code >= 300:
                if resp.status_code == 429:
                    stats["rate_limit_count"] += 1
                stats["failure_count"] += 1
                stats["last_error"] = f"HTTP {resp.status_code}"
                if is_stream:
                    await resp.aclose()
                await client.aclose()
                final_response = Response(f"Provider failed with {resp.status_code}", status_code=resp.status_code)
                continue
                
            state["active_provider_name"] = provider.get("display_name")
            
            if not is_stream:
                stats["success_count"] += 1
                state["consecutive_router_failures"] = 0
                body_bytes = resp.content
                await client.aclose()
                return Response(
                    content=body_bytes,
                    status_code=resp.status_code,
                    headers={k: v for k, v in resp.headers.items() if k.lower() not in ("content-length", "content-encoding")}
                )
            
            async def stream_generator():
                stream_success = True
                try:
                    async for chunk in resp.aiter_raw():
                        yield chunk
                except Exception as e:
                    stream_success = False
                    stats["failure_count"] += 1
                    stats["last_error"] = f"Mid-stream error: {str(e)[:200]}"
                    raise
                finally:
                    if stream_success:
                        stats["success_count"] += 1
                    await resp.aclose()
                    await client.aclose()
                    
            state["consecutive_router_failures"] = 0
            return StreamingResponse(
                stream_generator(),
                status_code=resp.status_code,
                headers={k: v for k, v in resp.headers.items() if k.lower() not in ("content-length", "content-encoding")}
            )
            
        except Exception as e:
            stats["failure_count"] += 1
            stats["last_error"] = str(e)[:200]
            final_response = Response(str(e), status_code=502)
            await client.aclose()
            continue
            
    state["consecutive_router_failures"] = state.get("consecutive_router_failures", 0) + 1
    return final_response or Response("All providers failed", status_code=502)
