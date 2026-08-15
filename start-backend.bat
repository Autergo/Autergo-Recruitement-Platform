@echo off
echo Starting Autergo Recruitment Platform Backend API Server...
cd /d "%~dp0backend"
set PYTHONPATH=%cd%
py -3.12 -m uvicorn app.main:app --reload --port 8000
pause
