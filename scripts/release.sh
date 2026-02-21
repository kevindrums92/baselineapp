#!/bin/bash
# Release script for BudgetApp
# Usage: npm run release

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[RELEASE]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validar que estamos en develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    error "Debes estar en la rama 'develop' para hacer un release"
fi

# Validar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    error "Hay cambios sin commitear. Commitea o descarta los cambios antes de continuar."
fi

# Actualizar develop
log "Actualizando rama develop..."
git pull origin develop || error "No se pudo actualizar develop"

# Ejecutar validaciones (lint, tests, build)
echo ""
log "Ejecutando validaciones antes del release..."
echo ""

log "1/5 Ejecutando linter..."
npm run lint || error "El linter encontró errores. Corrígelos antes de continuar."
success "Linter pasó ✓"

log "2/5 Ejecutando tests unitarios..."
npm run test:run || error "Los tests unitarios fallaron. Corrígelos antes de continuar."
success "Tests unitarios pasaron ✓"

log "3/5 Ejecutando tests E2E..."
npm run test:e2e || error "Los tests E2E fallaron. Corrígelos antes de continuar."
success "Tests E2E pasaron ✓"

log "4/5 Verificando que el build funciona..."
npm run build || error "El build falló. Corrígelo antes de continuar."
success "Build exitoso ✓"

log "5/5 Verificando build de iOS para producción..."
npm run ios:prod || error "El build de iOS prod falló. Corrígelo antes de continuar."
success "Build iOS prod exitoso ✓"

echo ""
success "Todas las validaciones pasaron correctamente"
echo ""

# Mostrar versión actual
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Versión actual: $CURRENT_VERSION"

# Preguntar tipo de release
echo ""
echo "¿Qué tipo de release quieres hacer?"
echo "1) patch - Bug fixes (X.X.Z)"
echo "2) minor - New features (X.Y.0)"
echo "3) major - Breaking changes (X.0.0)"
read -p "Selecciona (1/2/3): " release_type

case $release_type in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) error "Opción inválida" ;;
esac

echo ""
log "Iniciando release $VERSION_TYPE..."
echo ""

# 1. Incrementar versión en package.json
log "Incrementando versión..."
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
success "Nueva versión: v$NEW_VERSION"

# 2. Actualizar versiones nativas (iOS)
echo ""
log "Actualizando versiones nativas iOS..."

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"

# Leer CURRENT_PROJECT_VERSION actual y sumar 1
CURRENT_BUILD=$(grep -m1 'CURRENT_PROJECT_VERSION' "$PBXPROJ" | sed 's/[^0-9]//g')
NEW_BUILD=$((CURRENT_BUILD + 1))

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$PBXPROJ"
    sed -i '' "s/MARKETING_VERSION = [0-9]*\.[0-9]*\.[0-9]*;/MARKETING_VERSION = $NEW_VERSION;/g" "$PBXPROJ"
else
    sed -i "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$PBXPROJ"
    sed -i "s/MARKETING_VERSION = [0-9]*\.[0-9]*\.[0-9]*;/MARKETING_VERSION = $NEW_VERSION;/g" "$PBXPROJ"
fi

success "iOS: CURRENT_PROJECT_VERSION $CURRENT_BUILD → $NEW_BUILD, MARKETING_VERSION → $NEW_VERSION"

# 2b. Actualizar versiones nativas (Android)
echo ""
log "Actualizando versiones nativas Android..."

GRADLE_FILE="android/app/build.gradle"

# Leer versionCode actual y sumar 1
CURRENT_VERSION_CODE=$(grep -m1 'versionCode' "$GRADLE_FILE" | sed 's/[^0-9]//g')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" "$GRADLE_FILE"
    sed -i '' "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
else
    sed -i "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" "$GRADLE_FILE"
    sed -i "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" "$GRADLE_FILE"
fi

success "Android: versionCode $CURRENT_VERSION_CODE → $NEW_VERSION_CODE, versionName → $NEW_VERSION"

# 3. Actualizar CHANGELOG
echo ""
log "Actualizando CHANGELOG.md..."

# Obtener fecha actual en formato YYYY-MM-DD
RELEASE_DATE=$(date +%Y-%m-%d)

