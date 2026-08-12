@echo off
REM One-time deploy for NorthCare Firebase demo sync.
cd /d "%~dp0"
call npm --prefix functions run build
if errorlevel 1 exit /b 1
cd /d "%~dp0"
call npx firebase-tools login --reauth
if errorlevel 1 exit /b 1
call npx firebase-tools deploy --only functions,firestore:rules --project northcare-ai
if errorlevel 1 exit /b 1
echo.
echo Deploy complete. Test health:
echo   https://us-central1-northcare-ai.cloudfunctions.net/api/health
pause
