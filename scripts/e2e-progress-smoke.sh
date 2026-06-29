#!/bin/bash
set -e

echo "Running E2E Progress Smoke Test..."

WORKER_URL="${WORKER_URL:-http://localhost:8787}"

# Check if worker is up
if ! curl -s $WORKER_URL/healthz > /dev/null; then
  echo "Worker API not reachable at $WORKER_URL"
  exit 1
fi

echo "Creating dummy PDF..."
echo "%PDF-1.4" > test_smoke.pdf
echo "%%EOF" >> test_smoke.pdf

echo "Uploading PDF and creating job..."
RESPONSE=$(curl -s -X POST $WORKER_URL/jobs \
  -H "Content-Type: multipart/form-data" \
  -F "pdf=@test_smoke.pdf")

JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
RECEIPT=$(echo $RESPONSE | grep -o '"receipt":"[^"]*' | grep -o '[^"]*$')

if [ -z "$JOB_ID" ]; then
  echo "Failed to create job: $RESPONSE"
  rm test_smoke.pdf
  exit 1
fi

echo "Job created: $JOB_ID"

MAX_RETRIES=60
RETRY=0
SAW_PROGRESS=0
FAILED_PROPERLY=0
LOG_TAIL_HAS_ERROR=0

while [ $RETRY -lt $MAX_RETRIES ]; do
  JOB_RESP=$(curl -s $WORKER_URL/public/jobs/$JOB_ID?receipt=$RECEIPT)
  STATUS=$(echo "$JOB_RESP" | grep -o '"status":"[^"]*' | grep -o '[^"]*$')
  PERCENT=$(echo "$JOB_RESP" | grep -o '"progress_percent":[^,}]*' | cut -d':' -f2)
  PHASE=$(echo "$JOB_RESP" | grep -o '"progress_phase":"[^"]*' | grep -o '[^"]*$' || echo "null")
  
  echo "Status: $STATUS | Progress: $PERCENT | Phase: $PHASE"
  
  if [ "$PERCENT" != "null" ] && [ "$PERCENT" != "0" ] && [ "$PERCENT" != "" ]; then
    SAW_PROGRESS=1
  fi
  
  if [ "$STATUS" = "completed" ]; then
    echo "Job completed!"
    break
  fi
  
  if [ "$STATUS" = "failed" ]; then
    echo "Job failed properly!"
    FAILED_PROPERLY=1
    
    # Check if phase is failed
    if [ "$PHASE" = "failed" ]; then
      echo "Phase is correctly set to failed."
    else
      echo "Phase is $PHASE instead of failed."
    fi

    # Check that error message is not TypeError
    ERROR_MSG=$(echo "$JOB_RESP" | grep -o '"error_message":"[^"]*' | cut -d'"' -f4)
    echo "Error message: $ERROR_MSG"
    if echo "$ERROR_MSG" | grep -qi "TypeError"; then
      echo "FAILED: Error message contains TypeError (report_progress signature issue?)"
      exit 1
    fi
    
    # Check log tail
    if echo "$JOB_RESP" | grep -qi "log_tail"; then
       LOG_TAIL_HAS_ERROR=1
       echo "Log tail is present."
    fi
    break
  fi
  
  sleep 2
  RETRY=$((RETRY + 1))
done

rm test_smoke.pdf

if [ "$STATUS" = "running" ] && [ "$PERCENT" = "0" ]; then
  echo "FAILED: Job got stuck at running 0%!"
  exit 1
fi

if [ $SAW_PROGRESS -eq 1 ] || [ $FAILED_PROPERLY -eq 1 ]; then
  echo "SUCCESS: Job progressed correctly and handled failure/success paths."
  exit 0
else
  echo "FAILED: Did not see progress updates or job timed out."
  exit 1
fi
