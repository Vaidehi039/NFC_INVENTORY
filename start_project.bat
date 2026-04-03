@echo off
echo ==================================================
echo    NFC Inventory Pro - ENTERPRISE STARTER
echo ==================================================
echo Current Time: %TIME%
echo.

:: 0. Update Network Configuration
echo [0/3] Updating Network Configuration...
powershell -ExecutionPolicy Bypass -File update_config.ps1
echo.

:: 1. Start Backend Server
echo [1/3] Launching FastAPI Backend (Port 8000)...
cd nfc-inventory-server
start "NFC Backend" cmd /k "python main.py"

:: 2. Start Frontend Admin
echo [2/3] Launching Web Admin (Port 5173)...
cd ../nfc-inventory-web
start "NFC Web Admin" cmd /k "npm run dev"

:: 3. Start Mobile Gateway
echo [3/3] Launching Mobile Expo Gateway (Port 8081)...
cd ../nfc-inventory-mobile
start "NFC Mobile Gateway" cmd /k "npx expo start --lan"

echo.
echo --------------------------------------------------
echo SUCCESS: The WHOLE APP system is starting up!
echo.
echo NOTE: Automatic Configuration has matched your IP.
echo.
echo WEB ADMIN:     http://localhost:5173
echo BACKEND API:   http://localhost:8000/docs
echo --------------------------------------------------
echo.
echo TIP: Scan the QR code in the Mobile terminal to run on your phone.
echo --------------------------------------------------
pause
