/**
 * E2E Test Helpers
 * Shared utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// STORAGE & SESSION MANAGEMENT
// ============================================================================

/**
 * Clear all storage (localStorage + sessionStorage)
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Create a mock anonymous Supabase session
 * This simulates what CloudSyncGate does on first launch
 */
export async function createAnonymousSession(page: Page, userId = 'test-anon-user-123') {
  const mockSession = {
    access_token: 'mock-access-token-' + Date.now(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    refresh_token: 'mock-refresh-token',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: '', // Anonymous users have no email
      app_metadata: {},
      user_metadata: {},
      is_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  await page.evaluate((session) => {
    // Supabase stores the session in localStorage with this key format
    // Key format: sb-{project-ref}-auth-token
    // For local dev, we'll use a generic key that matches the pattern
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    const storageKey = key || 'sb-test-auth-token';

    localStorage.setItem(storageKey, JSON.stringify({
      currentSession: session,
      expiresAt: session.expires_at,
    }));
  }, mockSession);
}

/**
 * Skip onboarding by setting completion flags
 * Simulates a user who has already completed welcome + config flows
 */
export async function skipOnboarding(page: Page) {
  await page.evaluate(() => {
    // Mark welcome onboarding as completed
    localStorage.setItem('budget.onboarding.completed.v2', 'true');
    localStorage.setItem('budget.onboarding.timestamp.v2', Date.now().toString());

    // Mark device as initialized (FirstConfig completed)
    localStorage.setItem('budget.device.initialized', 'true');

    // Mark feature onboardings as seen
    localStorage.setItem('budget.budgetOnboardingSeen.v1', '1');
    localStorage.setItem('budget.savingsGoalOnboardingSeen.v1', '1');

    // Mark all spotlight tours as seen (prevents overlay blocking UI)
    localStorage.setItem('baselineapp.homeTour.v1', '1');
    localStorage.setItem('baselineapp.statsTour.v1', '1');
    localStorage.setItem('baselineapp.addTransactionTour.v1', '1');
    localStorage.setItem('baselineapp.batchReviewTour.v1', '1');
    localStorage.setItem('baselineapp.historyTour.v1', '1');
    localStorage.setItem('baselineapp.scheduleTour.v1', '1');
    localStorage.setItem('baselineapp.scheduledBannerTour.v1', '1');
    localStorage.setItem('baselineapp.categoriesTour.v1', '1');
    localStorage.setItem('baselineapp.scheduledPageTour.v1', '1');

    // Set default preferences
    localStorage.setItem('app_language', 'es');
    localStorage.setItem('app_theme', 'light');
    localStorage.setItem('app_currency', 'COP');
  });
}

/**
 * Complete onboarding and setup anonymous session
 * Use this in beforeEach for most tests
 */
export async function setupTestUser(page: Page) {
  await clearStorage(page);
  await createAnonymousSession(page);
  await skipOnboarding(page);
}

// ============================================================================
// SUPABASE MOCKING
// ============================================================================

/**
 * Mock Supabase Auth API endpoints
 */
export async function mockSupabaseAuth(page: Page) {
  // Mock signInAnonymously
  await page.route('**/auth/v1/signup', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Check if it's anonymous signup
    if (postData?.is_anonymous === true) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-anon-user-' + Date.now(),
            is_anonymous: true,
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock token refresh
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-refreshed-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
      }),
    });
  });

  // Mock getSession
  await page.route('**/auth/v1/session**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-anon-user-123',
          is_anonymous: true,
        },
        session: {
          access_token: 'mock-access-token',
        },
      }),
    });
  });
}

/**
 * Mock Supabase REST API (user_state table)
 */
export async function mockSupabaseREST(page: Page) {
  let cloudData: any = null;

  // Mock GET (pull cloud data)
  await page.route('**/rest/v1/user_state**', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      // Return stored cloud data or empty array
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloudData ? [cloudData] : []),
      });
    } else if (method === 'POST' || method === 'PATCH') {
      // Store pushed data
      const data = route.request().postDataJSON();
      cloudData = data;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    } else if (method === 'DELETE') {
      // Clear cloud data
      cloudData = null;
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock all Supabase endpoints
 */
export async function mockSupabase(page: Page) {
  await mockSupabaseAuth(page);
  await mockSupabaseREST(page);
}

// ============================================================================
// DATA EXTRACTION HELPERS
// ============================================================================

/**
 * Get current balance from localStorage
 */
export async function getCurrentBalance(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_app_v1');
    if (!state) return 0;

    const parsed = JSON.parse(state);
    const income = parsed.transactions
      ?.filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
    const expense = parsed.transactions
      ?.filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

    return income - expense;
  });
}

/**
 * Get transactions count from localStorage
 */
export async function getTransactionsCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_app_v1');
    if (!state) return 0;
    const parsed = JSON.parse(state);
    return parsed.transactions?.length || 0;
  });
}

/**
 * Get all transactions from localStorage
 */
