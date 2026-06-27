import requests
job_id = "test-job-ping"
url = "http://localhost:8787/agent/jobs/" + job_id + "/progress"
r = requests.post(
    url,
    headers={"Authorization": "Bearer -pR3V6QRiGeSAGuNTPvNJnmZqDCHeHxrBexCwBntVUkK0z9IJRu0GXaem4VmCyrC"},
    json={
        "status": "running",
        "progress_percent": 1,
        "progress_phase": "debug",
        "progress_message": "debug progress ping",
    },
    timeout=15,
)
print(r.status_code, r.text[:500])
