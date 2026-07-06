import { test as setup, expect } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const authFile = path.resolve('e2e/.auth/user.json');
const loginUser = process.env.LOGIN_USER || 'admin';
const loginPassword = process.env.LOGIN_PASSWORD || 'admin123';

setup('authenticate with storageState', async ({ page }) => {
  await fs.mkdir(path.dirname(authFile), { recursive: true });

  await page.goto('/login');
  await page.fill('#username', loginUser);
  await page.fill('#password', loginPassword);
  await page.getByRole('button', { name: /Iniciar/i }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await page.context().storageState({ path: authFile });
});
