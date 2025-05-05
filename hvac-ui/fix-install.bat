@echo off
echo ===================================================
echo HVAC UI Installation Fix Script
echo ===================================================
echo.
echo This script will fix npm installation issues by:
echo  1. Cleaning npm cache
echo  2. Removing package-lock.json
echo  3. Reinstalling dependencies
echo.
echo Press any key to continue...
pause > nul

echo.
echo Step 1: Cleaning npm cache...
call npm cache clean --force
echo Done.

echo.
echo Step 2: Removing package-lock.json if it exists...
if exist package-lock.json del /f package-lock.json
echo Done.

echo.
echo Step 3: Installing dependencies...
call npm install --no-fund --no-audit
echo Done.

echo.
echo ===================================================
echo Installation completed!
echo ===================================================
echo.
echo If you still encounter issues, try:
echo  1. Exiting the Python virtual environment
echo  2. Running this script again
echo.
pause