import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { treeDigest } from '../src/fs.ts';

assert.equal(process.platform, 'win32', 'Run this check with native Git for Windows');
const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'market-windows-'));
const target = path.join(temporary, '.codex/.tmp/marketplaces/.staging/marketplace-windows-check/checkout');
try {
  await mkdir(path.dirname(target), { recursive: true });
  const commit = (await exec('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  // A disposable clone configuration tests the documented setting without editing a user's Git configuration.
  await exec('git', ['clone', '--quiet', '--no-hardlinks', '--no-checkout', '-c', 'core.longpaths=true', root, target], { cwd: root, timeout: 120000 });
  await exec('git', ['checkout', '--quiet', '--detach', commit], { cwd: target, timeout: 120000 });
  assert.ok(target.length >= 81, 'Use at least the reported Codex staging prefix length');
  const catalog = JSON.parse(await readFile(path.join(target, 'catalog/catalog.json'), 'utf8'));
  for (const pkg of catalog.packages) assert.equal(await treeDigest(path.join(target, pkg.packagePath)), pkg.artifactHash, pkg.id);
  console.log(JSON.stringify({ platform: process.platform, git: (await exec('git', ['--version'])).stdout.trim(), cloneAndCheckout: true, checkoutPrefixLength: target.length, bundlesVerified: catalog.packages.length, coreLongpaths: true }));
} finally { await rm(temporary, { recursive: true, force: true }); }
