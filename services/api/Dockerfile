FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src
# Render / Fly / Railway inject PORT; local Compose defaults to 8000.
ENV PORT=8000

COPY pyproject.toml README.md ./
COPY src ./src
COPY alembic.ini ./
COPY alembic ./alembic
COPY scripts ./scripts
COPY static ./static
COPY resources ./resources

RUN pip install --no-cache-dir -U pip && pip install --no-cache-dir .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn northcare_api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
