@echo off
echo.
echo ===========================================
echo   NFC Inventory - Mobile Build Assistant
echo ===========================================
echo.
echo This script will help you build your own APK
echo that supports REAL NFC tags (unlike Expo Go).
echo.
echo PREREQUISITES:
echo 1. You must have an Expo account.
echo 2. You must have eas-cli installed: npm install -g eas-cli
echo.

set /p choice="Do you want to log in to Expo now? (y/n): "
if /i "%choice%"=="y" (
    npx eas login
)

echo.
echo Choose build type:
echo 1. Build Android APK (Release)
echo 2. Build Android Debug (Development Client)
echo 3. Build iOS (Requires Mac/Team account)
echo.

set /p buildtype="Enter choice (1-3): "

if "%buildtype%"=="1" (
    echo Building Android Release APK...
    npx eas build --platform android --profile preview
)

if "%buildtype%"=="2" (
    echo Building Android Development Client...
    npx eas build --platform android --profile development
)

if "%buildtype%"=="3" (
    echo Building iOS...
    npx eas build --platform ios
)

echo.
echo Build process complete/started. 
echo Follow the URL provided by EAS to download your app.
pause
