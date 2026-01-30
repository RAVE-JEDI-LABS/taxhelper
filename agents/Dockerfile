# Python AI Agents Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PDF/image processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Run FastAPI server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
