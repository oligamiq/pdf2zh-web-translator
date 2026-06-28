import re
import os

def main():
    with open("pc-api-python/main.py", "r") as f:
        content = f.read()

    # 1. Replace iter_exception_chain and extract_http_status_error
    old_iter = """                    def iter_exception_chain(exc):
                        seen = set()
                        cur = exc
                        while cur and id(cur) not in seen:
                            seen.add(id(cur))
                            yield cur
                            cur = getattr(cur, "__cause__", None) or getattr(cur, "__context__", None)

                    def extract_http_status_error(exc):
                        for e in iter_exception_chain(exc):
                            if isinstance(e, httpx.HTTPStatusError):
                                return e
                        return None"""

    new_iter = """                    def iter_exception_chain(exc, seen=None):
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
                            logger.warning(f"Failed to report provider stats: {e}")"""
    
    if old_iter in content:
        content = content.replace(old_iter, new_iter)
        print("iter_exception_chain replaced successfully")
    else:
        print("Could not find iter_exception_chain block")

    # 2. Update exception handling block
    # Since exact string matching failed, let's use regex or partial replace
    
    old_try_except = """                            except Exception as e:
                                import traceback
                                logger.exception(f"Job {job_id} failed with provider {display_name}")
                            
                                error_str = str(e)
                                http_status_code = None
                                http_err = extract_http_status_error(e)
                                if http_err:
                                    http_status_code = http_err.response.status_code
                                    body = http_err.response.text[:2048]
                                    req_url = str(http_err.request.url)"""
                                    
    new_try_except = """                            except Exception as e:
                                import traceback
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
                                    req_url = str(getattr(http_err.request, "url", ""))"""

    if old_try_except in content:
        content = content.replace(old_try_except, new_try_except)
        print("start of try/except replaced successfully")
    else:
        print("Could not find start of try/except block")

    # Replace the if http_err string matching
    old_error_str = """                                    if http_status_code in (301, 302, 307, 308):
                                        error_str = f"LLM API request failed: HTTP {http_status_code} Redirect.\\nBase URL setting might be incorrect. Please use the final API URL."
                                    elif http_status_code == 401:
                                        error_str = f"LLM API request failed: HTTP {http_status_code} Unauthorized.\\nPlease check your API key."
                                    elif http_status_code == 429:
                                        error_str = f"LLM API request failed: HTTP {http_status_code} Too Many Requests.\\nPlease wait or check your quota/rate limit."
                                    elif http_status_code == 400:
                                        error_str = f"LLM API request failed: HTTP {http_status_code} Bad Request.\\nPlease check the model name and base URL."
                                    else:
                                        error_str = f"LLM API request failed: HTTP {http_status_code}.\\nPlease check settings and logs."
                                    
                                    log_tail.append(f"--- HTTPStatusError Detail ---")
                                    log_tail.append(f"Model: {model}")
                                    base_url_safe = base_url.replace(api_key, "***") if (api_key and api_key in base_url) else base_url
                                    log_tail.append(f"Base URL: {base_url_safe}")
                                    log_tail.append(f"Request URL: {req_url}")
                                    log_tail.append(f"Status Code: {http_status_code}")
                                    body_safe = body.replace(api_key, "***") if (api_key and api_key in body) else body
                                    if http_status_code in (301, 302, 307, 308):
                                        log_tail.append("Response Body: <HTML response omitted due to redirect>")
                                    else:
                                        log_tail.append(f"Response Body:\\n{body_safe}")
                                    log_tail.append(f"------------------------------")"""
                                    
    new_error_str = """                                    if http_status_code in (301, 302, 307, 308):
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
                                    log_tail.append(f"Model: {model}")
                                    base_url_safe = base_url.replace(api_key, "***") if (api_key and api_key in base_url) else base_url
                                    log_tail.append(f"Base URL: {base_url_safe}")
                                    log_tail.append(f"Request URL: {req_url}")
                                    log_tail.append(f"Status Code: {http_status_code}")
                                    log_tail.append(f"Stream Started: {stream_started}")
                                    body_safe = body.replace(api_key, "***") if (api_key and api_key in body) else body
                                    if http_status_code in (301, 302, 307, 308):
                                        log_tail.append("Response Body: <HTML response omitted due to redirect>")
                                    elif "<html" in body_safe.lower() or "<!doctype html>" in body_safe.lower():
                                        log_tail.append("Response Body: <HTML response omitted>")
                                    else:
                                        log_tail.append(f"Response Body:\\n{body_safe}")
                                    log_tail.append(f"------------------------------")"""

    if old_error_str in content:
        content = content.replace(old_error_str, new_error_str)
        print("error string formatting replaced successfully")
    else:
        print("Could not find error string formatting block")

    # 3. Add report_provider_stats to the end of except block
    old_report_attempt = """                                await report_attempt(provider_id, provider_order, display_name, model, "failed", http_status_code, error_str)
                                final_error_str = error_str"""
    new_report_attempt = """                                await report_attempt(provider_id, provider_order, display_name, model, "failed", http_status_code, error_str)
                                await report_provider_stats(provider_id, http_status_code, error_str)
                                final_error_str = error_str"""
                                
    if old_report_attempt in content:
        content = content.replace(old_report_attempt, new_report_attempt)
        print("report_provider_stats call added successfully")
    else:
        print("Could not find report_attempt block")

    # 4. Add stream_started variable initialization
    if "last_progress_percent = 15" in content:
        content = content.replace("last_progress_percent = 15", "last_progress_percent = 15\n                            stream_started = False")
        print("stream_started initialized successfully")
    
    # 5. Update stream_started inside loop
    if "ev_type = event.get(\"type\")" in content:
        content = content.replace("ev_type = event.get(\"type\")", "stream_started = True\n                                    ev_type = event.get(\"type\")")
        print("stream_started updated successfully")

    with open("pc-api-python/main.py", "w") as f:
        f.write(content)
        
if __name__ == "__main__":
    main()
