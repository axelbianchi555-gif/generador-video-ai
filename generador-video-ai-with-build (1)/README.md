Generador de Videos AI — App (imagen → video)

Scaffolded local dev project. Components included:
- frontend/ : Minimal Next.js app (React + Tailwind optional)
- backend/  : Express server handling uploads, enqueuing jobs to Redis, status and download endpoints
- worker/   : Python worker that consumes Redis jobs and renders a short MP4 using ffmpeg
- docker-compose.yml : brings up redis, backend, worker, frontend (frontend optional to build in dev)
- scripts/ : helper scripts to build and run locally

Quick start (with Docker Compose):
1. Install Docker & Docker Compose.
2. From this folder run: `docker-compose up --build`
3. Open http://localhost:3000 (frontend) or talk to backend on http://localhost:8000
4. Upload an image, set duration/resolution/style, click Generate. Worker will process the job and output MP4 in backend/storage/outputs.

Notes:
- This is a minimal, local-dev scaffold. For production use: add auth, S3 storage, monitoring, quotas, model-based segmentation/effects, proper prompt parsing and safety checks.
- ffmpeg is required inside the worker container (installed in Dockerfile).

Enjoy — report problems and I can iterate further.
