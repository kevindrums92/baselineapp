# Scripts de Desarrollo

Scripts útiles para automatizar el flujo de trabajo del proyecto.

## 🚀 Scripts de Release

### `npm run release`

Script principal para crear un release desde `develop` hacia `main`.

**Flujo automatizado:**
1. Valida que estés en la rama `develop`
2. Verifica que no haya cambios sin commitear
3. Actualiza `develop` desde origin
4. Te pregunta el tipo de release (patch/minor/major)
5. Incrementa la versión en `package.json`
6. Te pide que actualices el `CHANGELOG.md`
7. Crea un commit con la nueva versión
8. Pushea `develop`
9. Mergea `develop` → `main`
10. Crea un tag con la versión (ej: `v0.3.1`)
11. Pushea `main` y el tag
12. Regresa a `develop`

**Ejemplo de uso:**
```bash
npm run release
# Selecciona: 1 (patch) para 0.3.0 → 0.3.1
# Actualiza CHANGELOG.md
# Presiona Enter
# ✅ Release completado
```

---

## 🔧 Scripts de Desarrollo

### `configure-env.js` - Configuración de Ambientes

**Propósito:** Configura automáticamente el Bundle ID y Display Name según el ambiente antes de generar builds nativos.

**Uso manual:**
```bash
node scripts/configure-env.js development
node scripts/configure-env.js production
```

**Uso integrado (recomendado):**
```bash
npm run ios:dev      # Ejecuta configure:dev automáticamente
npm run ios:prod     # Ejecuta configure:prod automáticamente
```

**Modificaciones que realiza:**

| Archivo | Cambios |
|---------|---------|
| `capacitor.config.ts` | `appId` y `appName` |
| `ios/App/App/Info.plist` | `CFBundleDisplayName` y `CFBundleURLName` |
| `ios/App/App.xcodeproj/project.pbxproj` | `PRODUCT_BUNDLE_IDENTIFIER` |

**Configuraciones por ambiente:**

| Ambiente | Bundle ID | Display Name |
|----------|-----------|--------------|
| development | `com.jhotech.smartspend.dev` | SmartSpend Dev |
| production | `com.jhotech.smartspend` | SmartSpend |

**Beneficio:**

Permite tener ambas versiones instaladas simultáneamente:
- 📱 "SmartSpend Dev" (desarrollo local)
- 🚀 "SmartSpend" (TestFlight/App Store)

⚠️ **Importante:** Antes de commitear cambios en archivos nativos, ejecuta `npm run configure:prod` para restaurar el estado de producción.

---

### `npm run dev:sync`

Sincroniza tu rama `develop` local con origin.

```bash
npm run dev:sync
# Equivale a: git pull origin develop
```

### `npm run dev:save`

Guarda y pushea cambios rápidamente en `develop`.

```bash
npm run dev:save
# Equivale a: git add . && git commit && git push origin develop
```

> **Nota:** Te pedirá un mensaje de commit.

### `npm run dev:update-from-main`

Actualiza `develop` con los cambios que haya en `main` (útil después de hotfixes).

```bash
npm run dev:update-from-main
# Equivale a: git checkout develop && git merge main && git push origin develop
```

### `npm run diff:main`

Muestra las diferencias entre `develop` y `main`.

```bash
npm run diff:main
# Equivale a: git diff main..develop
```

Útil para ver qué cambios se incluirán en el próximo release.

### `npm run pre-release`

Verifica que todo esté listo antes de hacer un release.

```bash
npm run pre-release
# Equivale a: git checkout develop && git pull && npm run build && npm run lint
```

Ejecuta:
- Cambia a `develop`
- Actualiza desde origin
- Construye el proyecto
- Ejecuta el linter

Si todo pasa sin errores, estás listo para hacer `npm run release`.

---

## 📋 Workflow Recomendado

### Desarrollo diario en `develop`

```bash
# 1. Sincronizar develop
npm run dev:sync

# 2. Desarrollar features...
# 3. Hacer commits normales
git add .
git commit -m "feat: nueva funcionalidad"
git push

# O usar el atajo:
npm run dev:save
```

### Antes de hacer un release

```bash
# 1. Verificar todo antes del release
npm run pre-release

# 2. Ver qué cambios se incluirán
npm run diff:main

# 3. Si todo está bien, hacer el release
npm run release
```

### Después de un hotfix en main

Si hiciste un cambio directo en `main` (hotfix de emergencia):

```bash
# Traer los cambios de vuelta a develop
npm run dev:update-from-main
```

---

## 🏷️ Versionado Semántico

- **patch** (0.3.0 → 0.3.1): Bug fixes, cambios menores
- **minor** (0.3.0 → 0.4.0): Nuevas features, sin breaking changes
- **major** (0.3.0 → 1.0.0): Breaking changes, cambios importantes en la API

---

## ⚠️ Requisitos

- Git configurado con permisos de push a `main` y `develop`
- Node.js instalado (para leer `package.json`)
- Bash shell (en Windows usar Git Bash o WSL)

---

## 🐛 Troubleshooting

### El script no se ejecuta en Windows

Usa Git Bash o WSL para ejecutar scripts bash:

```bash
# Desde Git Bash
npm run release
```

### Error: "Hay cambios sin commitear"

Commitea o descarta los cambios antes de hacer release:

```bash
git status
git add .
git commit -m "tu mensaje"
# Ahora sí: npm run release
```

### Error al mergear a main

Si hay conflictos:

```bash
# El script se detendrá
# Resuelve los conflictos manualmente
git status
# Edita archivos con conflictos
git add .
git commit
git push origin main
git tag -a "vX.X.X" -m "Release vX.X.X"
git push origin vX.X.X
git checkout develop
```
