@echo off
cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo Python not found. Install from https://www.python.org/downloads/
    echo Check "Add python.exe to PATH".
    pause
    exit /b 1
  )
  set PY=py
) else (
  set PY=python
)

echo Installing / updating helpers...
%PY% -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 (
  echo pip install failed.
  pause
  exit /b 1
)

%PY% "%~dp0batch_pdo_to_dxf.py"
if errorlevel 1 pause
