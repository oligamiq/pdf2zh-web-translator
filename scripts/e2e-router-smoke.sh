#!/bin/bash
set -e

echo "Starting Router Smoke Test"

cd /srv/pdf2zh-web/v2/scripts

echo "Installing requirements..."
python3 -m pip install fastapi uvicorn httpx --break-system-packages >/dev/null 2>&1

echo "Starting fake OpenAI server..."
python3 fake_openai_server.py &
FAKE_SERVER_PID=$!

sleep 2

echo "Running router tests..."
if python3 test_router.py; then
    echo "Router Smoke Test passed!"
    kill $FAKE_SERVER_PID
    exit 0
else
    echo "Router Smoke Test failed!"
    kill $FAKE_SERVER_PID
    exit 1
fi
