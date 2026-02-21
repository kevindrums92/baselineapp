# E2E Implementation Roadmap

**Objetivo:** Implementar suite de pruebas e2e relevante para BaselineApp v0.16+

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests obsoletos eliminados | 119 tests |
| Tests planificados (Tier 1) | 13 tests 🔴 CRÍTICOS |
| Tests planificados (Tier 2) | 19 tests 🟡 IMPORTANTES |
| Tests planificados (Tier 3) | 18 tests 🔵 SECUNDARIOS |
| **Total planificado** | **50 tests** |
| Tiempo estimado Tier 1 | ~2 semanas |
| Tiempo estimado Tier 1+2 | ~4 semanas |

---

## 🎯 Objetivos por Fase

### ✅ Fase 0: Limpieza (COMPLETADO)
- [x] Eliminar 11 archivos de tests obsoletos
- [x] Crear plan detallado basado en app actual
- [x] Documentar escenarios prioritarios

### 🚀 Fase 1: Foundation (Próximos pasos)
**Duración estimada:** 1-2 semanas
**Tests:** 13 críticos

**Checklist:**
- [ ] Crear `test-helpers.ts` con utilities básicas
- [ ] Implementar helper `skipOnboarding()`
- [ ] Implementar helper `createAnonymousSession()`
- [ ] Configurar mocking de Supabase Edge Functions
- [ ] Configurar mocking de Supabase Auth

**Tests a implementar:**
```
01-onboarding.spec.ts (4 tests)
├── should complete first-time user flow
├── should allow skipping welcome screens
├── should handle returning user
└── should create anonymous session

02-transactions.spec.ts (6 tests)
├── should create expense transaction
├── should create income transaction
├── should edit transaction
├── should delete transaction
├── should save transaction with notes
└── should persist transaction after reload

03-cloud-sync.spec.ts (3 tests)
├── should sync data to cloud (anonymous)
├── should pull cloud data on fresh device
└── should handle offline mode
```

**Criterios de éxito:**
- ✅ 13 tests pasando en local
- ✅ 13 tests pasando en CI
- ✅ Tiempo de ejecución < 3 minutos
- ✅ Screenshots en fallos
- ✅ Video recording habilitado

---

### 🎨 Fase 2: Killer Features
**Duración estimada:** 1 semana
**Tests:** 7 importantes

**Tests a implementar:**
```
04-ai-batch-entry.spec.ts (3 tests - MOCKED)
├── should process text batch entry
├── should show rate limit modal for free users
└── should allow editing and saving batch

05-scheduled.spec.ts (4 tests)
├── should create monthly recurring transaction
├── should confirm scheduled transaction
├── should edit recurring template
└── should deactivate schedule
```

**Criterios de éxito:**
- ✅ 20 tests pasando (Tier 1 + parte de Tier 2)
- ✅ AI Batch Entry (mocked) funcionando
- ✅ Scheduled transactions validados
- ✅ Tiempo de ejecución < 5 minutos

---

### 🔧 Fase 3: Management Features
**Duración estimada:** 1-2 semanas
**Tests:** 12 importantes

**Tests a implementar:**
```
06-categories.spec.ts (4 tests)
├── should show default categories
├── should create custom category
├── should edit category
└── should search icons

07-budget.spec.ts (5 tests)
├── should show budget onboarding
├── should create spending limit
├── should track budget progress
├── should show exceeded state
└── should show completed budgets

08-settings.spec.ts (3 tests)
├── should change language
├── should change theme
└── should change currency
```

**Criterios de éxito:**
- ✅ 32 tests pasando (Tier 1 + 2 completo)
- ✅ Cobertura de features diferenciadoras
- ✅ Tiempo de ejecución < 8 minutos
- ✅ Integrado en `npm run pre-release`

---

### 🌟 Fase 4: Polish (OPCIONAL)
**Duración estimada:** 1-2 semanas
**Tests:** 18 secundarios

**Tests a implementar:**
```
09-search-filtering.spec.ts (6 tests)
10-statistics.spec.ts (4 tests)
11-trips.spec.ts (3 tests)
12-backup.spec.ts (2 tests)
13-navigation.spec.ts (3 tests)
```

**Criterios de éxito:**
- ✅ 50 tests pasando (suite completa)
- ✅ Cobertura de features secundarias
- ✅ Tiempo de ejecución < 12 minutos

---

## 🛠️ Setup Técnico Requerido

### 1. Test Helpers (`test-helpers.ts`)

```typescript
// Helpers que necesitamos crear

export async function skipOnboarding(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('budget.onboarding.completed.v2', 'true');
    localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());
    localStorage.setItem('budget.config.deviceInitialized', 'true');
  });
}

export async function createAnonymousSession(page: Page) {
  const mockSession = {
    access_token: 'mock-token',
    user: {
      id: 'anon-user-123',
      is_anonymous: true,
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };

  await page.evaluate((session) => {
    localStorage.setItem(
      'sb-your-project-ref-auth-token',
      JSON.stringify({ currentSession: session })
    );
  }, mockSession);
}

export async function mockBatchEntryEdgeFunction(
  page: Page,
  response: { transactions: TransactionDraft[] }
) {
  await page.route('**/functions/v1/parse-batch', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function waitForCloudSync(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const state = localStorage.getItem('budget_state');
      if (!state) return false;
      const parsed = JSON.parse(state);
      return parsed.cloudStatus === 'ok' || parsed.cloudStatus === undefined;
    },
    { timeout }
  );
}

export async function getCurrentBalance(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_state');
    if (!state) return 0;
    const parsed = JSON.parse(state);
    const income =
      parsed.transactions
        ?.filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    const expense =
      parsed.transactions
        ?.filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    return income - expense;
  });
}

export async function getTransactionsCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_state');
    if (!state) return 0;
    const parsed = JSON.parse(state);
    return parsed.transactions?.length || 0;
  });
}
```

