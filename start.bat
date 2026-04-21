@echo off
echo Starting SixDi Shop Project...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Expo Web Server...
start cmd /k "cd expo-mobile && npx expo start --web"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:8080
echo Frontend: http://localhost:8081 (or next available port)
echo.
pause