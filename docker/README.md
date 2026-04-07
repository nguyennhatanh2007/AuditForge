# Docker Directory

Docker configuration and deployment files for AuditForge.

## Contents

- `Dockerfile` - Multi-stage build configuration for production image
- `.dockerignore` - Files excluded from Docker build context
- `docker-compose.yml` - Full stack (app + MySQL) for development/standalone
- `docker-compose.app.yml` - Lightweight app-only container (external MySQL)
- `docker-compose.dev.yml` - Development environment with hot reload
- `docker-compose.external-db.yml` - App with external database configuration
- `DOCKER.md` - Comprehensive deployment guide
- `docker-build.sh` - Linux/macOS build helper script
- `docker-build.bat` - Windows build helper script
- `export-image.sh` - Linux/macOS image archive exporter
- `export-image.bat` - Windows image archive exporter

## Quick Start

### Lightweight Mode (External MySQL)
```bash
cp .env.docker .env
docker-compose -f docker/docker-compose.app.yml up -d
```

### Full Stack (App + MySQL)
```bash
cp .env.docker .env
docker-compose -f docker/docker-compose.yml up -d
```

### Offline Package (Single `.tar` File)
```bash
# On the build machine
cd docker
docker-build.bat auditforge latest
export-image.bat auditforge latest

# Copy auditforge-latest.tar to the remote machine, then:
docker load -i auditforge-latest.tar
docker run -d --name auditforge -p 3000:3000 --env-file .env auditforge:latest
```

### Automated Archive via GitHub Actions
The workflow at `.github/workflows/docker-image-tar.yml` builds the `.tar` automatically on `main` and uploads it as a downloadable artifact. If you need registry push, use `.github/workflows/docker-image-registry.yml`.

### Manual Build
```bash
cd docker
docker build -t auditforge:latest ..
```

## Image Information

- **Base**: Node.js 20-alpine
- **Size**: ~150MB
- **Port**: 3000
- **Environment**: Production ready

## Environment Setup

All docker-compose files require a `.env` file in the project root:

```bash
cp .env.docker .env
# Edit .env with your database credentials and API keys
```

## Deployment Modes

1. **Lightweight (docker-compose.app.yml)**
   - App only container
   - External MySQL database required
   - Best for cloud deployments

2. **Full Stack (docker-compose.yml)**
   - Includes MySQL 8.0 service
   - Includes Adminer UI (port 8080)
   - Best for all-in-one deployment

3. **Development (docker-compose.dev.yml)**
   - Source code mounted as volume
   - Hot reload enabled
   - For local development

4. **Offline package**
   - Build once and export to `.tar`
   - Copy the `.tar` file to a remote server with no Internet
   - Load it with `docker load -i`

## For More Information

See `DOCKER.md` for comprehensive documentation including:
- Production deployment checklist
- Health checks and monitoring
- Scaling and performance tuning
- Security best practices
- Multi-environment setup
