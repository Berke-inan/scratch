@echo off
title Lounge Box Kitchen - Kurulum
cd /d "%~dp0"

echo ===============================================================
echo    🛠️  LOUNGE BOX KITCHEN • ILK KURULUM
echo ===============================================================
echo.

node setup.js
if %errorlevel% neq 0 (
    echo.
    echo Kurulum sirasinda hata olustu.
    pause
) else (
    echo.
    pause
)
