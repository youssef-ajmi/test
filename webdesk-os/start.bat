@echo off
echo Starting WebDesk OS...
echo.
echo ================================================
echo   WebDesk OS - macOS-style Desktop Environment
echo ================================================
echo.
echo This will start the Flask server on http://127.0.0.1:5000
echo Configure Lively Wallpaper to use this URL as your wallpaper.
echo.
echo Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing/Updating dependencies...
pip install -r requirements.txt -q

echo.
echo Starting WebDesk OS server...
echo.

python app.py

pause
