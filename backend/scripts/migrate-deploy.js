#!/usr/bin/env node
/**
 * Runs prisma migrate deploy. If DATABASE_URL points to Supabase and has no
 * sslmode, appends ?sslmode=require so the connection succeeds (fixes P1001).
 * Usage: node scripts/migrate-deploy.js (or npm run prisma:migrate:deploy)
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  if (process.env.DATABASE_URL) return; // CI or shell already set it
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('DATABASE_URL=')) continue;
    const value = trimmed.slice('DATABASE_URL='.length).trim();
    const unquoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
      ? value.slice(1, -1)
      : value.split(/#/)[0].trim();
    if (unquoted) process.env.DATABASE_URL = unquoted;
    break;
  }
}

loadEnv();
let url = process.env.DATABASE_URL || '';
if (url.includes('supabase.co') && !url.includes('sslmode=')) {
  process.env.DATABASE_URL = url + (url.includes('?') ? '&' : '?') + 'sslmode=require';
}
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});
process.exit(result.status ?? 1);
