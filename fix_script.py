import sys

with open("pc-api-python/main.py", "r") as f:
    lines = f.read().splitlines()

# add WAKE_EVENT
for i, line in enumerate(lines):
    if "ROUTER_STATES: Dict[str, Any] = {}" in line:
        lines.insert(i+1, "WAKE_EVENT = asyncio.Event()")
        break

# add wake endpoint
for i, line in enumerate(lines):
    if 'return Response("OK", status_code=200)' in line:
        wake_str = """
@app.post("/internal/wake")
async def wake_agent():
    WAKE_EVENT.set()
    return Response("Waked", status_code=200)"""
        lines.insert(i+1, wake_str)
        break

# find agent_loop
start_idx = -1
for i, line in enumerate(lines):
    if 'while True:' in line and 'async with httpx.AsyncClient' in lines[i-1]:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx+1, len(lines)):
    if 'logger.error(f"Agent loop error: {e}")' in lines[i]:
        end_idx = i + 1  # includes the sleep(5)
        break

# Rebuild the loop body
loop_body = lines[start_idx+1:end_idx+1]

new_loop_body = []
new_loop_body.append("            WAKE_EVENT.clear()")
new_loop_body.append("            while True:")

for line in loop_body:
    if line.strip() == "":
        new_loop_body.append(line)
    else:
        new_loop_body.append("    " + line)

new_loop_body_str = "\n".join(new_loop_body)
new_loop_body_str = new_loop_body_str.replace(
"""                    if resp.status_code != 200:
                        await asyncio.sleep(5)
                        continue""",
"""                    if resp.status_code != 200:
                        break""")

new_loop_body_str = new_loop_body_str.replace(
"""                    if not job:
                        await asyncio.sleep(5)
                        continue""",
"""                    if not job:
                        break""")

new_loop_body_str = new_loop_body_str.replace(
"""                except Exception as e:
                    logger.error(f"Agent loop error: {e}")
                    await asyncio.sleep(5)""",
"""                except Exception as e:
                    logger.error(f"Agent loop error: {e}")
                    break""")

new_loop_body_str += """
            try:
                await asyncio.wait_for(WAKE_EVENT.wait(), timeout=60.0)
            except asyncio.TimeoutError:
                pass"""

lines = lines[:start_idx+1] + new_loop_body_str.splitlines() + lines[end_idx+1:]

with open("pc-api-python/main.py", "w") as f:
    f.write("\n".join(lines) + "\n")

