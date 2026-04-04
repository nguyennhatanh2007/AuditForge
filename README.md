# Audit Forge

Audit Forge is a Next.js 15 App Router web application for CMDB synchronization auditing.

## Features in this scaffold

- Dashboard with operational overview
- Discrepancies list with exception-aware filtering
- Exceptions management workspace
- Sync jobs and configurations screens
- API route scaffolding for future backend wiring

## Data flow

- Raw source exports are read from `data/exports/<system>/`
- Each system folder can contain `vm.json`, `host.csv`, `lun.json`, and similar files
- MySQL stores system connections, exceptions, sync history, and generated discrepancy history only
- The sync endpoint compares export files against iTop export data and writes the results to history

## Environment

Copy `.env.example` to `.env.local` and fill MySQL + integration credentials.

### Storage API auth for array pulls

The storage collectors can read credentials from one of these sources:

- `STORAGE_SOURCE_CONFIG_FILE`: path to a JSON file with array connection data.
- `STORAGE_SOURCE_CONFIG_JSON`: inline JSON with the same shape as the file.
- Database fallback: enabled `system_configs` rows for `unity`, `pure`, and `alletra`.

Example file format is available at [config/storage-sources.example.json](config/storage-sources.example.json).

The file-based format supports `passwordFile` so Docker secrets or mounted files can be used instead of plaintext secrets.

### Storage API

Use the storage endpoints to pull array summaries and LUN details directly:

- `GET /api/storage` for all configured storage systems.
- `GET /api/storage?view=summary` for array-level capacity summaries.
- `GET /api/storage?view=luns` for normalized LUN records.
- `GET /api/inventory` now includes Unity, Pure, and Alletra storage data alongside vCenter and iTOP.

## Deploy with Docker (App container + External DB)

This project supports running only the Next.js app in Docker while keeping MySQL outside Docker.

### 1. Prerequisites

- Docker Desktop installed and running.
- External MySQL is reachable from Docker container network.

### 2. Prepare environment

Create/update `.env.local` (or export env vars in shell):

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SYNC_ENCRYPTION_KEY`

If MySQL runs on the same host machine and app runs in Docker, prefer:

- `DB_HOST=host.docker.internal`

### 3. Build and run app container

Use external-DB compose file:

```bash
docker compose -f docker-compose.external-db.yml --env-file .env.local up -d --build
```

App URL:

- `http://localhost:3000`

### 4. View logs / stop

```bash
docker compose -f docker-compose.external-db.yml logs -f app
docker compose -f docker-compose.external-db.yml down
```

### 5. Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/configurations
curl http://localhost:3000/api/inventory
```

### 6. Notes

- Do not use `docker-compose.yml` if you want DB outside Docker; use `docker-compose.external-db.yml`.
- If DB connection fails from container with `localhost`, switch to `host.docker.internal`.

## Auto push Docker image to GitHub (GHCR)

This repository includes a GitHub Actions workflow at `.github/workflows/docker-image.yml`.

What it does:

- Builds Docker image on every `git push` (all branches and tags).
- Pushes image to GitHub Container Registry (GHCR):
	- `ghcr.io/<owner>/<repo>:sha-<commit>`
	- `ghcr.io/<owner>/<repo>:<branch>`
	- `ghcr.io/<owner>/<repo>:latest` (default branch only)

Requirements:

- Repository Actions enabled.
- Package permissions enabled for `GITHUB_TOKEN` (workflow already sets `packages: write`).

View published image:

- GitHub repository -> `Packages` tab.
- Or pull manually:

```bash
docker pull ghcr.io/<owner>/<repo>:latest
```

Notes:

- Workflow triggers after commit is pushed to GitHub. Local commit only (without push) will not trigger Actions.
