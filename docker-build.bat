@echo off
REM AuditForge Docker Build & Deploy Script for Windows
REM Usage: docker-build.bat [image-name] [tag]

setlocal enabledelayedexpansion

set IMAGE_NAME=%1
if "%IMAGE_NAME%"=="" set IMAGE_NAME=auditforge

set IMAGE_TAG=%2
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest

set FULL_IMAGE_NAME=!IMAGE_NAME!:!IMAGE_TAG!

echo ==========================================
echo AuditForge Docker Build
echo ==========================================
echo Image: !FULL_IMAGE_NAME!
echo Time: %date% %time%
echo.

REM Check Docker daemon
docker info >nul 2>&1
if errorlevel 1 (
    echo [X] Docker daemon is not running!
    echo Please start Docker Desktop and try again.
    exit /b 1
)

REM Build image
echo [*] Building Docker image: !FULL_IMAGE_NAME!
docker build -t !FULL_IMAGE_NAME! .

if errorlevel 1 (
    echo [X] Build failed!
    exit /b 1
) else (
    echo [+] Build successful!
    echo.
    echo Next steps:
    echo 1. Configure environment: copy .env.docker .env
    echo 2. Edit .env with your settings
    echo 3. Start services: docker-compose up -d
    echo 4. View logs: docker-compose logs -f app
    echo 5. Access app: http://localhost:3000
    echo.
)

endlocal
