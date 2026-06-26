FROM golang:1.22-bookworm AS builder
WORKDIR /app
COPY go.mod ./
# COPY go.sum ./
RUN go mod download || true
COPY . .
RUN go build -o /pc-api main.go

FROM python:3.11-slim-bookworm
# Install system dependencies if required by pdf2zh (e.g., fonts, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Install pdf2zh_next
RUN pip install --no-cache-dir pdf2zh-next

COPY --from=builder /pc-api /usr/local/bin/pc-api

# Create data directory
RUN mkdir -p /data/uploads /data/outputs /data/logs /data/work
WORKDIR /data

# Run API as root inside container so it can write to volume freely, 
# or can be adjusted depending on permissions.
CMD ["pc-api"]
