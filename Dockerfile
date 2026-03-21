FROM python:3.12-slim
WORKDIR  /app

# deps necessárias pro mariadb (mariadb_config) + compilação
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  pkg-config \
  libmariadb-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD [ "gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "2", "-b", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-" ]
