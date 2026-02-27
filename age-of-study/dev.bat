@echo off
REM Age of Study - Dev Server Launcher
REM Always runs from the correct directory

cd /d "%~dp0"
echo Starting dev server from: %CD%
echo.

REM Kill any existing Node processes
REM Kill process on port 3000 if running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
REM Brief pause if .next exists to allow file handles to release
if exist .next (
    echo Checking cache...
    timeout /t 1 >nul
)
REM Start dev server
npm run dev
