import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { treeDigest } from '../src/fs.ts';

assert.equal(process.platform, 'win32', 'Run this check with native Git for Windows');
const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const longpaths = process.argv.includes('--longpaths');
const temporary = await mkdtemp(path.join(longpaths ? tmpdir() : process.env.MARKET_WINDOWS_SHORT_ROOT || homedir(), longpaths ? 'market-windows-' : 'p-'));
const target = longpaths ? path.join(temporary, '.codex/.tmp/marketplaces/.staging/marketplace-windows-check/checkout') : path.join(temporary, 'm');
try {
  await mkdir(path.dirname(target), { recursive: true });
  const commit = (await exec('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  // A disposable clone configuration tests the documented setting without editing a user's Git configuration.
  await exec('git', ['clone', '--quiet', '--no-hardlinks', '--no-checkout', '-c', 'core.longpaths=' + longpaths, root, target], { cwd: root, timeout: 120000 });
  await exec('git', ['checkout', '--quiet', '--detach', commit], { cwd: target, timeout: 120000 });
  if (longpaths) assert.ok(target.length >= 81, 'Use at least the reported Codex staging prefix length');
  const catalog = JSON.parse(await readFile(path.join(target, 'catalog/catalog.json'), 'utf8'));
  for (const pkg of catalog.packages) assert.equal(await treeDigest(path.join(target, pkg.packagePath)), pkg.artifactHash, pkg.id);

  let codexReport;
  const entry = process.env.MARKET_CODEX_NODE_ENTRY;
  if (!longpaths && entry) {
    const profile = path.join(temporary, 'c');
    await mkdir(profile, { recursive: true });
    const environment = { ...process.env, CODEX_HOME: profile };
    const codex = async args => JSON.parse((await exec(process.execPath, [entry, ...args, '--json'], { cwd: target, env: environment, timeout: 120000, maxBuffer: 8 * 1024 * 1024 })).stdout);
    const added = await codex(['plugin', 'marketplace', 'add', target]);
    assert.equal((await realpath(added.installedRoot)).toLowerCase(), (await realpath(target)).toLowerCase(), 'Local marketplaces must be read in place');
    const marketplaces = await codex(['plugin', 'marketplace', 'list']);
    assert.equal(marketplaces.marketplaces.find(market => market.name === catalog.name)?.marketplaceSource.sourceType, 'local');
    const available = await codex(['plugin', 'list', '--available', '--marketplace', catalog.name]);
    const expected = JSON.parse(await readFile(path.join(target, '.agents/plugins/marketplace.json'), 'utf8')).plugins;
    assert.equal(available.available.length, expected.length);
    const installed = [];
    for (const id of ['research-paper-writing', 'academic-toolkit-office-academic-skill', 'academic-toolkit-scientific-toolkit-skill']) {
      const result = await codex(['plugin', 'add', id + '@' + catalog.name]);
      const pkg = catalog.packages.find(pkg => pkg.id === id);
      assert.equal(await treeDigest(result.installedPath), pkg.artifactHash, id + ': installed resources must match the locked bundle');
      installed.push(id);
    }
    codexReport = { localSourceRegistered: true, sourceReadInPlace: true, availableEntries: available.available.length, installedAndVerified: installed, modelRequests: 0 };
  }
  console.log(JSON.stringify({ platform: process.platform, git: (await exec('git', ['--version'])).stdout.trim(), cloneAndCheckout: true, checkoutPrefixLength: target.length, bundlesVerified: catalog.packages.length, coreLongpaths: longpaths, ...(codexReport ? { codex: codexReport } : {}) }));
} finally { await rm(temporary, { recursive: true, force: true }); }
