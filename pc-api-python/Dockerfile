FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ARG GIT_SHA="unknown"
ARG APP_VERSION="unknown"
ARG IMAGE_DIGEST="unknown"
ENV GIT_SHA=${GIT_SHA}
ENV APP_VERSION=${APP_VERSION}
ENV IMAGE_DIGEST=${IMAGE_DIGEST}

RUN mkdir -p /data/uploads /data/outputs /data/logs /data/work

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
