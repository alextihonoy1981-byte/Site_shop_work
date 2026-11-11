@echo off
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0site\scripts\hosting-secrets.ps1"
if errorlevel 1 pause
