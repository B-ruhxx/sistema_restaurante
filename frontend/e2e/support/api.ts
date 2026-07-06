import { request as playwrightRequest, expect, type APIRequestContext } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const authFile = path.resolve('e2e/.auth/user.json');
const apiBaseURL = `${process.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/`.replace(/([^:]\/)(\/)+/g, '$1');

export async function createApiContext() {
  const token = await readTokenFromStorageState();
  expect(token, 'No se encontro token en storageState').toBeTruthy();

  return playwrightRequest.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function disposeApiContext(api: APIRequestContext) {
  await api.dispose();
}

async function readTokenFromStorageState() {
  const raw = await fs.readFile(authFile, 'utf8');
  const storage = JSON.parse(raw) as {
    origins?: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
  };

  for (const origin of storage.origins || []) {
    const token = origin.localStorage.find((entry) => entry.name === 'token');
    if (token?.value) return token.value;
  }

  return null;
}
