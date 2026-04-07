# AuditForge - Docker Deployment Guide

## Two Deployment Modes

### 1. App Only (Lightweight) - Recommended for most deployments
Use this if MySQL is managed separately (cloud database, Docker host, etc.)

### 2. Full Stack (App + MySQL) - For standalone deployment
Use this if you need MySQL in the same Docker environment.

---

## Lightweight Deployment (App Only)

### Prerequisites
- Docker Engine 20.0+
- Docker Compose v2.0+ (optional, can use `docker run` directly)
- External MySQL database (version 8.0+)

### Quick Start

**1. Environment Configuration**
```bash
cp .env.docker .env
```

Edit `.env` with your MySQL connection details:
```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-secure-password
DB_NAME=auditforge
SYNC_ENCRYPTION_KEY=your-32-byte-hex-key
NODE_ENV=production
```

**2. Run with Docker Compose (Recommended)**
```bash
# Build and start the app
docker-compose -f docker-compose.app.yml up -d

# View logs
docker-compose -f docker-compose.app.yml logs -f app

# Stop
docker-compose -f docker-compose.app.yml down
```

**3. Or Run with Docker directly**
```bash
docker run -d \
  --name auditforge \
  -p 3000:3000 \
  --env-file .env \
  auditforge:latest
```

**4. Access Application**
```
http://localhost:3000
```

### Image Size & Performance
- **Image Size**: ~150MB (lightweight Alpine base)
- **Memory**: ~200-300MB typical runtime
- **Startup Time**: <10 seconds
- **Production Ready**: Yes, with health checks enabled

---

## Full Stack Deployment (App + MySQL)

### Quick Start

**1. Environment Configuration**
```bash
cp .env.docker .env
```

**2. Run Full Stack**
```bash
# Build and start app + MySQL
docker-compose up -d

# View logs
docker-compose logs -f app

# Access
# - App: http://localhost:3000
# - Adminer (MySQL UI): http://localhost:8080
```

**3. MySQL Data Persistence**
Database data is stored in Docker volume `mysql_data` and persists across restarts.

---

## Docker Image Details

**Base Image**: `node:20-alpine`  
**Build Strategy**: Multi-stage build (builder → runner)  
**Final Size**: ~150MB  
**Port**: 3000  
**Environment**: Node.js 20 LTS

### Multi-Stage Build Process
1. **Builder Stage**: Installs all dependencies and builds Next.js
2. **Runner Stage**: Contains only production dependencies and built app (minimal)

---

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | localhost | MySQL hostname/IP |
| `DB_PORT` | Yes | 3306 | MySQL port |
| `DB_USER` | Yes | root | MySQL user |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | No | auditforge | Database name |
| `SYNC_ENCRYPTION_KEY` | Yes | - | 32-byte hex encryption key |
| `ITOP_URL` | No | - | iTOP API endpoint |
| `ITOP_USER` | No | - | iTOP username |
| `ITOP_PASSWORD` | No | - | iTOP password |
| `NODE_ENV` | No | production | Node environment |

---

## Build Docker Image

### Using Build Scripts

**Windows**:
```bash
docker-build.bat
or
docker-build.bat auditforge v0.1.0
```

**Linux/macOS**:
```bash
chmod +x docker-build.sh
./docker-build.sh
or
./docker-build.sh auditforge v0.1.0
```

### Manual Build
```bash
# Build with default tags
docker build -t auditforge:latest .

# Build with version tag
docker build -t auditforge:v0.1.0 .

# Build with custom registry
docker build -t ghcr.io/your-org/auditforge:latest .
```

---

## Push to GitHub Container Registry (GHCR)

### 1. Authenticate
```bash
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin
```

### 2. Tag Image
```bash
docker tag auditforge:latest ghcr.io/your-org/auditforge:latest
docker tag auditforge:latest ghcr.io/your-org/auditforge:v0.1.0
```

### 3. Push
```bash
docker push ghcr.io/your-org/auditforge:latest
docker push ghcr.io/your-org/auditforge:v0.1.0
```

### 4. Use in Another Environment
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/your-org/auditforge:latest
```

---

## Health Checks

The Docker container includes built-in health checks:
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 failures before unhealthy
- **Start Period**: 10 seconds grace time

Check container health:
```bash
docker ps
# Look for "healthy" or "unhealthy" status
```

---

## Production Deployment Checklist

### For Lightweight (App Only) Mode
- [ ] MySQL database provisioned externally
- [ ] Database backed up
- [ ] `.env` configured with secure credentials
- [ ] SYNC_ENCRYPTION_KEY generated (32-byte random hex)
- [ ] Database connection tested
- [ ] Reverse proxy configured (nginx/HAProxy)
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules: Only port 3000 to proxy allowed
- [ ] Docker version 20+ installed
- [ ] Log rotation configured
- [ ] Monitoring/alerting configured

### For Full Stack Mode
- [ ] All above items
- [ ] MySQL volume backup strategy planned
- [ ] Docker Compose restart policies configured
- [ ] Resource limits set (memory/CPU)
- [ ] Network isolation configured

---

## Troubleshooting

### Container exits immediately
```bash
# Check logs
docker logs auditforge-app
docker-compose logs app
```

### Database connection errors
```bash
# Verify MySQL is reachable (from Full Stack)
docker exec auditforge-mysql mysql -u root -p${DB_PASSWORD} -e "SELECT 1"

# For external MySQL, test connection
docker exec auditforge-app \
  sh -c "nc -zv $DB_HOST $DB_PORT"
```

### Port already in use
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/macOS

# Or change port in docker-compose.yml
```

### Performance issues
```bash
# Check resource usage
docker stats

# View app logs for errors
docker logs auditforge-app --tail 50 -f
```

### Build fails
```bash
# Clear Docker cache and rebuild
docker system prune -a
docker build --no-cache -t auditforge:latest .
```

---

## Storage & Volumes

### Lightweight Mode
No persistent volumes (database is external)

### Full Stack Mode
- **mysql_data**: Persists MySQL database files
- **./data/exports**: Local volume for audit exports

Backup database:
```bash
docker exec auditforge-mysql mysqldump \
  -u root -p${DB_PASSWORD} auditforge > backup.sql
```

---

## Docker Compose Commands Reference

```bash
# Start services (background)
docker-compose -f docker-compose.app.yml up -d

# Stop services
docker-compose -f docker-compose.app.yml down

# View logs
docker-compose -f docker-compose.app.yml logs -f app

# Restart service
docker-compose -f docker-compose.app.yml restart app

# Execute command in container
docker-compose -f docker-compose.app.yml exec app npm run lint

# View resource usage
docker stats

# Remove everything (including volumes)
docker-compose down -v
```

---

## Security Best Practices

1. **Never commit .env file** - Use .env.docker as template
2. **Use strong passwords** - Change from defaults
3. **Rotate encryption key** - SYNC_ENCRYPTION_KEY
4. **Run as non-root** - Consider running container with specific UID
5. **Network isolation** - Use bridge networks, not host
6. **Keep images updated** - Rebuild periodically
7. **Scan images** - Use `docker scan auditforge:latest`
8. **Use secrets management** - Docker Secrets in swarm mode
9. **Enable logging** - Centralize log collection
10. **Regular backups** - Database snapshots

---

## Container Registry Integration

### GitHub Actions Example
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: [v*]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.ref_name }}
```

---

## Support & Documentation

- Main README: [README.md](README.md)
- Architecture: See `/src` folder structure
- Database: See `/src/db/migrations`
- API Endpoints: See `/src/app/api`

For issues, check logs and this guide first before filing bug reports.

