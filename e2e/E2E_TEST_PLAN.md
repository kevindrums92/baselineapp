# E2E Test Plan - BaselineApp v0.16+

**Última actualización:** Feb 7, 2026
**Estado de la app:** Estable (v0.16.0)
**Tests implementados:** 0 / TBD

---

## 🎯 Objetivo

Diseñar un conjunto de pruebas e2e **relevantes al estado ACTUAL** de BaselineApp, enfocadas en los flujos críticos que afectan la experiencia del usuario y la integridad de datos.

---

## 🔍 Estado Actual de la App (según docs y CHANGELOG)

### Arquitectura de Autenticación
- ✅ **Anonymous Auth por defecto**: Todos los usuarios obtienen sesión anónima automática con cloud sync
- ✅ **Cloud sync universal**: `cloudMode = "cloud"` para todos (anónimos y autenticados)
- ✅ **Guest mode es fallback raro**: Solo si `signInAnonymously()` falla (Supabase caído)
- ✅ **OAuth opcional**: Google y Apple Sign In disponibles pero no obligatorios
- ✅ **Transición anónimo → OAuth**: Con cleanup de usuarios huérfanos
- ✅ **RLS compatible**: Políticas funcionan con `auth.uid()` de sesiones anónimas

### Onboarding Actual (v0.16.0)
- ✅ **Welcome Flow**: 6 pantallas de introducción (reducido de 7)
- ✅ **NO hay ChoosePlan**: Removido para reducir fricción
- ✅ **NO hay LoginPro en onboarding inicial**: Removido
- ✅ **LoginScreen**: Solo `signInAnonymously()` automático
- ✅ **FirstConfig Flow**: 6 pantallas de configuración (idioma, tema, moneda, categorías, push, confirmación)
- ✅ **Skip button**: Salta directamente a Screen5_Complete
- ✅ **DEVICE_INITIALIZED**: Se marca al completar FirstConfig, no en LoginScreen

### Features Principales

#### 🔥 Críticas (Core Experience)
1. **Transacciones**
   - CRUD completo (crear, editar, eliminar)
   - Estados: Pagado, Pendiente, Planeado
   - Notas opcionales
   - DatePicker personalizado
   - Guardado de borrador

2. **Transacciones Programadas** (Scheduled)
   - Recurrencia: diaria, semanal, mensual, trimestral, anual, custom
   - Transacciones virtuales (visualización de futuras)
   - Auto-confirmación de transacciones pasadas
   - Banner de transacciones programadas
   - Modal de confirmación individual
   - Panel de gestión (Activas/Inactivas)

3. **AI Batch Entry** 🚀 KILLER FEATURE
   - Entrada por texto (lenguaje natural)
   - Entrada por voz (transcripción con Whisper)
   - Entrada por imagen (OCR de recibos)
   - TransactionPreview con edición inline
   - Rate limiting: 5/día free, 50/día pro
   - Integrado desde AddActionSheet → "Agregar varias"

4. **Cloud Sync**
   - Sincronización automática para TODOS (anónimos + autenticados)
   - Offline queue con pending sync
   - Pull/push de cloud data
   - Cleanup de usuarios huérfanos en OAuth transition

#### 📊 Importantes (Value-Added Features)
5. **Categorías**
   - 21 categorías predefinidas (13 gastos + 8 ingresos)
   - Creación de categorías personalizadas
   - Icon picker con 140+ iconos
   - Color picker
   - Traducción automática según idioma

6. **Presupuestos (Plan)**
   - Límites de Gasto (Spending Limits)
   - Metas de Ahorro (Savings Goals)
   - Períodos flexibles (semanal, mensual, trimestral, anual, custom)
   - Presupuestos recurrentes con auto-renovación
   - Tracking en tiempo real (verde/amarillo/rojo)
   - Budget Onboarding wizard (4 pantallas)
   - Tabs: Activos / Completados

7. **Estadísticas**
   - Quick View cards (4 cards interactivos)
   - Gráficas de gastos/ingresos
   - Comparación mes a mes
   - Análisis por categoría
   - Promedio diario

