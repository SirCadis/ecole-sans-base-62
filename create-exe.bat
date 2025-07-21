@echo off
echo 🚀 Creation de l'executable Ecole Sans Base...
echo.

echo 📦 Build de l'application React...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build React
    pause
    exit /b 1
)
echo ✅ Build React termine
echo.

echo 📋 Instructions pour creer l'executable:
echo.
echo 1. Exportez votre projet vers GitHub (bouton 'Export to Github')
echo 2. Clonez le projet sur votre machine locale
echo 3. Dans le dossier du projet, executez:
echo    npm install
echo    npm run build
echo 4. Pour tester en mode developpement:
echo    electron .
echo 5. Pour creer un executable, utilisez electron-packager:
echo    npm install -g electron-packager
echo    electron-packager . ecole-sans-base --platform=win32 --arch=x64 --out=dist/
echo.
echo ✅ Votre application est prete a etre packagee!
echo.
pause