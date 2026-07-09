@echo off
echo Starting NutriLens AI (Full Stack)...
echo.
echo [1/2] Starting Python FastAPI backend on http://localhost:8000
start "NutriLens Backend" cmd /k "cd /d %~dp0nutrilens2 && uvicorn server:app --reload --port 8000"
timeout /t 2 /nobreak >nul
echo [2/2] Starting Vite React frontend on http://localhost:5173
start "NutriLens Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Both servers starting! Open http://localhost:5173 in your browser.