8. **Settings & Preferences**
   - Multi-idioma: es, en, fr, pt (detección automática)
   - Multi-moneda: 50+ monedas (auto-detección)
   - Temas: light, dark, system
   - Biometric auth (Face ID / Touch ID)
   - Push notifications opt-in

#### 🎒 Secundarias (Nice-to-Have)
9. **Trips**
   - Crear/editar/eliminar viajes
   - Añadir gastos a viajes
   - Budget tracking por viaje
   - Estados: planning, active, completed

10. **Backup & Restore**
    - Export a JSON
    - Import desde archivo
    - Auto-backup local (cada 7 días)
    - Backup en la nube

11. **Search & Filtering**
    - Búsqueda por nombre/notas
    - Filtros: tipo, categoría, estado, recurrente
    - Balance de transacciones filtradas

#### 💰 Monetización
12. **RevenueCat Subscriptions**
    - Free tier con ads
    - Pro tier (monthly/annual/lifetime)
    - PaywallModal con pricing cards
    - Trial de 7 días

13. **AdMob Ads (Free users)**
    - Interstitial ads (frecuencia controlada)
    - Máx 1 ad cada 3 minutos
    - Máx 5 ads por sesión

---

## 🎯 Escenarios E2E Propuestos

### 🟢 Tier 1: CRÍTICOS (Must-Have Before Launch)

Estos tests DEBEN pasar antes de cualquier release a producción.

#### 1. Onboarding & First Launch (NEW)
**Prioridad:** 🔴 CRÍTICA

**Escenarios:**
- [ ] **1.1 First-time user flow**
  - Abrir app en dispositivo nuevo
  - Ver Welcome Flow (6 pantallas)
  - Completar FirstConfig (idioma, tema, moneda, categorías)
  - Verificar que se crea sesión anónima automática
  - Verificar que se inicializan categorías por defecto
  - Verificar redirección a HomePage

- [ ] **1.2 Skip welcome screens**
  - Click en "Omitir" durante Welcome Flow
  - Verificar que salta a Screen5_Complete
  - Verificar que se completa FirstConfig
  - Verificar redirección a HomePage

- [ ] **1.3 Returning user (already onboarded)**
  - Recargar app con onboarding completado
  - Verificar que NO se muestra Welcome ni FirstConfig
  - Verificar que va directo a HomePage
  - Verificar que datos persisten

- [ ] **1.4 Anonymous session creation**
  - Verificar que localStorage contiene sesión de Supabase
  - Verificar que `cloudMode = "cloud"`
  - Verificar que `user_id` existe en localStorage
  - Verificar que `is_anonymous = true`

#### 2. Transaction CRUD
**Prioridad:** 🔴 CRÍTICA

**Escenarios:**
- [ ] **2.1 Create expense transaction**
  - Click en FAB
  - Seleccionar "Agregar uno" en AddActionSheet
  - Llenar formulario (nombre, monto, categoría)
  - Guardar
  - Verificar aparece en HomePage
  - Verificar balance actualizado

- [ ] **2.2 Create income transaction**
  - Click FAB → Agregar uno
  - Cambiar a tab "Ingresos"
  - Llenar formulario
  - Verificar aparece en HomePage con color verde

- [ ] **2.3 Edit transaction**
  - Click en transacción existente
  - Modificar nombre y monto
  - Guardar
  - Verificar cambios reflejados

- [ ] **2.4 Delete transaction**
  - Abrir transacción
  - Click en icono basura
  - Confirmar eliminación
  - Verificar desaparece de la lista
  - Verificar balance actualizado

- [ ] **2.5 Transaction with notes**
  - Crear transacción con notas
  - Verificar que notas se guardan y muestran

- [ ] **2.6 Transaction persistence after reload**
  - Crear transacción
  - Recargar página
  - Verificar que transacción persiste

#### 3. Cloud Sync (Anonymous Mode)
**Prioridad:** 🔴 CRÍTICA

**Escenarios:**
- [ ] **3.1 Data syncs to cloud (anonymous user)**
  - Crear transacción como usuario anónimo
  - Esperar debounce (1.2s)
  - Verificar que `cloudStatus = 'syncing'` → `'ok'`
  - Verificar que dato existe en Supabase `user_state`

