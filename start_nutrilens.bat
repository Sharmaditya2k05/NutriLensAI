@echo off
title NutriLens AI Launcher
echo ===================================================
echo   Starting NutriLens AI Full-Stack Application...
echo ===================================================
echo.

echo [1/2] Launching Python FastAPI Backend on Port 8000...
start "NutriLens AI - Backend Server" /D "%~dp0nutrilens2" cmd /k "python -m pip install -r requirements.txt --quiet && uvicorn server:app --reload --port 8000 --host 0.0.0.0"

echo [2/2] Launching React Vite Frontend on Port 5173...
start "NutriLens AI - Frontend Server" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo Both servers are launching in separate windows!
echo Keep those windows open while using NutriLens AI.
echo ===================================================
pause
