import asyncio
from fastapi import FastAPI, Response, Request
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn
import threading

app_a = FastAPI()
app_b = FastAPI()

# Provider A (Port 8001)
@app_a.post("/v1/chat/completions")
async def provider_a_429():
    # Returns 429 Too Many Requests
    return Response(content="Rate limit exceeded", status_code=429)

@app_a.post("/v1/partial/chat/completions")
async def provider_a_partial():
    # Streams one chunk, then disconnects
    async def stream():
        yield b'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":12345,"model":"llama3","choices":[{"delta":{"content":"Hello"},"index":0,"finish_reason":null}]}\n\n'
        await asyncio.sleep(0.5)
        # Raising an exception will forcefully close the stream mid-way
        raise RuntimeError("Unexpected mid-stream crash")

    return StreamingResponse(stream(), media_type="text/event-stream")

# Provider B (Port 8002)
@app_b.post("/v1/chat/completions")
async def provider_b_success(request: Request):
    body = await request.json()
    model = body.get("model", "unknown")
    if not body.get("stream", False):
        return JSONResponse({
            "id": "chatcmpl-123",
            "model": model,
            "choices": [{"message": {"role": "assistant", "content": "Hello non-stream!"}}]
        })
        
    async def stream():
        yield b'data: {"id":"chatcmpl-456","object":"chat.completion.chunk","created":12345,"model":"gpt-4o","choices":[{"delta":{"content":"Hello from Provider B"},"index":0,"finish_reason":null}]}\n\n'
        await asyncio.sleep(0.1)
        yield b'data: {"id":"chatcmpl-456","object":"chat.completion.chunk","created":12345,"model":"gpt-4o","choices":[{"delta":{},"index":0,"finish_reason":"stop"}]}\n\n'
        yield b'data: [DONE]\n\n'

    return StreamingResponse(stream(), media_type="text/event-stream")

def run_a():
    uvicorn.run(app_a, host="127.0.0.1", port=8001, log_level="error")

def run_b():
    uvicorn.run(app_b, host="127.0.0.1", port=8002, log_level="error")

if __name__ == "__main__":
    t_a = threading.Thread(target=run_a)
    t_b = threading.Thread(target=run_b)
    t_a.start()
    t_b.start()
    t_a.join()
    t_b.join()
