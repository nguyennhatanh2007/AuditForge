# 🐳 AuditForge Docker Deployment - Complete Guide

## What is Docker Image & Where to Get It?

### Image Location Options

The Docker image `auditforge:latest` doesn't exist until you **build it**. There are 3 ways to get it:

#### **Option 1: Build Locally (Most Common)**
Build the image on your machine from source code.

#### **Option 2: Pull from GitHub Container Registry (GHCR)**
Download pre-built images pushed from the repository (requires automated CI/CD setup).

#### **Option 3: Manual Build & Push**
Build locally, then push to your own registry (Docker Hub, GHCR, etc.) for sharing.

---

## 🚀 Step-by-Step: Build & Deploy Locally (Recommended)

### **Step 1: Prerequisites**

Install required software on your system:

#### On Windows:
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
  - Includes Docker Engine + Docker Compose
  - Runs Docker daemon in background

#### On macOS:
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

#### On Linux:
```bash
# Ubuntu/Debian
sudo apt-get install docker.io docker-compose

# Then start daemon
sudo systemctl start docker
```

**Verify installation:**
```bash
docker --version
docker-compose --version
```

---

### **Step 2: Clone Project (if you don't have it)**

```bash
# Clone repository
git clone https://github.com/nguyennhatanh2007/AuditForge.git
cd AuditForge

# Switch to main branch (where all features are)
git checkout main
```

---

### **Step 3: Configure Environment**

```bash
# Copy template
cp .env.docker .env

# Edit .env with your settings
# (Choose based on deployment type below)
```

**For Lightweight Deployment (External MySQL):**
```env
DB_HOST=your-database-server.com    # e.g., db.example.com or 192.168.1.100
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-secure-password
DB_NAME=auditforge
SYNC_ENCRYPTION_KEY=abcd1234...      # 32-byte hex key
NODE_ENV=production
```

**For Full Stack (MySQL included in Docker):**
```env
DB_USER=root
DB_PASSWORD=MySecurePassword123!
DB_NAME=auditforge
SYNC_ENCRYPTION_KEY=abcd1234...
NODE_ENV=production
```

---

### **Step 4: Build Docker Image**

**Option A: Using Build Helper Script**

Windows:
```bash
cd docker
docker-build.bat
# Or with custom tags
docker-build.bat auditforge v1.0.0
```

Linux/macOS:
```bash
cd docker
chmod +x docker-build.sh
./docker-build.sh
# Or with custom tags
./docker-build.sh auditforge v1.0.0
```

**Option B: Manual Docker Build**

```bash
# Build with latest tag
docker build -f docker/Dockerfile -t auditforge:latest .

# Build with version tag
docker build -f docker/Dockerfile -t auditforge:v1.0.0 .

# Verify build succeeded
docker images | grep auditforge
```

**Expected output:**
```
REPOSITORY   TAG         IMAGE ID       SIZE
auditforge   latest      abc123def456   150MB
auditforge   v1.0.0      abc123def456   150MB
```

---

### **Step 5: Deploy the Application**

#### **LIGHTWEIGHT DEPLOYMENT** (External MySQL) - Recommended for Production

```bash
# Start application (builds image if needed, then runs container)
docker-compose -f docker/docker-compose.app.yml up -d

# View status
docker ps

# View logs (real-time)
docker-compose -f docker/docker-compose.app.yml logs -f app

# Check application is running
curl http://localhost:3000

# Stop application
docker-compose -f docker/docker-compose.app.yml down
```

---

#### **FULL STACK DEPLOYMENT** (App + MySQL in Docker)

```bash
# Start both app and MySQL
docker-compose -f docker/docker-compose.yml up -d

# View status
docker ps

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Access application
# - Main app: http://localhost:3000
# - MySQL admin: http://localhost:8080 (Adminer)

# Stop everything
docker-compose -f docker/docker-compose.yml down
```

---

#### **DEVELOPMENT DEPLOYMENT** (Hot reload with MySQL)

```bash
# Start with source code mounted
docker-compose -f docker/docker-compose.dev.yml up -d

# Changes to src/ code automatically reload
docker-compose -f docker/docker-compose.dev.yml logs -f app

# Stop
docker-compose -f docker/docker-compose.dev.yml down
```

---

### **Step 6: Verify Deployment**

```bash
# Check container is healthy
docker ps
# Look for "healthy" status

# Test API endpoints
curl http://localhost:3000
curl http://localhost:3000/api/health
curl http://localhost:3000/api/configurations

# View app logs
docker logs auditforge-app

# Access web interface
# Open browser to http://localhost:3000
```

---

## 📋 All Deployment Options Summary