export async function getTransactions(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_app_v1');
    if (!state) return [];
    const parsed = JSON.parse(state);
    return parsed.transactions || [];
  });
}

/**
 * Get cloud sync status
 */
export async function getCloudStatus(page: Page): Promise<string | undefined> {
  return await page.evaluate(() => {
    const state = localStorage.getItem('budget_app_v1');
    if (!state) return undefined;
    const parsed = JSON.parse(state);
    return parsed.cloudStatus;
  });
}

/**
 * Check if onboarding is completed
 */
export async function isOnboardingCompleted(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return localStorage.getItem('budget.onboarding.completed.v2') === 'true';
  });
}

/**
 * Check if device is initialized
 */
export async function isDeviceInitialized(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return localStorage.getItem('budget.device.initialized') === 'true';
  });
}

// ============================================================================
// WAIT HELPERS
// ============================================================================

/**
 * Wait for cloud sync to complete (cloudStatus = 'ok')
 */
export async function waitForCloudSync(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const state = localStorage.getItem('budget_app_v1');
      if (!state) return false;
      const parsed = JSON.parse(state);
      // Cloud sync is ok if status is 'ok' or undefined (no sync in progress)
      return parsed.cloudStatus === 'ok' || parsed.cloudStatus === undefined;
    },
    { timeout }
  );
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, url?: string) {
  if (url) {
    await page.waitForURL(url, { timeout: 5000 });
  }
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Create a transaction using the UI
 */
export async function createTransaction(
  page: Page,
  data: {
    type: 'income' | 'expense';
    name: string;
    amount: number;
    categoryName?: string;
    notes?: string;
  }
) {
  // Click FAB button to open AddActionSheet
  const fabButton = page.locator('[data-testid="fab-add-transaction"]').or(
    page.locator('button').filter({ hasText: /agregar|add/i }).first()
  );
  await fabButton.click();

  // Wait for AddActionSheet and click "Agregar uno"
  await page.waitForTimeout(300); // Wait for sheet animation
  const addOneButton = page.locator('button').filter({ hasText: /agregar uno|add one/i });
  await addOneButton.click();

  // Wait for transaction form
  await page.waitForURL(/\/(add|edit)/, { timeout: 5000 });

  // Select type (expense/income)
  if (data.type === 'income') {
    const incomeTab = page.locator('button').filter({ hasText: /ingresos|income/i });
    await incomeTab.click();
  }
  // Expense is default, no need to click

  // Fill name
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill(data.name);

  // Fill amount
  const amountInput = page.locator('input[inputMode="decimal"]');
  await amountInput.click();
  await amountInput.fill(data.amount.toString());

  // Select category if provided
  if (data.categoryName) {
    const categoryButton = page.locator('button').filter({ hasText: /categoría|category/i });
    await categoryButton.click();

    await page.waitForTimeout(300); // Wait for picker animation

    const categoryOption = page.locator('button').filter({ hasText: new RegExp(data.categoryName, 'i') });
    await categoryOption.click();
  }

  // Fill notes if provided
  if (data.notes) {
    const notesTextarea = page.locator('textarea');
    await notesTextarea.fill(data.notes);
  }

  // Click Guardar button
  const saveButton = page.locator('button').filter({ hasText: /guardar|save/i });
  await saveButton.click();

  // Wait for navigation back to home
  await page.waitForURL('/', { timeout: 5000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Delete a transaction by name
 */
export async function deleteTransaction(page: Page, transactionName: string) {
  // Click on transaction
  const transactionItem = page.locator('text=' + transactionName).first();
  await transactionItem.click();

  // Wait for edit page
  await page.waitForURL(/\/edit\//, { timeout: 5000 });

  // Click delete button (trash icon)
  const deleteButton = page.locator('button').filter({ has: page.locator('svg[class*="lucide-trash"]') });
  await deleteButton.click();

  // Wait for confirmation modal
  await page.waitForSelector('text=/eliminar|delete/i', { timeout: 5000 });

  // Confirm deletion
  const confirmButton = page.locator('button').filter({ hasText: /eliminar|delete/i }).last();
  await confirmButton.click();

  // Wait for navigation back to home
  await page.waitForURL('/', { timeout: 5000 });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a transaction exists in the list
 */
export async function expectTransactionToExist(page: Page, name: string) {
  await expect(page.locator('text=' + name)).toBeVisible({ timeout: 5000 });
}

/**
 * Assert that a transaction does not exist
 */
export async function expectTransactionNotToExist(page: Page, name: string) {
  await expect(page.locator('text=' + name)).not.toBeVisible();
}

/**
 * Assert balance equals expected value
 */
export async function expectBalance(page: Page, expectedBalance: number) {
  const actualBalance = await getCurrentBalance(page);
  expect(actualBalance).toBe(expectedBalance);
}

/**
 * Assert transaction count equals expected value
 */
export async function expectTransactionCount(page: Page, expectedCount: number) {
  const actualCount = await getTransactionsCount(page);
  expect(actualCount).toBe(expectedCount);
}
