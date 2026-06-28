import asyncio
import os
import sys

# Mock for tenacity RetryError
class RetryError(Exception):
    def __init__(self, last_attempt):
        self.last_attempt = last_attempt

class Attempt:
    def __init__(self, exc):
        self._exc = exc
    def exception(self):
        return self._exc

# Mock for ExceptionGroup
class ExceptionGroup(Exception):
    def __init__(self, msg, exceptions):
        super().__init__(msg)
        self.exceptions = exceptions

# Mock for BabeldocError
class BabeldocError(Exception):
    pass

# Mock for httpx response and error
class Response:
    def __init__(self, status_code, text=""):
        self.status_code = status_code
        self.text = text

class Request:
    def __init__(self, url):
        self.url = url

class HTTPStatusError(Exception):
    def __init__(self, message, request=None, response=None):
        super().__init__(message)
        self.request = request
        self.response = response

# Mock httpx module
class MockHttpx:
    HTTPStatusError = HTTPStatusError
sys.modules['httpx'] = MockHttpx()

import httpx

# The function to test from main.py
def iter_exception_chain(exc, seen=None):
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

def test_extract_http_status_error():
    # Test 1: Simple RetryError wrapping HTTPStatusError (e.g. 429)
    resp = Response(429, "Too many requests")
    req = Request("http://test")
    http_err = HTTPStatusError("429 error", request=req, response=resp)
    
    retry_err = RetryError(Attempt(http_err))
    
    extracted = extract_http_status_error(retry_err)
    assert extracted is not None
    assert getattr(extracted.response, "status_code") == 429
    print("Test 1 Passed: Extracted 429 from RetryError")
    
    # Test 2: BabeldocError wrapping RetryError wrapping HTTPStatusError (e.g. 401)
    resp2 = Response(401, "Invalid API key")
    req2 = Request("http://test2")
    http_err2 = HTTPStatusError("401 error", request=req2, response=resp2)
    
    retry_err2 = RetryError(Attempt(http_err2))
    babeldoc_err = BabeldocError("asset coroutine failed")
    babeldoc_err.__cause__ = retry_err2
    
    extracted2 = extract_http_status_error(babeldoc_err)
    assert extracted2 is not None
    assert getattr(extracted2.response, "status_code") == 401
    print("Test 2 Passed: Extracted 401 from BabeldocError -> RetryError -> HTTPStatusError")

    # Test 3: ExceptionGroup wrapping HTTPStatusError (e.g. 400)
    resp3 = Response(400, "Bad Request")
    req3 = Request("http://test3")
    http_err3 = HTTPStatusError("400 error", request=req3, response=resp3)
    
    group_err = ExceptionGroup("group", [ValueError("other"), http_err3])
    babeldoc_err3 = BabeldocError("failed")
    babeldoc_err3.__context__ = group_err
    
    extracted3 = extract_http_status_error(babeldoc_err3)
    assert extracted3 is not None
    assert getattr(extracted3.response, "status_code") == 400
    print("Test 3 Passed: Extracted 400 from BabeldocError -> ExceptionGroup -> HTTPStatusError")
    
    print("All extraction tests passed!")

if __name__ == "__main__":
    test_extract_http_status_error()