| Mode | File | MySQL | Use Case | Command |
|------|------|-------|----------|---------|
| **Lightweight** | `docker-compose.app.yml` | External | Production, Cloud DB | `docker-compose -f docker/docker-compose.app.yml up -d` |
| **Full Stack** | `docker-compose.yml` | Included | All-in-one, Testing | `docker-compose -f docker/docker-compose.yml up -d` |
| **Development** | `docker-compose.dev.yml` | Included | Development, Hot reload | `docker-compose -f docker/docker-compose.dev.yml up -d` |
| **External DB** | `docker-compose.external-db.yml` | External | Separate DB host | `docker-compose -f docker/docker-compose.external-db.yml up -d` |

---

## 🐳 Using Docker Run (Without Docker Compose)

If you prefer direct Docker commands instead of docker-compose:

```bash
# Build image first
docker build -f docker/Dockerfile -t auditforge:latest .

# Run container
docker run -d \
  --name auditforge \
  -p 3000:3000 \
  --env-file .env \
  auditforge:latest

# Check status
docker ps

# View logs
docker logs -f auditforge

# Stop container
docker stop auditforge

# Remove container
docker rm auditforge
```

---

## 🔧 Common Operations

### **View Container Logs**
```bash
# Real-time logs
docker-compose -f docker/docker-compose.app.yml logs -f app

# Last 50 lines
docker logs -n 50 auditforge-app
```

### **Execute Command in Container**
```bash
# Run npm command
docker-compose -f docker/docker-compose.app.yml exec app npm run lint

# Access bash shell (if available)
docker exec -it auditforge-app sh
```

### **Check Container Resource Usage**
```bash
docker stats
```

### **Restart Container**
```bash
docker-compose -f docker/docker-compose.app.yml restart app
```

### **Remove Everything (Cleanup)**
```bash
# Stop and remove containers
docker-compose -f docker/docker-compose.app.yml down

# Remove image
docker rmi auditforge:latest

# Remove all unused Docker resources
docker system prune -a
```

---

## 🌐 Accessing the Application

After deployment, access the application:

- **Web UI**: `http://localhost:3000`
- **API Health**: `http://localhost:3000/api/health`
- **Configurations**: `http://localhost:3000/api/configurations`
- **Inventory**: `http://localhost:3000/api/inventory`

## 📊 File Organization Reference

```
AuditForge/
├── docker/                      # All Docker files
│   ├── Dockerfile               # Image build config
│   ├── docker-compose.yml       # Full stack
│   ├── docker-compose.app.yml   # Lightweight (recommended)
│   ├── docker-compose.dev.yml   # Development
│   ├── docker-build.sh/bat      # Build helpers
│   ├── README.md                # Docker overview
│   └── DOCKER.md                # This guide
│
├── .env.docker                  # Environment template
├── .env                         # Your settings (created from .env.docker)
└── src/                         # Application source code
```

---

## 🚀 Production Deployment Checklist

- [ ] Docker Desktop/Engine installed and running
- [ ] Project cloned: `git clone ...`
- [ ] Environment configured: `.env` file created
- [ ] MySQL database is accessible (if using external DB)
- [ ] SYNC_ENCRYPTION_KEY generated (32-byte hex)
- [ ] Image built: `docker build ...`
- [ ] Container started: `docker-compose ... up -d`
- [ ] Health check passing: `curl http://localhost:3000/api/health`
- [ ] Web UI accessible: `http://localhost:3000`
- [ ] Logs checked for errors: `docker logs ...`
- [ ] Firewall allows traffic on port 3000

---

## ❓ Troubleshooting

### **Docker Daemon Not Running**
```bash
# Error: "Cannot connect to Docker daemon"
# Solution: Start Docker Desktop (Windows/macOS) or:
sudo systemctl start docker  # Linux
```

### **Port 3000 Already in Use**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000        # Windows
lsof -i :3000                       # macOS/Linux

# Stop the container
docker-compose down

# Or change port in docker-compose file (ports: "8000:3000")
```

### **Database Connection Error**
```bash
# Check DB_HOST value in .env
# If DB is on same machine:
DB_HOST=host.docker.internal  # Windows/macOS
DB_HOST=172.17.0.1            # Linux (docker0 bridge)

# Test connection from container
docker exec auditforge-app curl http://$DB_HOST:3306
```

### **Container Starts But Exits**
```bash
# View error logs
docker logs auditforge-app

# Check if image exists
docker images | grep auditforge

# Rebuild image
docker build -f docker/Dockerfile -t auditforge:latest .
```

### **Out of Disk Space**
```bash
# Clean up old images/containers
docker system prune -a

# Remove specific image
docker rmi auditforge:old-version
```

---

## 📚 Additional Resources

- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Project README](../README.md)
- [Docker Build Scripts](./README.md)
- [Full Docker Guide](./DOCKER.md)

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Clone
git clone https://github.com/nguyennhatanh2007/AuditForge.git
cd AuditForge

# 2. Configure
cp .env.docker .env
# Edit .env with your database credentials

# 3. Build & Deploy
docker build -f docker/Dockerfile -t auditforge:latest .
docker-compose -f docker/docker-compose.app.yml up -d

# 4. Access
# http://localhost:3000

# 5. Verify
docker ps
docker logs -f auditforge-app
```

Done! 🚀
