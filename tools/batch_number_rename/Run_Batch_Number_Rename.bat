@echo off
REM Double-click this to open the renamer (needs Python installed).
cd /d "%~dp0"
python --version >nul 2>&1
if errorlevel 1 (
  py --version >nul 2>&1
  if errorlevel 1 (
    echo Python was not found. Install from https://www.python.org/downloads/
    echo During setup, check "Add python.exe to PATH".
    pause
    exit /b 1
  )
  py "%~dp0batch_number_rename.py"
) else (
  python "%~dp0batch_number_rename.py"
)
if errorlevel 1 pause
