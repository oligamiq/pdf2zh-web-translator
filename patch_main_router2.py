import re

def main():
    with open("pc-api-python/main.py", "r") as f:
        content = f.read()

    # We need to replace the entire provider loop block
    # from: `job_success = False` (around line 359)
    # up to the end of the `try/except` block (before `if job_success:`)
    
    # First let's find the exact text
    start_marker = "                        job_success = False"
    end_marker = "                        if job_success:"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find markers!")
        return

    old_block = content[start_idx:end_idx]

    new_block = """                        job_success = False
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
                            "openai_compatible_base_url": f"http://127.0.0.1:8000/router/{job_id}/v1",
                            "openai_compatible_api_key": "dummy"
                        }
                        
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
                                    f.write(log_msg + "\\n")
                                
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
                                    log_tail.append(f"Response Body:\\n{body}")
                                log_tail.append(f"------------------------------")

                            elif isinstance(e, (httpx.TimeoutException, httpx.ConnectError)):
                                error_str = f"LLM API request failed: Connection error or timeout."
                        
                            tb_str = traceback.format_exc()
                            log_tail.append(f"Exception:\\n{tb_str}")
                            
                            final_error_str = error_str
                            
                            await report_progress(last_progress_percent, "failed", error_str, active_provider_name=display_name, log_tail=log_tail[-200:])
                            
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

"""

    content = content[:start_idx] + new_block + content[end_idx:]

    with open("pc-api-python/main.py", "w") as f:
        f.write(content)
        
    print("Successfully replaced execution block with router logic.")

if __name__ == "__main__":
    main()
