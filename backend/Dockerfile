# Stage 1: install deps (build tools only here)
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ python3-dev libffi-dev libssl-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: minimal runtime (no gcc/g++, smaller image = faster push)
FROM python:3.11-slim

WORKDIR /app

# Runtime libs only if needed (e.g. for pq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY server.py .
COPY security.py .
COPY pgdoc ./pgdoc
COPY app ./app
COPY services ./services

RUN mkdir -p /app/uploads/catalog

EXPOSE 8000
CMD ["gunicorn", "server:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "--timeout", "60"]
