@echo off
title MemoryVault - Technical Archive ^& Memory Engine
cd /d "%~dp0"

echo =====================================================================
echo                      MemoryVault Engine                             
echo         Next.js App Router - Semantic Technical Archive             
echo =====================================================================
echo.

:: 1. Verifikasi instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem!
    echo Silakan instal Node.js dari https://nodejs.org terlebih dahulu.
    echo.
    pause
    exit /b 1
)

:: 2. Verifikasi dependensi node_modules
if not exist "node_modules\" (
    echo [INFO] Direktori node_modules belum ada. Menjalankan npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Instalasi dependensi gagal. Silakan periksa log di atas.
        pause
        exit /b 1
    )
)

:: 3. Buka peramban secara otomatis setelah server mulai
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

:: 4. Jalankan Next.js development server
echo [INFO] Menjalankan MemoryVault pada http://localhost:3000 ...
echo [INFO] Tekan Ctrl+C untuk menghentikan server.
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Server berhenti dengan kode %errorlevel%.
    pause
)