- [ ] **3.2 Pull cloud data on fresh device**
  - Simular segundo dispositivo (clear localStorage, misma sesión)
  - Recargar app
  - Verificar que pull de cloud data funciona
  - Verificar que transacciones aparecen

- [ ] **3.3 Offline mode handling**
  - Crear transacción
  - Simular offline (Network.setOffline)
  - Verificar que `cloudStatus = 'offline'`
  - Verificar que transacción se guarda en pending sync
  - Simular online
  - Verificar que pending sync se procesa

#### 4. AI Batch Entry 🚀
**Prioridad:** 🟡 ALTA (es killer feature pero puede ser costoso testear)

**Escenarios:**
- [ ] **4.1 Text batch entry (mocked)**
  - Click FAB → "Agregar varias"
  - Seleccionar modo texto
  - Ingresar texto: "Gasté 50 mil en almuerzo y 20 mil en taxi"
  - Mock la respuesta de Edge Function con 2 transacciones
  - Verificar que TransactionPreview muestra 2 drafts
  - Editar inline un monto
  - Guardar todas
  - Verificar que 2 transacciones aparecen en HomePage

- [ ] **4.2 Rate limit modal (free user)**
  - Mock usuario free con 5 requests usados
  - Intentar batch entry
  - Verificar que aparece modal "Sin Límites"
  - Verificar que muestra PaywallModal al click

- [ ] **4.3 Batch entry success flow**
  - Mock respuesta con 3 transacciones válidas
  - Verificar totales de income/expense en preview
  - Eliminar 1 draft
  - Guardar las 2 restantes
  - Verificar que solo 2 se guardan

**Nota:** Tests de voz e imagen se saltarán (requieren permisos nativos y son costosos)

---

### 🟡 Tier 2: IMPORTANTES (High-Value Features)

Estos tests agregan mucho valor pero no son blocking para release inicial.

#### 5. Scheduled Transactions
**Prioridad:** 🟡 ALTA

**Escenarios:**
- [ ] **5.1 Create monthly recurring transaction**
  - Crear transacción con toggle "Recurrente" activado
  - Seleccionar frecuencia "Mensual"
  - Verificar que aparece badge "Recurrente" en lista
  - Verificar que se generan transacciones virtuales en meses futuros

- [ ] **5.2 Confirm scheduled transaction**
  - Crear transacción programada para ayer
  - Recargar app
  - Verificar que aparece banner "Tienes X transacciones programadas"
  - Abrir modal de confirmación
  - Confirmar transacción
  - Verificar que se convierte en transacción real

- [ ] **5.3 Edit recurring template**
  - Editar transacción recurrente
  - Modificar monto
  - Seleccionar "Este y los siguientes"
  - Verificar que futuras transacciones usan nuevo monto

- [ ] **5.4 Deactivate schedule**
  - Ir a Perfil → Programadas
  - Desactivar una programación
  - Verificar que pasa a tab "Inactivas"
  - Verificar que no genera más transacciones virtuales

#### 6. Categories Management
**Prioridad:** 🟡 ALTA

**Escenarios:**
- [ ] **6.1 View default categories**
  - Ir a /categories
  - Verificar que hay 13 categorías de gasto
  - Cambiar a tab "Ingresos"
  - Verificar que hay 8 categorías de ingreso

- [ ] **6.2 Create custom category**
  - Click en "+"
  - Llenar nombre
  - Abrir icon picker
  - Buscar "carro"
  - Seleccionar icono
  - Seleccionar color
  - Guardar
  - Verificar que aparece en lista

- [ ] **6.3 Edit category**
  - Click en categoría existente
  - Cambiar nombre y color
  - Guardar
  - Verificar cambios

- [ ] **6.4 Icon picker search**
  - Abrir icon picker
  - Buscar "dog"
  - Verificar que muestra iconos de mascotas
  - Buscar término sin resultados
  - Verificar empty state

#### 7. Budget (Plan) Management
**Prioridad:** 🟡 ALTA

