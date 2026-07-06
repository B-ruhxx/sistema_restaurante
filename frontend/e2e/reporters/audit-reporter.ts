import type { Reporter, FullConfig, Suite, TestCase, TestResult } from 'playwright/test/reporter';
import fs from 'node:fs/promises';
import path from 'node:path';

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

type AuditFile = {
  testId: string;
  title: string;
  status: string;
  pageErrors: { message: string; stack?: string }[];
  consoleErrors: { message: string; location?: string }[];
  requests: AuditRequest[];
  generatedAt: string;
};

type EndpointSummary = {
  endpoint: string;
  methods: string[];
  hits: number;
  failures: number;
  statuses: Record<string, number>;
  tests: string[];
};

class AuditReporter implements Reporter {
  private outputDir = '';
  private auditPaths: string[] = [];

  async onBegin(config: FullConfig, _suite: Suite) {
    this.outputDir = path.resolve(config.rootDir, 'artifacts/playwright-audit');
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async onEnd() {
    const files = await fs.readdir(this.outputDir).catch(() => []);
    const audits: AuditFile[] = [];

    const candidatePaths = this.auditPaths.length > 0
      ? this.auditPaths
      : files
          .filter((file) => file.endsWith('.json') && !file.startsWith('endpoint-summary'))
          .map((file) => path.join(this.outputDir, file));

    for (const filePath of candidatePaths) {
      const raw = await fs.readFile(filePath, 'utf8');
      audits.push(JSON.parse(raw) as AuditFile);
    }

    const grouped = new Map<string, EndpointSummary>();
    for (const audit of audits) {
      for (const request of audit.requests) {
        const key = `${request.method} ${request.endpoint}`;
        const current = grouped.get(key) || {
          endpoint: request.endpoint,
          methods: [request.method],
          hits: 0,
          failures: 0,
          statuses: {},
          tests: [],
        };

        current.hits += 1;
        if (!current.tests.includes(audit.title)) current.tests.push(audit.title);
        const statusKey = String(request.status ?? request.errorText ?? 'unknown');
        current.statuses[statusKey] = (current.statuses[statusKey] || 0) + 1;

        const failed = request.type === 'requestfailed' || (request.status !== undefined && request.status >= 400);
        if (failed) current.failures += 1;

        grouped.set(key, current);
      }
    }

    const summary = Array.from(grouped.values()).sort((a, b) => {
      if (b.failures !== a.failures) return b.failures - a.failures;
      return a.endpoint.localeCompare(b.endpoint);
    });

    await fs.writeFile(
      path.join(this.outputDir, 'endpoint-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    const markdown = [
      '# Endpoint Audit Summary',
      '',
      '| Method | Endpoint | Hits | Failures | Statuses | Tests |',
      '| --- | --- | ---: | ---: | --- | --- |',
      ...summary.map((entry) => `| ${entry.methods.join(', ')} | ${entry.endpoint} | ${entry.hits} | ${entry.failures} | ${Object.entries(entry.statuses).map(([status, count]) => `${status}: ${count}`).join(', ')} | ${entry.tests.join(' ; ')} |`),
    ].join('\n');

    await fs.writeFile(path.join(this.outputDir, 'endpoint-summary.md'), markdown, 'utf8');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const auditAttachment = result.attachments.find((attachment) => attachment.name === 'audit-json');
    if (!auditAttachment?.path) {
      return;
    }
    this.auditPaths.push(auditAttachment.path);
  }
}

export default AuditReporter;
