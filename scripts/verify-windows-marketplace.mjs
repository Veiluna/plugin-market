import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { exists, filesUnder, treeDigest } from '../src/fs.ts';

assert.equal(process.platform, 'win32', 'Run with native Git and Codex for Windows');
const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const entry = process.env.MARKET_CODEX_NODE_ENTRY;
assert.ok(entry, 'Set MARKET_CODEX_NODE_ENTRY to the pinned official Codex CLI entry');
const configuration = JSON.parse(await readFile(path.join(root, 'market.config.json'), 'utf8'));
assert.equal((await exec('git', ['config', '--global', '--get', 'core.longpaths'])).stdout.trim(), 'false');
const temporary = await mkdtemp(path.join(process.env.MARKET_WINDOWS_FIXTURE_ROOT || path.parse(root).root, 'm-'));
try {
  // This profile has the same length as C:\Users\A\.codex. No user settings or profile are touched.
  const profile = path.join(temporary, 'codex');
  await mkdir(profile);
  assert.ok(profile.length >= 17, 'Use a realistic Codex profile prefix');
  const environment = { ...process.env, CODEX_HOME: profile };
  const codex = async args => JSON.parse((await exec(process.execPath, [entry, ...args, '--json'], { cwd: root, env: environment, timeout: 240000, maxBuffer: 8 * 1024 * 1024 })).stdout);
  // Exactly the public repository name a user enters, with no sparse, local-path, or configuration flags.
  const added = await codex(['plugin', 'marketplace', 'add', configuration.repository]);
  const market = added.installedRoot;
  assert.ok(await exists(path.join(market, '.agents/plugins/marketplace.json')));
  assert.equal(await exists(path.join(market, 'p')), false, 'Adding a market must not materialize plugin resources');
  assert.equal(await exists(path.join(market, 'packages')), false, 'Legacy payload directories must not be checked out');
  const catalog = JSON.parse(await readFile(path.join(market, 'catalog/catalog.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(market, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.ok(manifest.plugins.every(plugin => plugin.source.source !== 'local'));
  const available = await codex(['plugin', 'list', '--available', '--marketplace', catalog.name]);
  assert.equal(available.available.length, manifest.plugins.length);
  const installed = [];
  for (const id of ['research-paper-writing', 'academic-toolkit-office-academic-skill', 'academic-toolkit-scientific-toolkit-skill']) {
    const result = await codex(['plugin', 'add', id + '@' + catalog.name]);
    const pkg = catalog.packages.find(pkg => pkg.id === id);
    assert.equal(await treeDigest(result.installedPath), pkg.artifactHash, id + ': installed resources must match the lock');
    assert.ok((await readFile(path.join(result.installedPath, '.codex-plugin/plugin.json'), 'utf8')).length > 0);
    installed.push(id);
  }
  console.log(JSON.stringify({ platform: process.platform, git: (await exec('git', ['--version'])).stdout.trim(), coreLongpaths: false, source: configuration.repository, addedByRepositoryName: true, profilePrefixLength: profile.length, marketFiles: (await filesUnder(market)).length, pluginPayloadsOnMarketAdd: 0, availableEntries: available.available.length, installedAndVerified: installed, modelRequests: 0 }));
} finally { await rm(temporary, { recursive: true, force: true }); }