**Escenarios:**
- [ ] **7.1 Budget onboarding wizard**
  - Primera visita a /budget
  - Verificar que muestra wizard de 4 pantallas
  - Navegar con "Siguiente"
  - Completar wizard
  - Verificar que no se muestra en siguientes visitas

- [ ] **7.2 Create spending limit**
  - Click "Agregar Plan"
  - Seleccionar tipo "Límite de Gasto"
  - Elegir categoría "Mercado"
  - Establecer límite $500.000
  - Seleccionar período "Mensual"
  - Guardar
  - Verificar que aparece en tab "Activos"

- [ ] **7.3 Track budget progress**
  - Crear límite de $100.000 para categoría X
  - Crear transacción de $30.000 en categoría X
  - Ir a /budget
  - Verificar barra de progreso muestra 30%
  - Verificar color verde (< 75%)

- [ ] **7.4 Budget exceeded state**
  - Crear límite de $50.000
  - Crear transacción de $60.000
  - Verificar barra de progreso > 100%
  - Verificar color rojo
  - Verificar health check banner

- [ ] **7.5 Completed budgets**
  - Crear budget con período pasado
  - Ir a tab "Completados"
  - Verificar que muestra resumen de resultados
  - Verificar que edición está bloqueada

#### 8. Settings & Preferences
**Prioridad:** 🟡 ALTA

**Escenarios:**
- [ ] **8.1 Change language**
  - Ir a ProfilePage
  - Click en "Idioma"
  - Seleccionar "English"
  - Confirmar cambio
  - Verificar que UI cambia a inglés
  - Recargar página
  - Verificar que persiste

- [ ] **8.2 Change theme**
  - Click en "Tema"
  - Seleccionar "Dark"
  - Verificar que se aplica dark mode
  - Recargar
  - Verificar persistencia

- [ ] **8.3 Change currency**
  - Click en "Moneda"
  - Buscar "USD"
  - Seleccionar "United States Dollar"
  - Verificar que montos se muestran con $ y formato USD
  - Recargar
  - Verificar persistencia

---

### 🔵 Tier 3: SECUNDARIAS (Nice-to-Have)

Estos tests son útiles pero no críticos. Se pueden implementar después.

#### 9. Search & Filtering
**Prioridad:** 🔵 MEDIA

**Escenarios:**
- [ ] **9.1 Search transactions by name**
- [ ] **9.2 Filter by type (income/expense)**
- [ ] **9.3 Filter by category**
- [ ] **9.4 Filter by recurring status**
- [ ] **9.5 Combined filters**
- [ ] **9.6 Filtered balance calculation**

#### 10. Statistics
**Prioridad:** 🔵 MEDIA

**Escenarios:**
- [ ] **10.1 View stats page**
- [ ] **10.2 Expense breakdown by category**
- [ ] **10.3 Month comparison**
- [ ] **10.4 Daily average calculation**

#### 11. Trips
**Prioridad:** 🔵 BAJA

**Escenarios:**
- [ ] **11.1 Create trip**
- [ ] **11.2 Add expense to trip**
- [ ] **11.3 Trip budget tracking**

#### 12. Backup & Restore
**Prioridad:** 🔵 MEDIA

**Escenarios:**
- [ ] **12.1 Export data to JSON**
- [ ] **12.2 Import data from file**

#### 13. Navigation & Integration
**Prioridad:** 🔵 BAJA

**Escenarios:**
- [ ] **13.1 Bottom bar navigation**
- [ ] **13.2 FAB visibility**
- [ ] **13.3 Browser back button**

---

## 📈 Plan de Implementación Sugerido

### Fase 1: Foundation (Semana 1)
**Objetivo:** Setup y tests críticos de base

1. **Setup inicial**
   - [ ] Configurar Playwright (ya está)
   - [ ] Crear test-helpers.ts con utilities básicas
   - [ ] Configurar mocking de Supabase Edge Functions

2. **Tests Tier 1 (CRÍTICOS)**
   - [ ] Onboarding & First Launch (4 tests)
   - [ ] Transaction CRUD (6 tests)
   - [ ] Cloud Sync Anonymous (3 tests)

**Entregable:** ~13 tests pasando, flujo crítico validado

---

### Fase 2: Killer Features (Semana 2)
**Objetivo:** Validar features diferenciadoras

