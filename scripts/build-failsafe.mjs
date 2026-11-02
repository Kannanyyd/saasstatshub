/**
 * Deterministic production-mode Astro tests. Run after npm ci:
 *   node scripts/build-failsafe.mjs [--case <name> ...]
 *
 * Each case copies this checkout's source/config into a fresh temporary root,
 * links only installed dependencies, and uses synthetic local WPGraphQL data.
 * No .env, artifacts, CMS snapshots, or caller dist are copied or deleted.
 * The real npm build (including the deployment guard) is validated separately
 * against the real CMS; these small fixtures test the real Astro failure path.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles, responseFor, scenarios } from './fixtures/build-failsafe.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const selected = [];
for (let i = 2; i < process.argv.length; i += 2) {
  if (process.argv[i] !== '--case' || !scenarios.some((s) => s.name === process.argv[i + 1])) {
    throw new Error('Usage: node scripts/build-failsafe.mjs [--case <known name> ...]');
  }
  selected.push(process.argv[i + 1]);
}
const cases = scenarios.filter((s) => selected.length === 0 || selected.includes(s.name));
const dependencies = path.join(ROOT, 'node_modules');
const astroPackage = JSON.parse(fs.readFileSync(path.join(dependencies, 'astro/package.json'), 'utf8'));
const astroBin = path.join(dependencies, 'astro', astroPackage.bin.astro);
const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'saasstatshub-build-failsafe-'));
const sourceEntries = ['src', 'public', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json'];

function fingerprint(dir) {
  if (!fs.existsSync(dir)) return { exists: false };
  const hash = createHash('sha256');
  let fileCount = 0;
  let bytes = 0;
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) {
        const content = fs.readFileSync(file);
        hash.update(path.relative(dir, file) + '\0');
        hash.update(createHash('sha256').update(content).digest());
        fileCount += 1;
        bytes += content.length;
      }
    }
  }
  walk(dir);
  return { exists: true, fileCount, bytes, sha256: hash.digest('hex') };
}

async function startServer(scenario, requests, fixtureErrors) {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        const input = raw ? JSON.parse(raw) : {};
        const operation = /^\s*query\s+(\w+)/.exec(input.query || '')?.[1] || '';
        const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
        const variables = input.variables || {};
        const response = responseFor(scenario, operation, variables, pathname);
        requests.push({ operation, variables, pathname, status: response.status, injected: response.injected === true });
        const headers = { 'content-type': response.type, 'cache-control': 'no-store' };
        if (response.location) headers.location = response.location;
        res.writeHead(response.status, headers);
        res.end(response.body);
      } catch (error) {
        fixtureErrors.push(String(error));
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ errors: [{ message: '[fixture] invalid request or response' }] }));
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

async function build(root, endpoint, logPath) {
  // Do not inherit mock injections, .env files, NODE_OPTIONS, or deployment credentials.
  const env = {};
  for (const key of ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'LANG', 'LC_ALL']) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  Object.assign(env, { NODE_ENV: 'production', WP_API_URL: endpoint, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' });
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [astroBin, 'build'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 180_000);
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      fs.writeFileSync(logPath, output);
      resolve({ code, signal, timedOut, output });
    });
  });
}

function successChecks(root) {
  const checks = [];
  for (const article of articles.slice(0, 2)) {
    const html = fs.readFileSync(path.join(root, 'dist/crm', article.slug, 'index.html'), 'utf8');
    const text = html.replace(/<[^>]+>/g, '');
    checks.push(text.includes(article.title), text.includes(article.content.match(/fixture-complete-body-\d/)[0]));
    checks.push(!html.includes('FAQPage'), !/class="key-takeaways"/.test(html));
  }
  const empty = fs.readFileSync(path.join(root, 'dist/categories/analytics/index.html'), 'utf8');
  checks.push(empty.includes('No articles yet in this category'));
  const home = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  checks.push(home.includes('Sourced statistics · Named references'), !home.includes('hero-stat-card'));
  return checks.every(Boolean);
}

const before = fingerprint(path.join(ROOT, 'dist'));
const results = [];
console.log(`Isolated test output: ${runRoot}`);
try {
  for (const scenario of cases) {
    const root = path.join(runRoot, scenario.name);
    fs.mkdirSync(root);
    for (const entry of sourceEntries) fs.cpSync(path.join(ROOT, entry), path.join(root, entry), { recursive: true });
    fs.symlinkSync(dependencies, path.join(root, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const requests = [];
    const fixtureErrors = [];
    const server = await startServer(scenario, requests, fixtureErrors);
    const endpoint = `http://127.0.0.1:${server.address().port}${scenario.endpoint || '/graphql'}`;
    let result;
    try {
      const out = await build(root, endpoint, path.join(root, 'build.log'));
      const hit = !scenario.operation && !scenario.html && !scenario.redirect
        || requests.some((r) => r.injected && (r.operation === scenario.operation || ['AllCategories', 'AllPostSlugs'].includes(r.operation)));
      const markerFound = scenario.success ? true : out.output.includes(scenario.error);
      let positiveChecks = null;
      if (scenario.success && out.code === 0) positiveChecks = successChecks(root);
      const pass = !out.timedOut && out.signal === null && fixtureErrors.length === 0 && hit
        && (scenario.success ? out.code === 0 && positiveChecks : Number.isInteger(out.code) && out.code !== 0 && markerFound);
      result = { name: scenario.name, pass, exitCode: out.code, signal: out.signal, timedOut: out.timedOut,
        expectedError: scenario.error || null, markerFound, injectedTargetReached: hit, positiveChecks, fixtureErrors, requests };
      console.log(`${pass ? 'PASS' : 'FAIL'} ${scenario.name}: exit=${out.code}; target=${hit}; marker=${markerFound}; fixtureErrors=${fixtureErrors.length}`);
      if (!pass) console.log(out.output.split('\n').filter(Boolean).slice(-10).join('\n'));
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    results.push(result);
  }
} finally {
  const after = fingerprint(path.join(ROOT, 'dist'));
  const sourceDistUnchanged = JSON.stringify(before) === JSON.stringify(after);
  const pass = results.length === cases.length && results.every((r) => r.pass) && sourceDistUnchanged;
  fs.writeFileSync(path.join(runRoot, 'results.json'), JSON.stringify({
    nodeVersion: process.version, astroVersion: astroPackage.version, sourceRoot: ROOT, runRoot,
    sourceDistBefore: before, sourceDistAfter: after, sourceDistUnchanged,
    fixtures: 'scripts/fixtures/build-failsafe.mjs (synthetic, offline)', results, pass,
  }, null, 2));
  console.log(`Caller dist unchanged: ${sourceDistUnchanged}`);
  console.log(`BUILD FAILSAFE: ${pass ? 'ALL PASS' : 'FAILED'} (${results.filter((r) => r.pass).length}/${cases.length}); results: ${path.join(runRoot, 'results.json')}`);
  process.exitCode = pass ? 0 : 1;
}