# Reemplazar [unreleased] con la nueva versión y {relase date} con la fecha actual
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS requiere -i '' para sed
    sed -i '' "s/\[unreleased\]/[$NEW_VERSION]/g" CHANGELOG.md
    sed -i '' "s/{relase date}/$RELEASE_DATE/g" CHANGELOG.md
else
    # Linux/Windows Git Bash
    sed -i "s/\[unreleased\]/[$NEW_VERSION]/g" CHANGELOG.md
    sed -i "s/{relase date}/$RELEASE_DATE/g" CHANGELOG.md
fi

# Crear nueva sección [unreleased] al inicio del changelog (después del header)
# Buscar la línea que contiene "## [$NEW_VERSION]" y agregar la sección unreleased antes
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "/## \[$NEW_VERSION\]/i\\
\\
## [unreleased] - {relase date}\\
" CHANGELOG.md
else
    sed -i "/## \[$NEW_VERSION\]/i\\## [unreleased] - {relase date}\n" CHANGELOG.md
fi

success "CHANGELOG.md actualizado: [$NEW_VERSION] - $RELEASE_DATE"
success "Nueva sección [unreleased] creada para próximos cambios"

# 4. Commit de los cambios de versión
echo ""
log "Creando commit de release..."
git add package.json package-lock.json CHANGELOG.md "$PBXPROJ" "$GRADLE_FILE"
git commit -m "chore: bump version to v$NEW_VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
success "Commit creado"

# 5. Push de develop
log "Pusheando cambios a develop..."
git push origin develop || error "No se pudo pushear develop"
success "Develop actualizado"

# 6. Merge a main
echo ""
log "Mergeando develop -> main..."
git checkout main || error "No se pudo cambiar a main"
git pull origin main || error "No se pudo hacer pull de main"
git merge develop --no-ff -m "chore: release v$NEW_VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" || error "Conflicto al mergear. Resuelve los conflictos y completa el release manualmente."
success "Merge completado"

# 7. Crear tag
echo ""
log "Creando tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
success "Tag creado"

# 8. Push de main y tags
log "Pusheando main y tags..."
git push origin main || error "No se pudo pushear main"
git push origin "v$NEW_VERSION" || error "No se pudo pushear el tag"
success "Main y tags pusheados"

# 9. Volver a develop
echo ""
log "Volviendo a develop..."
git checkout develop
git pull origin develop
success "De vuelta en develop"

log "Volviendo a ejecutar el deploy a prod para que quede con la version actualizada"
npm run ios:prod || error "El build de iOS prod falló."
success "Build # 2 iOS prod exitoso ya estas listo para archive! ✓"

# 10. Generar AAB y APK de Android
echo ""
log "Generando Android App Bundle (AAB) y APK..."

log "Sincronizando Capacitor con Android..."
npx cap sync android || error "No se pudo sincronizar Capacitor con Android"
success "Capacitor sync completado ✓"

log "Generando AAB..."
(cd android && ./gradlew bundleRelease) || error "No se pudo generar el AAB"

AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
if [ -f "$AAB_PATH" ]; then
    AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
    success "AAB generado: $AAB_PATH ($AAB_SIZE)"
else
    error "No se encontró el AAB en $AAB_PATH"
fi

log "Generando APK de release..."
(cd android && ./gradlew assembleRelease) || error "No se pudo generar el APK"

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    success "APK generado: $APK_PATH ($APK_SIZE)"
else
    error "No se encontró el APK en $APK_PATH"
fi

# Resumen final
echo ""
echo "════════════════════════════════════════════════════════════"
success "¡Release v$NEW_VERSION completado exitosamente!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  📦 Versión: v$NEW_VERSION"
echo "  🏷️  Tag: v$NEW_VERSION creado en main"
echo "  🚀 Main actualizado y pusheado"
echo "  💚 De vuelta en develop"
echo "  🤖 Android AAB: $AAB_PATH ($AAB_SIZE)"
echo "  🤖 Android APK: $APK_PATH ($APK_SIZE)"
echo "  🍎 iOS: Build $NEW_BUILD, listo para Archive en Xcode"
echo ""
echo "  Ver release: git show v$NEW_VERSION"
echo "  Ver tag en GitHub: https://github.com/[tu-usuario]/budgetapp/releases/tag/v$NEW_VERSION"
echo ""
