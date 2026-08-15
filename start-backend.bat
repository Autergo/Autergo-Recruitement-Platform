@echo off
echo Starting Autergo Recruitment Platform Backend API Server...
cd /d "%~dp0backend"
set PYTHONPATH=%cd%
if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
) else (
    py -3.12 -m uvicorn app.main:app --reload --port 8000
)
pause
