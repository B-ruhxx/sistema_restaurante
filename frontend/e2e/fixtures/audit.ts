import { test as base, expect } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type AuditConsoleError = {
  message: string;
  location?: string;
};

type AuditPageError = {
  message: string;
  stack?: string;
};

type AuditRequest = {
  type: 'response' | 'requestfailed';
  method: string;
  url: string;
  endpoint: string;
  status?: number;
  statusText?: string;
  body?: string;
  errorText?: string;
  expectedSuccess?: boolean;
  allowed?: boolean;
};

type AllowRule = {
  status?: number;
  urlIncludes?: string;
};

type SuccessExpectation = {
  startIndex: number;
  label: string;
};

export type AuditController = {
  allowHttpStatus: (rule: AllowRule) => void;
  expectSuccess: <T>(label: string, action: () => Promise<T>) => Promise<T>;
};

export const test = base.extend<{ audit: AuditController }>({
  audit: async ({ page }, use, testInfo) => {
    const outputDir = path.resolve('artifacts/playwright-audit');
    await fs.mkdir(outputDir, { recursive: true });

    const consoleErrors: AuditConsoleError[] = [];
    const pageErrors: AuditPageError[] = [];
    const requests: AuditRequest[] = [];
    const allowRules: AllowRule[] = [];

    const isAllowed = (request: AuditRequest) => allowRules.some((rule) => {
      if (rule.status !== undefined && request.status !== rule.status) return false;
      if (rule.urlIncludes && !request.url.includes(rule.urlIncludes)) return false;
      return true;
    });

    page.on('console', async (message) => {
      if (message.type() !== 'error') return;
      const location = message.location();
      const locationUrl = location.url || '';
      const isAppError = !locationUrl || locationUrl.startsWith('http://127.0.0.1') || locationUrl.startsWith('http://localhost');
      if (!isAppError) return;

      consoleErrors.push({
        message: message.text(),
        location: locationUrl ? `${locationUrl}:${location.lineNumber}:${location.columnNumber}` : undefined,
      });
    });

    page.on('pageerror', (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      });
    });

    page.on('response', async (response) => {
      const status = response.status();
      if (status < 400) return;

      const request = response.request();
      const body = await response.text().catch(() => '<<unreadable body>>');
      const entry: AuditRequest = {
        type: 'response',
        method: request.method(),
        url: response.url(),
        endpoint: normalizeEndpoint(response.url()),
        status,
        statusText: response.statusText(),
        body,
      };
      entry.allowed = isAllowed(entry);
      requests.push(entry);

      await testInfo.attach(`http-${status}-${requests.length}.txt`, {
        body: Buffer.from([
          `${entry.method} ${entry.url}`,
          `status: ${status} ${entry.statusText || ''}`,
          '',
          body,
        ].join('\n'), 'utf8'),
        contentType: 'text/plain',
      });
    });

    page.on('requestfailed', (request) => {
      requests.push({
        type: 'requestfailed',
        method: request.method(),
        url: request.url(),
        endpoint: normalizeEndpoint(request.url()),
        errorText: request.failure()?.errorText,
      });
    });

    const audit: AuditController = {
      allowHttpStatus(rule) {
        allowRules.push(rule);
      },
      async expectSuccess(label, action) {
        const expectation: SuccessExpectation = { startIndex: requests.length, label };
        const result = await action();
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await page.waitForTimeout(250);

        const unexpected4xx = requests.slice(expectation.startIndex).filter((entry) => (
          entry.status !== undefined
          && entry.status >= 400
          && entry.status < 500
          && !entry.allowed
        ));

        expect(unexpected4xx, `${label} produjo respuestas 4xx inesperadas`).toEqual([]);
        for (const entry of requests.slice(expectation.startIndex)) {
          entry.expectedSuccess = true;
        }
        return result;
      },
    };

    await use(audit);

    const auditJson = {
      testId: testInfo.testId,
      title: testInfo.title,
      status: testInfo.status,
      consoleErrors,
      pageErrors,
      requests,
      generatedAt: new Date().toISOString(),
    };

    const auditPath = path.join(outputDir, `${sanitize(testInfo.title)}.json`);
    await fs.writeFile(auditPath, JSON.stringify(auditJson, null, 2), 'utf8');
    await testInfo.attach('audit-json', {
      path: auditPath,
      contentType: 'application/json',
    });

    const failures = [
      ...pageErrors.map((error) => `pageerror: ${error.message}`),
      ...consoleErrors.map((error) => `console.error: ${error.message}`),
      ...requests
        .filter((entry) => entry.type === 'requestfailed')
        .map((entry) => `requestfailed: ${entry.method} ${entry.url} (${entry.errorText || 'unknown'})`),
      ...requests
        .filter((entry) => entry.status !== undefined && entry.status >= 500)
        .map((entry) => `http ${entry.status}: ${entry.method} ${entry.url}`),
    ];

    expect(failures, 'La auditoria E2E detecto errores de navegador o API').toEqual([]);
  },
});

export { expect } from 'playwright/test';

function sanitize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeEndpoint(rawUrl: string) {
  const url = new URL(rawUrl);
  const normalizedPath = url.pathname
    .replace(/\/[0-9]+(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, '/:id');
  return `${normalizedPath}${url.search}`;
}
