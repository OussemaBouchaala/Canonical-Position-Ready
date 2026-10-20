@echo off
title Canonical Academy
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (set PY=python) else (
  where py >nul 2>nul
  if %errorlevel%==0 (set PY=py) else (
    echo Python 3 is not installed. Get it from https://www.python.org/downloads/ and tick "Add to PATH".
    pause
    exit /b 1
  )
)
%PY% server.py
pause
