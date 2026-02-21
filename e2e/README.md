# E2E Tests - BaselineApp

**Estado:** 🟡 In Progress (0 tests implemented)
**Última actualización:** Feb 7, 2026
**Versión de la app:** v0.16.0+

---

## 📋 TL;DR

Este directorio contiene las pruebas end-to-end de BaselineApp usando Playwright.

**Tests actuales:** 0 implementados
**Plan completo:** Ver [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md)

---

## 🚀 Quick Start

### Ejecutar tests (cuando estén implementados)

```bash
# Ejecutar todos los tests
npm run test:e2e

# Ejecutar en modo UI (desarrollo)
npm run test:e2e:ui

# Ejecutar en modo headed (ver browser)
npm run test:e2e:headed

# Ejecutar tests críticos solamente
npm run test:e2e:critical

# Debug mode
npm run test:e2e:debug

# Ver reporte HTML
npm run test:e2e:report
```

---

## 📁 Estructura

```
e2e/
├── README.md                      # Este archivo
├── E2E_TEST_PLAN.md              # Plan detallado de tests
├── test-helpers.ts               # Utilities compartidas (por crear)
│
└── tests/ (por crear)
    ├── 01-onboarding.spec.ts     # Tier 1: Onboarding y primer uso
    ├── 02-transactions.spec.ts   # Tier 1: CRUD de transacciones
    ├── 03-cloud-sync.spec.ts     # Tier 1: Sincronización cloud
    ├── 04-ai-batch-entry.spec.ts # Tier 2: Batch entry con IA
    ├── 05-scheduled.spec.ts      # Tier 2: Transacciones programadas
    ├── 06-categories.spec.ts     # Tier 2: Gestión de categorías
    ├── 07-budget.spec.ts         # Tier 2: Presupuestos
    └── 08-settings.spec.ts       # Tier 2: Configuración
```

---

## 🎯 Prioridades

### 🔴 Tier 1: CRÍTICOS (Must-Have)
**~13 tests** - Deben pasar antes de cualquier release

1. **Onboarding & First Launch** (4 tests)
   - First-time user flow
   - Skip welcome screens
   - Returning user
   - Anonymous session creation

2. **Transaction CRUD** (6 tests)
   - Create expense/income
   - Edit transaction
   - Delete transaction
   - Transaction with notes
   - Persistence after reload

3. **Cloud Sync (Anonymous)** (3 tests)
   - Data syncs to cloud
   - Pull cloud data on fresh device
   - Offline mode handling

### 🟡 Tier 2: IMPORTANTES (High-Value)
**~19 tests** - Features diferenciadoras

4. **AI Batch Entry** (3 tests - mocked)
5. **Scheduled Transactions** (4 tests)
6. **Categories** (4 tests)
7. **Budget/Plan** (5 tests)
8. **Settings** (3 tests)

### 🔵 Tier 3: SECUNDARIAS (Nice-to-Have)
**~18 tests** - Se implementan después

9. Search & Filtering (6 tests)
10. Statistics (4 tests)
11. Trips (3 tests)
12. Backup (2 tests)
13. Navigation (3 tests)

---

## 🛠️ Implementación

### Fase 1: Foundation (Semana 1)
**Target:** 13 tests pasando

- [ ] Setup test-helpers.ts
- [ ] Configurar mocking de Supabase
- [ ] Implementar tests Tier 1 (CRÍTICOS)

**Entregable:** Flujo crítico validado

### Fase 2: Killer Features (Semana 2)
**Target:** 20 tests pasando

- [ ] AI Batch Entry (mocked)
- [ ] Scheduled Transactions

**Entregable:** Features principales cubiertas

### Fase 3: Management (Semana 3)
**Target:** 32 tests pasando

- [ ] Categories
- [ ] Budget/Plan
- [ ] Settings

**Entregable:** Cobertura completa Tier 1 + 2

---

## 📊 Estado Actual de la App

### Autenticación (v0.16.0)
- ✅ **Anonymous auth por defecto** para todos los usuarios
- ✅ **Cloud sync universal** desde día 1
- ✅ **OAuth opcional** (Google, Apple)
- ❌ **NO hay "modo invitado"** tradicional
- ❌ **NO hay ChoosePlan/LoginPro** en onboarding

### Onboarding Actual
- ✅ **6 pantallas** de Welcome Flow
- ✅ **6 pantallas** de FirstConfig Flow
- ✅ **Skip button** salta a completar onboarding
- ✅ **DEVICE_INITIALIZED** se marca al completar FirstConfig

### Features Principales
1. Transacciones (CRUD completo)
2. Transacciones programadas/recurrentes
3. **AI Batch Entry** 🚀 (voz, imagen, texto)
4. Categorías (predefinidas + custom)
5. Presupuestos (límites + metas)
6. Cloud sync (todos los usuarios)
7. Multi-idioma (es, en, fr, pt)
8. Multi-moneda (50+ monedas)
9. Dark mode
10. RevenueCat + Ads

---

## 🧪 Estrategia de Testing

### ¿Qué mockeamos?
✅ Supabase Edge Functions
✅ Supabase Auth API
✅ RevenueCat API
✅ Capacitor Plugins (Camera, Voice, Biometric)

### ¿Qué NO mockeamos?
❌ localStorage (usamos real)
❌ React Router (navegación real)
❌ Zustand Store (estado real)
❌ UI (clicks e inputs reales)

---

## 📝 Escribir Nuevos Tests

### Template Básico

```typescript
import { test, expect } from '@playwright/test';
import { skipOnboarding, createAnonymousSession } from './test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Setup
    await createAnonymousSession(page);
    await skipOnboarding(page);

    // Navigate
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Best Practices

1. **Clear storage** antes de cada test
2. **Use semantic selectors**: `data-testid` > text > class
3. **Wait for network idle** después de navegación
4. **Mock external services** (Supabase, RevenueCat)
5. **Independent tests**: No dependencias entre tests
6. **Descriptive names**: "should X when Y"

---

## 🐛 Debugging

### Ver screenshots de fallos
```bash
open test-results/
```

### Ver videos
```bash
open test-results/**/video.webm
```

### HTML report
```bash
npx playwright show-report
```

### Debug mode
```bash
npm run test:e2e:debug
```

---

## 📚 Referencias

- [E2E Test Plan](./E2E_TEST_PLAN.md) - Plan detallado completo
- [CHANGELOG](../CHANGELOG.md) - Cambios recientes de la app
- [FEATURES](../docs/FEATURES.md) - Features actuales
- [Playwright Docs](https://playwright.dev/docs/intro)

---

## ❓ FAQ

### ¿Por qué eliminamos los tests anteriores?

Los tests fueron escritos antes de cambios arquitectónicos mayores:
- Onboarding rediseñado (v0.16.0)
- Anonymous auth implementado
- AI Batch Entry añadido
- 50+ features nuevas

Era más eficiente empezar de cero con un plan basado en el estado ACTUAL.

### ¿Cuándo implementamos Tier 3?

Tier 3 es opcional. Se implementa si:
- Tier 1 + 2 están estables
- Tenemos tiempo antes del release
- Hay features específicas de Tier 3 que queremos validar

### ¿Cómo contribuyo?

1. Lee [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md)
2. Escoge un escenario no implementado
3. Escribe el test siguiendo el template
4. Asegúrate que pasa en local
5. Crea PR

---

**Última actualización:** Feb 7, 2026
**Contacto:** Ver CLAUDE.md para guías de desarrollo
