# Lounge Box Kitchen - PowerShell Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "   🍽️  LOUNGE BOX KITCHEN • PROJE BASLATILIYOR (PowerShell)   " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

node start.js
