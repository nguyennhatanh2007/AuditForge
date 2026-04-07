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

### Manual Build
```bash
cd docker
docker build -t auditforge:latest .
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

## For More Information

See `DOCKER.md` for comprehensive documentation including:
- Production deployment checklist
- Health checks and monitoring
- Scaling and performance tuning
- Security best practices
- Multi-environment setup
