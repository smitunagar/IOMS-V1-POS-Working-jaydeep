# Quick Git Push Script
$gitPath = "C:\Users\alvi\AppData\Local\Programs\Git\bin\git.exe"

Write-Host "🚀 Configuring Git for better push performance..." -ForegroundColor Green

# Configure git for large pushes
& $gitPath config http.postBuffer 524288000
& $gitPath config http.maxRequestBuffer 100M
& $gitPath config core.compression 0
& $gitPath config pack.windowMemory 10m
& $gitPath config pack.packSizeLimit 20m

Write-Host "📤 Attempting to push to GitHub..." -ForegroundColor Yellow

# Try the push
& $gitPath push origin Noman

Write-Host "✅ Push attempt completed!" -ForegroundColor Green
