FROM python:3.11-slim

# Avoid .pyc files, unbuffered stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Set working directory
WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY .env ./
COPY backend/ ./backend


# Expose FastAPI port
EXPOSE 8328

# Run FastAPI app
CMD ["uvicorn", "backend.src.adapters.inbound.api.main:app", "--host", "0.0.0.0", "--port", "8328", "--reload"]