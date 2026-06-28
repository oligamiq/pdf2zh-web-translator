import re

def main():
    with open("pc-api-python/main.py", "r") as f:
        content = f.read()

    # 1. Add imports and router mounts
    old_imports = """from pdf2zh_next.high_level import do_translate_async_stream, SettingsModel

app = FastAPI()"""
    new_imports = """from pdf2zh_next.high_level import do_translate_async_stream, SettingsModel
from router import handle_router_request, ROUTER_STATES

app = FastAPI()

@app.api_route("/router/{job_id}/v1/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def router_proxy(job_id: str, path: str, request: Request):
    return await handle_router_request(job_id, request)

@app.api_route("/router/{job_id}/v1", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def router_proxy_root(job_id: str, request: Request):
    return await handle_router_request(job_id, request)"""

    if old_imports in content:
        content = content.replace(old_imports, new_imports)
        print("Imports and router endpoints added.")
    else:
        print("Failed to add router endpoints.")

    # 2. Modify verify_secret
    old_verify = """@app.middleware("http")
async def verify_secret(request: Request, call_next):
    secret = os.environ.get("PROXY_SECRET")
    if secret and request.headers.get("X-Proxy-Secret") != secret:"""
    
    new_verify = """@app.middleware("http")
async def verify_secret(request: Request, call_next):
    if request.url.path.startswith("/router/"):
        return await call_next(request)
    secret = os.environ.get("PROXY_SECRET")
    if secret and request.headers.get("X-Proxy-Secret") != secret:"""

    if old_verify in content:
        content = content.replace(old_verify, new_verify)
        print("verify_secret modified.")
    else:
        print("Failed to modify verify_secret.")

    with open("pc-api-python/main.py", "w") as f:
        f.write(content)

if __name__ == "__main__":
    main()
