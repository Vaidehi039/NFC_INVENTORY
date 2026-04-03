@echo off
echo Starting NFC Inventory System...

:: Start Backend
start "NFC Inventory Backend" cmd /k "cd nfc-inventory-server && python main.py"

:: Start Frontend
start "NFC Inventory Frontend" cmd /k "cd nfc-inventory-web && npm run dev"

echo Backend and Frontend have been started in new windows.
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:5173
pause
