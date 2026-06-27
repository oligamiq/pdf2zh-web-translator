#!/bin/bash
set -e

echo "Running E2E Progress Smoke Test..."

WORKER_API="http://localhost:8787"

# Check if worker is up
if ! curl -s $WORKER_API/health > /dev/null; then
  echo "Worker API not reachable at $WORKER_API"
  exit 1
fi

echo "Creating dummy PDF..."
echo "%PDF-1.4" > test_smoke.pdf
echo "%%EOF" >> test_smoke.pdf

echo "Uploading PDF and creating job..."
RESPONSE=$(curl -s -X POST $WORKER_API/api/jobs \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_smoke.pdf")

JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

if [ -z "$JOB_ID" ]; then
  echo "Failed to create job: $RESPONSE"
  rm test_smoke.pdf
  exit 1
fi

echo "Job created: $JOB_ID"

MAX_RETRIES=60
RETRY=0
SAW_PROGRESS=0

while [ $RETRY -lt $MAX_RETRIES ]; do
  JOB_RESP=$(curl -s $WORKER_API/api/jobs/$JOB_ID)
  STATUS=$(echo $JOB_RESP | grep -o '"status":"[^"]*' | grep -o '[^"]*$')
  PERCENT=$(echo $JOB_RESP | grep -o '"progress_percent":[^,}]*' | cut -d':' -f2)
  
  echo "Status: $STATUS | Progress: $PERCENT"
  
  if [ "$PERCENT" != "null" ] && [ "$PERCENT" != "0" ] && [ "$PERCENT" != "" ]; then
    SAW_PROGRESS=1
  fi
  
  if [ "$STATUS" = "succeeded" ]; then
    echo "Job succeeded!"
    break
  fi
  
  if [ "$STATUS" = "failed" ]; then
    echo "Job failed."
    break
  fi
  
  sleep 2
  RETRY=$((RETRY + 1))
done

rm test_smoke.pdf

if [ $SAW_PROGRESS -eq 1 ]; then
  echo "SUCCESS: Saw progress updates!"
  exit 0
else
  echo "FAILED: Did not see progress updates or job timed out."
  exit 1
fi
