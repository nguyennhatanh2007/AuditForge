@echo off
REM Build and export AuditForge as a single Docker image archive (.tar)
REM Usage: export-image.bat [image-name] [tag] [output-file]

setlocal enabledelayedexpansion

set IMAGE_NAME=%1
if "%IMAGE_NAME%"=="" set IMAGE_NAME=auditforge

set IMAGE_TAG=%2
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest

set OUTPUT_FILE=%3
if "%OUTPUT_FILE%"=="" set OUTPUT_FILE=%IMAGE_NAME%-%IMAGE_TAG%.tar

set FULL_IMAGE_NAME=%IMAGE_NAME%:%IMAGE_TAG%
set SCRIPT_DIR=%~dp0
for %%I in ("!SCRIPT_DIR!..\.") do set PROJECT_ROOT=%%~fI


docker info >nul 2>&1
if errorlevel 1 (
  echo Docker daemon is not running. Start Docker Desktop first.
  exit /b 1
)

echo Building image: !FULL_IMAGE_NAME!
cd /d "!PROJECT_ROOT!"
docker build -f docker\Dockerfile -t !FULL_IMAGE_NAME! .
if errorlevel 1 exit /b 1

echo Exporting image archive: !OUTPUT_FILE!
docker save -o "!OUTPUT_FILE!" !FULL_IMAGE_NAME!
if errorlevel 1 exit /b 1

echo Done. Image archive created at: !PROJECT_ROOT!\!OUTPUT_FILE!
endlocal
