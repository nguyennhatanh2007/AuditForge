# AuditForge - Docker Deployment Guide

## Prerequisites
- Docker Engine 20.0+
- Docker Compose v2.0+

## Quick Start

### 1. Environment Configuration
Copy and customize the Docker environment file:
```bash
cp .env.docker .env
# Edit .env with your actual configuration values
```

### 2. Build and Run with Docker Compose
```bash
# Build image and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Access application
# - App: http://localhost:3000
# - Adminer (MySQL UI): http://localhost:8080
```

### 3. Build Docker Image Manually
```bash
# Build image with tags
docker build -t auditforge:latest -t auditforge:v0.1.0 .

# Run container (without compose)
docker run -d \
  --name auditforge \
  -p 3000:3000 \
  --env-file .env \
  auditforge:latest
```

## Docker Image Details

**Base Image:** `node:20-alpine`  
**Build Strategy:** Multi-stage build (builder → runner)  
**Size:** ~170MB (optimized)  
**Port:** 3000 (Next.js default)  
**Database:** MySQL 8.0 (via docker-compose)

## Multi-Environment Deployment

### Development Environment
```bash
docker-compose -f docker-compose.yml up -d
```

### Production Environment (with health checks)
```bash
# Pre-built image from GitHub Container Registry
docker pull ghcr.io/your-org/auditforge:v0.1.0
docker run -d \
  --name auditforge-prod \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  ghcr.io/your-org/auditforge:v0.1.0
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | localhost | MySQL host |
| `DB_PORT` | No | 3306 | MySQL port |
| `DB_USER` | Yes | root | MySQL user |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | No | auditforge | Database name |
| `SYNC_ENCRYPTION_KEY` | Yes | - | 32-byte encryption key |
| `ITOP_URL` | No | - | iTOP API endpoint |
| `AUDIT_EXPORT_DIR` | No | ./data/exports | Export directory |
| `NODE_ENV` | No | production | Node environment |

## Storage & Volumes

The docker-compose file includes:
- **MySQL Data Volume**: `mysql_data` - persists database across restarts
- **Exports Volume**: `./data/exports` - mounted for audit exports access

## Health Checks

The docker-compose configuration includes:
- MySQL health check: Validates database connectivity before app starts
- App: Accessible via port 3000 after startup

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi auditforge:latest auditforge:v0.1.0

# Remove all data (WARNING: deletes database)
docker-compose down -v
```

## Troubleshooting

### Container exits immediately
```bash
# Check logs
docker-compose logs app

# Verify MySQL is healthy
docker-compose logs mysql
```

### Database connection errors
```bash
# Verify MySQL is running
docker-compose ps

# Test connection from app container
docker exec auditforge-app npm run db:test
```

### Port already in use
```bash
# Change port in docker-compose.yml
# Or stop conflicting container
docker ps
docker stop <container-id>
```

## GitHub Container Registry (GHCR)

To push to GitHub Container Registry:

```bash
# Login
docker login ghcr.io

# Tag image
docker tag auditforge:v0.1.0 ghcr.io/<your-org>/auditforge:v0.1.0
docker tag auditforge:latest ghcr.io/<your-org>/auditforge:latest

# Push
docker push ghcr.io/<your-org>/auditforge:v0.1.0
docker push ghcr.io/<your-org>/auditforge:latest
```

## Production Deployment Checklist

- [ ] Environment variables configured (.env file)
- [ ] MySQL password changed from default
- [ ] SYNC_ENCRYPTION_KEY set to secure 32-byte value
- [ ] Database backups configured
- [ ] Reverse proxy/load balancer configured (nginx recommended)
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured (3000 only to proxy)
- [ ] Docker daemon restart policy set
- [ ] Monitoring/logging configured

## Contact & Support

For issues related to Docker deployment, check the main README.md or contact the development team.
