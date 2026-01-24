# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "Starting EnSQL Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists in root
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing concurrently..." -ForegroundColor Yellow
    yarn install
    Write-Host ""
}

Write-Host "Starting all services..." -ForegroundColor Green
Write-Host ""
Write-Host "  Kernel  -> http://localhost:13201" -ForegroundColor Blue
Write-Host "  Admin   -> http://localhost:13205" -ForegroundColor Magenta
Write-Host "  Partner -> http://localhost:13202" -ForegroundColor Cyan
Write-Host "  Client  -> http://localhost:13203" -ForegroundColor Green
Write-Host "  Web     -> http://localhost:13204" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Run all services
yarn dev
