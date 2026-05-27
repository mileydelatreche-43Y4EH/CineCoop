@echo off
cd /d "%~dp0"
echo.
echo  CineCoop local site
echo  Open in browser: http://localhost:8080
echo.
echo  Keep this window OPEN. Press Ctrl+C to stop.
echo.
python -m http.server 8080
pause
