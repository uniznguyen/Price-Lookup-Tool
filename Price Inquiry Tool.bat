@echo off
REM Price Inquiry Application Starter
REM This script starts both the backend and frontend

echo.
echo ========================================
echo  Price Inquiry App Starter
echo ========================================
echo.

REM Start Backend in a new window
echo Starting Backend (Flask)...
start cmd /k "cd /d c:\Development\Price Inquiry\backend && .venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend in a new window
echo Starting Frontend (React)...
start cmd /k "cd /d c:\Development\Price Inquiry\frontend && npm run dev"

echo.
echo ========================================
echo  Both services started!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Opening frontend in browser...
timeout /t 5 /nobreak

REM Open the frontend in default browser
start http://localhost:3000

echo.
echo Press any key to close this window...
pause
