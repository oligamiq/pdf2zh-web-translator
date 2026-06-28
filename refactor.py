import re

with open("pc-api-python/main.py", "r") as f:
    content = f.read()

# Add WAKE_EVENT = asyncio.Event() after ROUTER_STATES: Dict[str, Any] = {}
content = content.replace("ROUTER_STATES: Dict[str, Any] = {}\n", "ROUTER_STATES: Dict[str, Any] = {}\nWAKE_EVENT = asyncio.Event()\n")

# Add wake_agent endpoint after healthz
healthz_str = """@app.get("/internal/healthz")
async def healthz():
    return Response("OK", status_code=200)"""
wake_str = """\n\n@app.post("/internal/wake")
async def wake_agent():
    WAKE_EVENT.set()
    return Response("Waked", status_code=200)"""
content = content.replace(healthz_str, healthz_str + wake_str)

# Modify agent_loop
# Find the start of the while loop
loop_start = """    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:"""

new_loop_start = """    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            WAKE_EVENT.clear()
            
            while True:"""

content = content.replace(loop_start, new_loop_start)

# Now we need to indent everything inside the loop until `except Exception as e:` at the end.
lines = content.split('\n')
in_loop = False
in_try = False

new_lines = []
for i, line in enumerate(lines):
    if line.startswith("            try:"):
        if "resp = await client.post(" in lines[i+1]:
            in_loop = True
            in_try = True
            new_lines.append("                try:")
            continue
            
    if in_loop:
        if line.startswith("            except Exception as e:") and "logger.error(f\"Agent loop error: {e}\")" in lines[i+1]:
            in_loop = False
            new_lines.append("                except Exception as e:")
            continue
            
        if line.strip() == "":
            new_lines.append(line)
        else:
            new_lines.append("    " + line)
            
    else:
        new_lines.append(line)

content = "\n".join(new_lines)

# Now we replace the `await asyncio.sleep(5)` and `continue` with the new logic inside the loop.
# Notice that because of the indentation, we look for:
old_sleep_1 = """                if resp.status_code != 200:
                    await asyncio.sleep(5)
                    continue"""
new_sleep_1 = """                if resp.status_code != 200:
                    break"""
content = content.replace(old_sleep_1, new_sleep_1)

old_sleep_2 = """                if not job:
                    await asyncio.sleep(5)
                    continue"""
new_sleep_2 = """                if not job:
                    break"""
content = content.replace(old_sleep_2, new_sleep_2)

old_except_sleep = """                except Exception as e:
                    logger.error(f"Agent loop error: {e}")
                    await asyncio.sleep(5)"""
new_except_sleep = """                except Exception as e:
                    logger.error(f"Agent loop error: {e}")
                    break
                    
            try:
                await asyncio.wait_for(WAKE_EVENT.wait(), timeout=60.0)
            except asyncio.TimeoutError:
                pass"""
content = content.replace(old_except_sleep, new_except_sleep)

with open("pc-api-python/main.py", "w") as f:
    f.write(content)

