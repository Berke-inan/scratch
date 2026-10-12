@echo off
title Lounge Box Kitchen - Anahtar ve Ayar Sihirbazi
cd /d "%~dp0"

node configure-keys.js
if %errorlevel% neq 0 (
    echo.
    echo Bir hata olustu.
    pause
) else (
    echo.
    pause
)
