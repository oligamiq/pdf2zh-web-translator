# API Contract

## 1. Public API (Frontend -> Worker)
Base URL: `VITE_API_BASE_URL` (e.g. Cloudflare Worker URL)
Authentication: `Authorization: Bearer <Firebase ID Token>`

### `GET /healthz`
* **Method**: GET
* **Headers**: None
* **Body**: None
* **Response**: `200 OK`
  ```text
  OK
  ```

### `POST /jobs`
* **Method**: POST
* **Headers**: `Authorization: Bearer <token>` (Optional)
* **Body**: `FormData` containing a file field `pdf` (plus Turnstile token if public)
* **Success Response**: `200 OK`
  ```json
  {
    "id": "uuid-string",
    "status": "queued",
    "receipt": "random-secret-for-public-jobs" // Only returned for public jobs
  }
  ```
* **Error Response**: `400 Bad Request` or `401 Unauthorized` or `500 Internal Server Error`

### `GET /jobs`
* **Method**: GET
* **Headers**: `Authorization: Bearer <token>`
* **Body**: None
* **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "uuid-string",
      "user_id": "uid",
      "original_filename": "example.pdf",
      "status": "queued|running|succeeded|failed",
      "worker_id": "worker-1",
      "created_at": "ISO-string",
      "started_at": "ISO-string",
      "finished_at": null,
      "error_message": null
    }
  ]
  ```

### `GET /jobs/:id`
* **Method**: GET
* **Headers**: `Authorization: Bearer <token>`
* **Success Response**: `200 OK` (Same object as above)
* **Error Response**: `404 Not Found`

### `GET /jobs/:id/log`
* **Method**: GET
* **Query Parameters**: `offset=N&limit=65536`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response**: `200 OK`
  ```json
  {
    "data": "log text segment\n",
    "next_offset": 1024
  }
  ```

### `GET /jobs/:id/download`
* **Method**: GET
* **Headers**: `Authorization: Bearer <token>`
* **Success Response**: `200 OK` (Content-Type: `application/zip`)
* **Error Response**:
  * `404 Not Found` (job does not exist)
  * `409 Conflict` (not_ready, status is not succeeded)
  * `410 Gone` (download_expired)

### `GET /public/jobs/:id`
* **Method**: GET
* **Query Parameters**: `receipt=<secret>`
* **Success Response**: `200 OK` (Same object as `/jobs/:id`)

### `GET /public/jobs/:id/log`
* **Method**: GET
* **Query Parameters**: `receipt=<secret>&offset=N&limit=65536`
* **Success Response**: `200 OK` (Same as `/jobs/:id/log`)

### `GET /public/jobs/:id/download`
* **Method**: GET
* **Query Parameters**: `receipt=<secret>`
* **Success Response**: `200 OK` (Content-Type: `application/zip`)

---

## 2. PC Agent Polling API (PC Agent -> Worker)
Base URL: Cloudflare Worker URL
Authentication: `Authorization: Bearer <Agent Token>`

### `POST /agent/claim`
* **Method**: POST
* **Headers**: `Authorization: Bearer <token>`
* **Body**: JSON
  ```json
  { "worker_id": "pc-agent-1" }
  ```
* **Success Response**: `200 OK`
  ```json
  {
    "job": { "id": "uuid-string" }
  }
  ```
  *(Returns `job: null` if no queued jobs)*

### `POST /agent/jobs/:id/succeeded`
* **Method**: POST
* **Headers**: `Authorization: Bearer <token>`
* **Body**: None
* **Success Response**: `200 OK`
  ```json
  { "ok": true }
  ```

### `POST /agent/jobs/:id/failed`
* **Method**: POST
* **Headers**: `Authorization: Bearer <token>`
* **Body**: JSON
  ```json
  { "error": "Error details..." }
  ```
* **Success Response**: `200 OK`
  ```json
  { "ok": true }
  ```

### `POST /agent/heartbeat`
* **Method**: POST
* **Headers**: `Authorization: Bearer <token>`
* **Body**: None
* **Success Response**: `200 OK`
  ```json
  { "ok": true }
  ```

---

## 3. Private File/Process API (Worker -> PC API)
Base URL: Local network URL via Cloudflare Tunnel
Authentication: `X-Proxy-Secret: <proxy-secret>`

### `GET /internal/healthz`
### `PUT /internal/files/:id/input`
### `GET /internal/jobs/:id/log?offset=N&limit=M`
### `GET /internal/jobs/:id/download`
### `POST /internal/files/:id/delete`
### `POST /internal/jobs/:id/run`
