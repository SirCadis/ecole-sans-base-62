#!/bin/bash

echo "🚀 Création de l'exécutable École Sans Base..."
echo ""

# Étape 1: Build de l'application React
echo "📦 Build de l'application React..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build React"
    exit 1
fi

echo "✅ Build React terminé"
echo ""

# Étape 2: Vérification d'Electron
echo "🔧 Vérification d'Electron..."
if ! command -v electron &> /dev/null; then
    echo "Installation d'Electron globalement..."
    npm install -g electron
fi

echo "✅ Electron prêt"
echo ""

# Étape 3: Instructions pour l'utilisateur
echo "📋 Instructions pour créer l'exécutable:"
echo ""
echo "1. Exportez votre projet vers GitHub (bouton 'Export to Github')"
echo "2. Clonez le projet sur votre machine locale"
echo "3. Dans le dossier du projet, exécutez:"
echo "   npm install"
echo "   npm run build"
echo "4. Pour tester en mode développement:"
echo "   electron ."
echo "5. Pour créer un exécutable, utilisez un outil comme:"
echo "   - electron-packager (plus simple)"
echo "   - electron-builder (plus avancé)"
echo ""
echo "Exemple avec electron-packager:"
echo "npm install -g electron-packager"
echo "electron-packager . ecole-sans-base --platform=win32 --arch=x64 --out=dist/"
echo ""
echo "✅ Votre application est prête à être packagée!"