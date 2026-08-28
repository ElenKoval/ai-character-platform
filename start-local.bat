@echo off
cd /d "%~dp0server"

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Is Node.js installed? https://nodejs.org
    pause
    exit /b 1
  )
)

echo.
echo SunnyChimera local server
echo Open in browser: http://localhost:3000
echo World page:       http://localhost:3000/pages/world.html
echo.
echo Keep this window open. Press Ctrl+C to stop.
echo.

start "" "http://localhost:3000"
npm start

pause
