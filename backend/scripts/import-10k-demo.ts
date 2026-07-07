// Demonstrates NFR-2 (10k scale) the way the architecture prescribes: sign up a
// fresh demo organisation, then push the generated sheet through the REAL
// preview -> commit import pipeline over HTTP (not a direct DB write), and time
// the list/dashboard endpoints afterwards against the < 1s bar.
//
// Usage: npx ts-node scripts/import-10k-demo.ts [csvPath]
// Requires the API running locally (npm run start:dev) and DATABASE_URL set.

import { readFileSync } from 'node:fs';

const BASE = process.env.TANKHA_API_BASE ?? 'http://localhost:3000/api/v1';

interface AuthResult {
  accessToken: string;
}

async function signUpDemoOrg(): Promise<string> {
  const suffix = Date.now();
  const response = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Demo HR',
      email: `demo-${suffix}@tankha.dev`,
      password: 'demo-pass-123',
      organisationName: `Demo Org ${suffix}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Signup failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as AuthResult;
  return body.accessToken;
}

async function previewImport(token: string, csvPath: string): Promise<{ toInsert: number }> {
  const form = new FormData();
  const bytes = readFileSync(csvPath);
  form.append('file', new Blob([bytes], { type: 'text/csv' }), 'tankha-10k.csv');

  const started = Date.now();
  const response = await fetch(`${BASE}/employees/import/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const elapsedMs = Date.now() - started;
  if (!response.ok) {
    throw new Error(`Preview failed: ${response.status} ${await response.text()}`);
  }
  const preview = (await response.json()) as { toInsert: number; conflicts: unknown[]; invalid: unknown[] };
  console.log(
    `Preview (${elapsedMs}ms): toInsert=${preview.toInsert} conflicts=${preview.conflicts.length} invalid=${preview.invalid.length}`,
  );
  return preview;
}

async function commitImport(token: string, csvPath: string): Promise<void> {
  const form = new FormData();
  const bytes = readFileSync(csvPath);
  form.append('file', new Blob([bytes], { type: 'text/csv' }), 'tankha-10k.csv');

  const started = Date.now();
  const response = await fetch(`${BASE}/employees/import/commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const elapsedMs = Date.now() - started;
  if (!response.ok) {
    throw new Error(`Commit failed: ${response.status} ${await response.text()}`);
  }
  const report = await response.json();
  console.log(`Commit (${elapsedMs}ms):`, report);
}

async function timedGet(token: string, path: string): Promise<void> {
  const started = Date.now();
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const elapsedMs = Date.now() - started;
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`);
  }
  await response.json();
  console.log(`GET ${path} -> ${elapsedMs}ms`);
}

async function main(): Promise<void> {
  const csvPath = process.argv[2] ?? 'seed-data/tankha-10k.csv';

  console.log(`Signing up a fresh demo organisation against ${BASE} ...`);
  const token = await signUpDemoOrg();

  console.log(`Previewing ${csvPath} ...`);
  await previewImport(token, csvPath);

  console.log('Committing (inserts all rows as new, one $transaction) ...');
  await commitImport(token, csvPath);

  console.log('Timing reads at 10k scale (< 1s bar, NFR-1) ...');
  await timedGet(token, '/employees?page=1&pageSize=25');
  await timedGet(token, '/employees?page=1&pageSize=25&sort=salaryTotal:desc');
  await timedGet(token, '/insights/overview');
  await timedGet(token, '/insights/by-department');
  await timedGet(token, '/insights/by-country');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
