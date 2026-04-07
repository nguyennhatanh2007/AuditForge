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

REM Get project root (parent of docker folder)
set SCRIPT_DIR=%~dp0
for %%I in ("!SCRIPT_DIR!..\.") do set PROJECT_ROOT=%%~fI

echo [*] Building Docker image: !FULL_IMAGE_NAME!
cd /d "!PROJECT_ROOT!"
docker build -f docker\Dockerfile -t !FULL_IMAGE_NAME! .

if errorlevel 1 (
    echo [X] Build failed!
    exit /b 1
) else (
    echo [+] Build successful!
    echo.
    for /f %%i in ('docker images --format "{{.Size}}" !FULL_IMAGE_NAME!') do set SIZE=%%i
    echo Image size: !SIZE!
    echo.
    echo Next steps:
    echo.
    echo [*] Lightweight mode (app only, external MySQL^):
    echo     1. copy .env.docker .env
    echo     2. Edit .env with your MySQL host/credentials
    echo     3. docker-compose -f docker\docker-compose.app.yml up -d
    echo.
    echo [*] Full stack mode (app + MySQL^):
    echo     1. copy .env.docker .env
    echo     2. docker-compose -f docker\docker-compose.yml up -d
    echo.
    echo [*] Access app: http://localhost:3000
    echo.
)

endlocal