3. **AI Batch Entry (mocked)**
   - [ ] Text batch entry (3 tests)
   - Mock de Edge Function responses
   - Validación de TransactionPreview

4. **Scheduled Transactions**
   - [ ] Create, confirm, edit, deactivate (4 tests)

**Entregable:** ~20 tests pasando, features principales cubiertas

---

### Fase 3: Configuration & Management (Semana 3)
**Objetivo:** Validar gestión de datos y preferencias

5. **Categories** (4 tests)
6. **Budget/Plan** (5 tests)
7. **Settings** (3 tests)

**Entregable:** ~32 tests pasando, cobertura completa de Tier 1 + 2

---

### Fase 4: Polish & Secondary Features (Opcional)
**Objetivo:** Completar cobertura

8. Search & Filtering (6 tests)
9. Statistics (4 tests)
10. Trips (3 tests)
11. Backup (2 tests)
12. Navigation (3 tests)

**Entregable:** ~50 tests totales

---

## 🛠️ Consideraciones Técnicas

### Mocking Strategy

**¿Qué mockeamos?**
- ✅ **Supabase Edge Functions** (parse-batch, cleanup_orphaned_anonymous_user)
- ✅ **Supabase Auth** (`signInAnonymously`, `signInWithOAuth`)
- ✅ **Supabase Database** (user_state, push_tokens)
- ✅ **RevenueCat API** (subscription status, purchase flow)
- ✅ **AdMob** (ads no se muestran en tests)
- ✅ **Capacitor Plugins** (Camera, VoiceRecorder, NativeBiometric)

**¿Qué NO mockeamos?**
- ❌ **localStorage** (usamos real localStorage)
- ❌ **React Router** (navegación real)
- ❌ **Zustand Store** (estado real)
- ❌ **UI interactions** (clicks, inputs reales)

### Test Data Strategy

**Enfoque:** Fresh state para cada test

```typescript
test.beforeEach(async ({ page }) => {
  // Clear all storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Mock Supabase session (anonymous)
  await page.evaluate(() => {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: {
        user: {
          id: 'anon-user-123',
          is_anonymous: true,
        },
      },
    }));
  });

  // Navigate to app
  await page.goto('/');
});
```

### Helper Functions Necesarias

```typescript
// test-helpers.ts

export async function skipOnboarding(page: Page) {
  // Set onboarding flags to skip welcome and config
}

export async function createAnonymousSession(page: Page) {
  // Mock Supabase anonymous session in localStorage
}

export async function mockBatchEntryResponse(page: Page, transactions: TransactionDraft[]) {
  // Intercept Edge Function call and return mocked response
}

export async function waitForCloudSync(page: Page) {
  // Wait for cloudStatus = 'ok'
}

export async function getCurrentBalance(page: Page): Promise<number> {
  // Extract balance from localStorage
}

export async function getTransactionsCount(page: Page): Promise<number> {
  // Count transactions in localStorage
}
```

---

## ✅ Success Criteria

**Minimum Viable E2E Suite:**
- ✅ Tier 1 completo (~13 tests)
- ✅ 100% de tests pasando en CI
- ✅ Tiempo de ejecución < 3 minutos para Tier 1
- ✅ Screenshots automáticos en fallos
- ✅ Video recording en CI

**Ideal E2E Suite:**
- ✅ Tier 1 + 2 completo (~32 tests)
- ✅ Cobertura de flujos críticos + features diferenciadoras
- ✅ Tiempo de ejecución < 8 minutos para Tier 1 + 2
- ✅ Integración en `npm run pre-release`

---

## 🚀 Next Steps

1. **Revisar y aprobar este plan** con el equipo
2. **Priorizar escenarios** según impacto/esfuerzo
3. **Implementar Fase 1** (Foundation)
4. **Iterar** según resultados y feedback

---

## 📚 Referencias

- [CHANGELOG.md](../CHANGELOG.md) - Historial de cambios
- [FEATURES.md](../docs/FEATURES.md) - Características actuales
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Arquitectura del proyecto
- [Playwright Docs](https://playwright.dev/docs/intro)
