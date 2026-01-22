# EnSQL Production Build Script
# Tum projelerin production buildlerini dist klasoru icinde olusturur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EnSQL Production Build Baslatiliyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ana dist klasorunu temizle ve olustur
if (Test-Path "dist") {
  Write-Host "Mevcut dist klasoru temizleniyor..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force "dist"
}
New-Item -ItemType Directory -Force -Path "dist" | Out-Null

# Basarili ve basarisiz buildleri takip et
$successBuilds = @()
$failedBuilds = @()

# 1. ADMIN PANEL BUILD
Write-Host ""
Write-Host "1/5 - Admin Panel build ediliyor..." -ForegroundColor Green
Set-Location "admin"
try {
  npm run build
  if ($LASTEXITCODE -eq 0) {
    $successBuilds += "Admin Panel"
    Write-Host "[OK] Admin Panel basariyla build edildi" -ForegroundColor Green
  }
  else {
    $failedBuilds += "Admin Panel"
    Write-Host "[HATA] Admin Panel build hatasi!" -ForegroundColor Red
  }
}
catch {
  $failedBuilds += "Admin Panel"
  Write-Host "[HATA] Admin Panel build hatasi: $_" -ForegroundColor Red
}
Set-Location ".."

# 2. PARTNER PANEL BUILD
Write-Host ""
Write-Host "2/5 - Partner Panel build ediliyor..." -ForegroundColor Green
Set-Location "partner"
try {
  npm run build
  if ($LASTEXITCODE -eq 0) {
    $successBuilds += "Partner Panel"
    Write-Host "[OK] Partner Panel basariyla build edildi" -ForegroundColor Green
  }
  else {
    $failedBuilds += "Partner Panel"
    Write-Host "[HATA] Partner Panel build hatasi!" -ForegroundColor Red
  }
}
catch {
  $failedBuilds += "Partner Panel"
  Write-Host "[HATA] Partner Panel build hatasi: $_" -ForegroundColor Red
}
Set-Location ".."

# 3. CLIENT BUILD
Write-Host ""
Write-Host "3/5 - Client build ediliyor..." -ForegroundColor Green
Set-Location "client"
try {
  npm run build
  if ($LASTEXITCODE -eq 0) {
    $successBuilds += "Client"
    Write-Host "[OK] Client basariyla build edildi" -ForegroundColor Green
  }
  else {
    $failedBuilds += "Client"
    Write-Host "[HATA] Client build hatasi!" -ForegroundColor Red
  }
}
catch {
  $failedBuilds += "Client"
  Write-Host "[HATA] Client build hatasi: $_" -ForegroundColor Red
}
Set-Location ".."

# 4. WEB BUILD
Write-Host ""
Write-Host "4/5 - Web build ediliyor..." -ForegroundColor Green
Set-Location "web"
try {
  npm run build
  if ($LASTEXITCODE -eq 0) {
    $successBuilds += "Web"
    Write-Host "[OK] Web basariyla build edildi" -ForegroundColor Green
  }
  else {
    $failedBuilds += "Web"
    Write-Host "[HATA] Web build hatasi!" -ForegroundColor Red
  }
}
catch {
  $failedBuilds += "Web"
  Write-Host "[HATA] Web build hatasi: $_" -ForegroundColor Red
}
Set-Location ".."

# 5. KERNEL (Backend) - src dosyalarini kopyala
Write-Host ""
Write-Host "5/5 - Kernel (Backend) kopyalaniyor..." -ForegroundColor Green
try {
  New-Item -ItemType Directory -Force -Path "dist/kernel" | Out-Null
    
  # src klasorunu kopyala
  Copy-Item -Path "kernel\src" -Destination "dist\kernel\src" -Recurse -Force
    
  # package.json ve diger gerekli dosyalari kopyala
  Copy-Item -Path "kernel\package.json" -Destination "dist\kernel\" -Force
    
  # .env.example varsa kopyala
  if (Test-Path "kernel\.env.example") {
    Copy-Item -Path "kernel\.env.example" -Destination "dist\kernel\" -Force
  }
    
  # README varsa kopyala
  if (Test-Path "kernel\README.md") {
    Copy-Item -Path "kernel\README.md" -Destination "dist\kernel\" -Force
  }
    
  $successBuilds += "Kernel"
  Write-Host "[OK] Kernel basariyla kopyalandi" -ForegroundColor Green
}
catch {
  $failedBuilds += "Kernel"
  Write-Host "[HATA] Kernel kopyalama hatasi: $_" -ForegroundColor Red
}

# OZET
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Islemi Tamamlandi!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($successBuilds.Count -gt 0) {
  Write-Host "Basarili Buildler ($($successBuilds.Count)):" -ForegroundColor Green
  foreach ($build in $successBuilds) {
    Write-Host "  + $build" -ForegroundColor Green
  }
}

if ($failedBuilds.Count -gt 0) {
  Write-Host ""
  Write-Host "Basarisiz Buildler ($($failedBuilds.Count)):" -ForegroundColor Red
  foreach ($build in $failedBuilds) {
    Write-Host "  - $build" -ForegroundColor Red
  }
  Write-Host ""
  Write-Host "Hatalari kontrol edin ve tekrar deneyin." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Tum dosyalar dist klasorunde hazir!" -ForegroundColor Green
Write-Host ""
Write-Host "Klasor yapisi:" -ForegroundColor Cyan
Write-Host "  dist/" -ForegroundColor White
Write-Host "    admin/      (Admin Panel production build)" -ForegroundColor White
Write-Host "    partner/    (Partner Panel production build)" -ForegroundColor White
Write-Host "    client/     (Client App production build + PWA)" -ForegroundColor White
Write-Host "    web/        (Web production build)" -ForegroundColor White
Write-Host "    kernel/     (Backend API dosyalari)" -ForegroundColor White
Write-Host ""
Write-Host "NOT: Tum buildler production config ile yapilmistir." -ForegroundColor Yellow
Write-Host "     - Admin:   https://admin.ensql.com.tr" -ForegroundColor White
Write-Host "     - Partner: https://partner.ensql.com.tr" -ForegroundColor White
Write-Host "     - Client:  https://app.ensql.com.tr" -ForegroundColor White
Write-Host "     - Kernel:  https://kernel.ensql.com.tr/api" -ForegroundColor White
Write-Host ""
Write-Host "Deployment icin dist klasorunu sunucuya kopyalayabilirsiniz." -ForegroundColor Green
Write-Host ""
