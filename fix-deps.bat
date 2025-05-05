@echo off
echo ===================================================
echo MarkoTronix HVAC CRM Dependency Fix Script
echo ===================================================
echo.
echo This script will fix dependency issues in the project.
echo It will:
echo  1. Clean node_modules directories
echo  2. Clear npm cache
echo  3. Reinstall dependencies
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Step 1: Cleaning node_modules directories...
rmdir /s /q node_modules 2>nul
rmdir /s /q hvac-ui\node_modules 2>nul
echo Done.

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force
echo Done.

echo.
echo Step 3: Installing dependencies...
call npm install
echo Done.

echo.
echo ===================================================
echo Dependency fix completed!
echo ===================================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
pause