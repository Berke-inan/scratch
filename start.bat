@echo off
title Lounge Box Kitchen - Dev Server
cd /d "%~dp0"

echo ===============================================================
echo    🍽️  LOUNGE BOX KITCHEN • PROJE BASLATILIYOR
echo ===============================================================
echo.

node start.js
if %errorlevel% neq 0 (
    echo.
    echo Node.js calistirilamadi! Lutfen Node.js yuklu oldugundan emin olun.
    pause
)