### 2. Mocking de Supabase

```typescript
// En cada test file, antes de los tests

test.beforeEach(async ({ page }) => {
  // Mock Supabase Auth API
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/signInAnonymously')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'anon-user-123', is_anonymous: true },
          session: { access_token: 'mock-token' },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock Supabase REST API (user_state table)
  await page.route('**/rest/v1/user_state**', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      // Pull cloud data
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (method === 'POST' || method === 'PATCH') {
      // Push cloud data
      await route.fulfill({ status: 200 });
    } else {
      await route.continue();
    }
  });
});
```

### 3. Configuración de CI (GitHub Actions)

```yaml
# .github/workflows/e2e-tests.yml

name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  e2e-critical:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run critical E2E tests
        run: npm run test:e2e:critical

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📋 Checklist de Implementación

### Setup Inicial
- [ ] Revisar y aprobar plan con el equipo
- [ ] Priorizar escenarios según impacto/esfuerzo
- [ ] Crear branch `feature/e2e-tests`
- [ ] Setup test-helpers.ts con utilities básicas
- [ ] Configurar mocking de Supabase
- [ ] Configurar GitHub Actions para CI

### Fase 1: Foundation
- [ ] Implementar `01-onboarding.spec.ts` (4 tests)
- [ ] Implementar `02-transactions.spec.ts` (6 tests)
- [ ] Implementar `03-cloud-sync.spec.ts` (3 tests)
- [ ] Verificar que todos pasan en local
- [ ] Verificar que todos pasan en CI
- [ ] Documentar cualquier issue encontrado

### Fase 2: Killer Features
- [ ] Implementar `04-ai-batch-entry.spec.ts` (3 tests)
- [ ] Implementar `05-scheduled.spec.ts` (4 tests)
- [ ] Verificar integration con Tier 1
- [ ] Performance check (< 5 min total)

### Fase 3: Management
- [ ] Implementar `06-categories.spec.ts` (4 tests)
- [ ] Implementar `07-budget.spec.ts` (5 tests)
- [ ] Implementar `08-settings.spec.ts` (3 tests)
- [ ] Integrar en `npm run pre-release`
- [ ] Performance check (< 8 min total)

### Fase 4: Polish (Opcional)
- [ ] Implementar tests secundarios (18 tests)
- [ ] Performance tuning
- [ ] Documentación final

---

## 🎬 Comandos Útiles

### Durante Desarrollo

```bash
# Ejecutar un solo archivo
npx playwright test e2e/01-onboarding.spec.ts

# Ejecutar en modo UI (interactivo)
npm run test:e2e:ui

# Ejecutar con browser visible
npm run test:e2e:headed

# Debug un test específico
npx playwright test e2e/02-transactions.spec.ts --debug

# Ver trace de un test fallido
npx playwright show-trace test-results/.../trace.zip
```

### Troubleshooting

```bash
# Actualizar screenshots esperados
npx playwright test --update-snapshots

# Limpiar cache de Playwright
npx playwright clean

# Reinstalar browsers
npx playwright install --with-deps

# Ver qué tests hay
npx playwright test --list
```

---

## 📈 Métricas de Éxito

### Por Fase

| Fase | Tests | Tiempo Ejecución | Cobertura |
|------|-------|------------------|-----------|
| Fase 1 | 13 | < 3 min | Flujos críticos |
| Fase 2 | 20 | < 5 min | + Killer features |
| Fase 3 | 32 | < 8 min | + Management |
| Fase 4 | 50 | < 12 min | Suite completa |

### Criterios de Calidad

- ✅ 100% de tests pasando en CI
- ✅ 0 flaky tests (tests intermitentes)
- ✅ Screenshots automáticos en fallos
- ✅ Videos de tests fallidos
- ✅ Traces habilitados para debugging
- ✅ Código de tests bien documentado
- ✅ Test helpers reutilizables

---

## 🔗 Links Útiles

- [Plan Detallado](./E2E_TEST_PLAN.md) - Todos los escenarios planificados
- [README](./README.md) - Guía rápida y comandos
- [Playwright Docs](https://playwright.dev/docs/intro)
- [CLAUDE.md](../CLAUDE.md) - Guías de desarrollo
- [FEATURES.md](../docs/FEATURES.md) - Features actuales de la app

---

## 💡 Tips para Implementadores

1. **Empezar con lo simple**: Implementa primero los tests más básicos de Tier 1
2. **Iterar rápido**: No busques perfección, busca tests que pasen
3. **Mock agresivamente**: No dependas de servicios externos
4. **Usa data-testid**: Agrega atributos a componentes críticos
5. **Tests independientes**: Cada test debe poder correr solo
6. **Documentar bugs**: Si encuentras bugs de la app, créalos en issues
7. **Pedir ayuda**: Si algo no funciona después de 30 min, pregunta

---

## 🎉 Beneficios Esperados

### Corto Plazo (Fase 1)
- ✅ Confianza para hacer refactors
- ✅ Detección temprana de regresiones
- ✅ Documentación viva de flujos críticos

### Mediano Plazo (Fase 1-3)
- ✅ Faster releases (menos QA manual)
- ✅ Menos bugs en producción
- ✅ Onboarding más rápido de nuevos devs

### Largo Plazo (Suite completa)
- ✅ CI/CD robusto
- ✅ Refactors seguros y rápidos
- ✅ Mejor experiencia de usuario

---

**¿Preguntas?** Ver [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) para más detalles.
