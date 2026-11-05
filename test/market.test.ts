import assert from 'node:assert/strict';
import { chmod, lstat, mkdir, readFile, rename, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildDshIndex } from '../src/adapters.ts';
import { ensurePackage } from '../src/bundles.ts';
import { loadConfig } from '../src/config.ts';
import { discoverPackages, readSkill } from '../src/discovery.ts';
import { copyChecked, exists, filesUnder, readJson, treeDigest, writeJson, writeText } from '../src/fs.ts';
import { git, parseRemoteHead } from '../src/git.ts';
import { installSkills } from '../src/install.ts';
import { publishDsh } from '../src/publish.ts';
import { sync } from '../src/sync.ts';
import { validateDsh, validateRepository } from '../src/validate.ts';
import type { Catalog, CatalogLock, PackageRecord } from '../src/types.ts';
import { fixture, sha } from './helpers.ts';

test('seed sources are unique and the ARS distributions remain independent', async () => {
  const { sources } = await loadConfig(fileURLToPath(new URL('../', import.meta.url)));
  assert.equal(sources.length, 12);
  assert.equal(sources.filter(source => source.repository === 'leo-lilinxiao/codex-autoresearch').length, 1);
  assert.deepEqual(sources.filter(source => source.family === 'academic-research-skills').map(source => source.id), ['ars-claude', 'ars-codex']);
});

test('remote HEAD supports a non-main default branch and requires a pinned commit', () => {
  assert.deepEqual(parseRemoteHead('ref: refs/heads/trunk\tHEAD\n' + sha(1) + '\tHEAD\n'), { branch: 'trunk', sha: sha(1) });
  assert.throws(() => parseRemoteHead('ref: refs/heads/main\tHEAD'), /full Git commit/);
});

test('invalid metadata and escaping symlinks cannot become installable skills', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeText(path.join(f.upstream[0], 'skills/example/SKILL.md'), '---\nname: example\nname: duplicate\ndescription: test\n---\n');
  await assert.rejects(readSkill(f.upstream[0], 'skills/example'), /unique|map|key/i);
  await rm(path.join(f.upstream[0], 'skills/example/SKILL.md'));
  await writeText(path.join(f.root, '.cache/outside.md'), 'Private fixture, never read as a skill');
  await symlink(path.join(f.root, '.cache/outside.md'), path.join(f.upstream[0], 'skills/example/SKILL.md'));
  await assert.rejects(readSkill(f.upstream[0], 'skills/example'), /escapes checkout/);
});

test('one successful sync generates complete, pinned native catalogs and idempotent files', async t => {
  const f = await fixture(2); t.after(() => rm(f.root, { recursive: true, force: true }));
  const first = await sync(f.root, { checkout: f.checkout });
  assert.equal(first.failed.length, 0);
  assert.equal(first.changed.length, 2);
  assert.deepEqual(await validateRepository(f.root), { sources: 2, packages: 2, pendingDsh: 2 });
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  assert.equal(catalog.packages[0].skills[0].name, 'example-0');
  assert.equal(await readFile(path.join(f.root, catalog.packages[0].genericSkillPath, 'upstream/shared/guide.md'), 'utf8'), '# Shared resource\nOriginal content.\n');
  const before = await treeDigest(f.root);
  const second = await sync(f.root, { checkout: f.checkout });
  assert.equal(second.changed.length, 0);
  assert.equal(second.unchanged.length, 2);
  assert.equal(await treeDigest(f.root), before);
});

test('long public names do not repeat in storage paths or overflow the reported Windows staging path', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const id = 'academic-toolkit-scientific-toolkit-skill';
  f.sources[0].id = id;
  f.sources[0].discovery = { kind: 'skills', packages: [{ name: id, roots: ['scientific-toolkit-skill'] }] };
  const resource = 'scientific-toolkit-skill/references/scientific-skills/xlsx/scripts/office/schemas/ISO-IEC29500-4_2016/shared-documentPropertiesVariantTypes.xsd';
  await writeText(path.join(f.upstream[0], 'scientific-toolkit-skill/SKILL.md'), '---\nname: scientific-toolkit\ndescription: Original toolkit\n---\nOriginal workflow.\n');
  await writeText(path.join(f.upstream[0], resource), '<schema>Original exact resource</schema>\n');
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  assert.deepEqual((await sync(f.root, { checkout: f.checkout })).failed, []);
  const pkg = (await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'))).packages[0];
  assert.equal(pkg.id, id);
  assert.equal(pkg.genericSkillName, id + '-suite');
  const prefix = 'C:/Users/A/.codex/.tmp/marketplaces/.staging/marketplace-windows-9KuE9O/checkout/';
  for (const file of await filesUnder(path.join(f.root, pkg.packagePath))) {
    assert.ok((prefix + pkg.packagePath + '/' + file).length < 260, file);
  }
  assert.equal(await readFile(path.join(f.root, pkg.genericSkillPath, 'upstream', resource), 'utf8'), '<schema>Original exact resource</schema>\n');
  await validateRepository(f.root);
});

test('rebuilding migrates legacy bundle locations and removes only replaced package directories', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const lock = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  const pkg = lock.sources['source-0'].packages[0];
  const legacy = 'packages/source-0/legacy-package';
  await mkdir(path.dirname(path.join(f.root, legacy)), { recursive: true });
  await rename(path.join(f.root, pkg.packagePath), path.join(f.root, legacy));
  pkg.genericSkillPath = legacy + '/' + path.posix.relative(pkg.packagePath, pkg.genericSkillPath);
  pkg.packagePath = legacy;
  await writeJson(path.join(f.root, 'catalog/lock.json'), lock);
  await writeText(path.join(f.root, 'packages/keep-unmanaged.txt'), 'Keep unrelated files.\n');
  assert.deepEqual((await sync(f.root, { checkout: f.checkout, rebuild: true })).failed, []);
  assert.equal(await exists(path.join(f.root, legacy)), false);
  assert.equal(await readFile(path.join(f.root, 'packages/keep-unmanaged.txt'), 'utf8'), 'Keep unrelated files.\n');
  await validateRepository(f.root);
});

test('a failed source retains its last good package while another source advances', async t => {
  const f = await fixture(2); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const before = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  await rm(path.join(f.upstream[0], 'shared/guide.md'));
  await writeText(path.join(f.upstream[1], 'shared/guide.md'), '# A real upstream change\n');
  f.heads[0] = 10; f.heads[1] = 11;
  const report = await sync(f.root, { checkout: f.checkout });
  assert.equal(report.failed.length, 1);
  assert.deepEqual(report.changed, ['source-1']);
  const after = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  assert.deepEqual(after.sources['source-0'], before.sources['source-0']);
  assert.equal(after.sources['source-1'].sha, sha(11));
  assert.equal(after.sources['source-1'].packages[0].distributionVersion, '0.1.1');
  await validateRepository(f.root);
});

test('unreachable upstream keeps a visible error and a usable historical package', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const before = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  const report = await sync(f.root, { checkout: async () => { throw new Error('HTTP 403 fixture'); } });
  assert.equal(report.failed.length, 1);
  assert.deepEqual(await readJson(path.join(f.root, 'catalog/lock.json')), before);
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  assert.equal(catalog.sources[0].status, 'ready');
  assert.match(catalog.sources[0].error!, /403/);
});

test('dry run does not change published files and cannot publish a branch', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const before = await treeDigest(f.root);
  f.heads[0] = 6;
  const report = await sync(f.root, { checkout: f.checkout, dryRun: true });
  assert.deepEqual(report.changed, ['source-0']);
  assert.equal(await treeDigest(f.root), before);
  await assert.rejects(sync(f.root, { dryRun: true, publishDsh: true }), /cannot publish/);
});

test('native variants retain host-specific skill directories and pinned upstream versions', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.sources[0].discovery = { kind: 'plugin', root: '.' };
  await writeText(path.join(f.upstream[0], 'codex-skills/codex-only/SKILL.md'), '---\nname: codex-only\ndescription: Codex variant\n---\nOriginal Codex content\n');
  await writeJson(path.join(f.upstream[0], '.claude-plugin/plugin.json'), { name: 'native-suite', version: '1.0.0', skills: ['./skills/example'] });
  await writeJson(path.join(f.upstream[0], '.codex-plugin/plugin.json'), { name: 'native-suite', version: '1.0.0', skills: ['./codex-skills'] });
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  assert.equal((await sync(f.root, { checkout: f.checkout })).failed.length, 0);
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  assert.equal(catalog.packages[0].agentSkills.codex![0].name, 'codex-only');
  const marketplace = await readJson<{ plugins: { source: { sha: string }; interface: { longDescription: string } }[] }>(path.join(f.root, '.agents/plugins/marketplace.json'));
  assert.equal(marketplace.plugins[0].source.sha, sha(1));
  assert.ok(marketplace.plugins[0].interface.longDescription.includes('- codex-only：Codex variant'));
  assert.equal(marketplace.plugins[0].interface.longDescription.includes('- example-0：'), false);
  f.heads[0] = 8;
  await sync(f.root, { checkout: f.checkout });
  const updated = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  assert.equal(updated.packages[0].upstreamVersion, '1.0.0');
  assert.equal(updated.packages[0].distributionVersion, '0.1.1');
});

test('new native name collisions reject the affected source instead of merging plugins', async t => {
  const f = await fixture(2); t.after(() => rm(f.root, { recursive: true, force: true }));
  for (let i = 0; i < 2; i++) {
    f.sources[i].discovery = { kind: 'plugin', root: '.' };
    await writeJson(path.join(f.upstream[i], '.claude-plugin/plugin.json'), { name: 'same-name', skills: ['./skills/example'] });
  }
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  const report = await sync(f.root, { checkout: f.checkout });
  assert.equal(report.changed.length, 1);
  assert.match(report.failed[0].error, /Duplicate claude-code plugin name/);
});

test('optional upstream documentation exceptions are explicit and remain visible', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const missing = 'skills/example/references/advanced.md';
  f.sources[0].resourceExceptions = [{ path: missing, reason: 'Reviewed optional advanced guide is absent upstream' }];
  await writeText(path.join(f.upstream[0], 'skills/example/SKILL.md'), '---\nname: example\ndescription: example\n---\nAdvanced: [guide](references/advanced.md).\n');
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  assert.equal((await sync(f.root, { checkout: f.checkout })).failed.length, 0);
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  assert.match(catalog.packages[0].knownIssues[0], /advanced.md/);
  assert.match(await readFile(path.join(f.root, 'docs/CATALOG.md'), 'utf8'), /Reviewed optional advanced guide/);
  f.sources[0].resourceExceptions = [{ path: 'skills/example/references/danger.py', reason: 'Not permitted' }];
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  await assert.rejects(loadConfig(f.root), /Only explicitly reviewed optional reference/);
});

test('artifact tampering fails validation', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  await writeText(path.join(f.root, catalog.packages[0].genericSkillPath, 'upstream/shared/guide.md'), 'modified after verification');
  await assert.rejects(validateRepository(f.root), /differ from the locked artifact/);
});

const copyRunner = async (source: string, stage: string, pkg: PackageRecord): Promise<void> => { await copyChecked(source, path.join(stage, '.agents/skills', pkg.genericSkillName || pkg.id), source); };

test('content integrity survives Windows versus POSIX checkout file modes', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const file = path.join(f.root, catalog.packages[0].genericSkillPath, 'upstream/shared/guide.md');
  const before = await treeDigest(path.dirname(file));
  await chmod(file, 0o755);
  assert.equal(await treeDigest(path.dirname(file)), before);
  await validateRepository(f.root);
});

test('DSH registers a root skill once and excludes the generic router and undeclared nested skills', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.sources[0].discovery = { kind: 'skills', packages: [{ name: 'root-suite', roots: ['.'] }] };
  await writeText(path.join(f.upstream[0], 'SKILL.md'), '---\nname: root-original\ndescription: Original root skill\n---\nRead [shared guide](shared/guide.md).\n');
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  const report = await sync(f.root, { checkout: f.checkout });
  assert.deepEqual(report.failed, []);
  await validateRepository(f.root);
});

test('cloud install copies full resource closure and protects local modifications', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const target = path.join(f.root, '.cache/cloud-project'); await mkdir(target, { recursive: true });
  const result = await installSkills(f.root, 'source-0', { agent: 'codex', target, cloud: true, runner: copyRunner });
  assert.equal((await lstat(result.target)).isSymbolicLink(), false);
  assert.equal(await exists(path.join(result.target, '.codex-plugin')), false);
  assert.equal(await readFile(path.join(result.target, 'upstream/shared/guide.md'), 'utf8'), '# Shared resource\nOriginal content.\n');
  assert.equal((await readSkill(target, '.agents/skills/source-0-suite')).name, 'source-0-suite');
  await assert.rejects(installSkills(f.root, 'source-0', { agent: 'codex', target, runner: copyRunner }), /Target exists/);
  await writeText(path.join(result.target, 'SKILL.md'), 'my local edit');
  await assert.rejects(installSkills(f.root, 'source-0', { agent: 'codex', target, cloud: true, update: true, runner: copyRunner }), /Local skill files have changed/);
  assert.equal(await readFile(path.join(result.target, 'SKILL.md'), 'utf8'), 'my local edit');
});

test('cloud refuses local-browser packages and failed installers leave targets untouched', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.sources[0].cloud = 'unsupported';
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  await sync(f.root, { checkout: f.checkout });
  const target = path.join(f.root, '.cache/project'); await mkdir(target, { recursive: true });
  await assert.rejects(installSkills(f.root, 'source-0', { agent: 'codex', target, cloud: true }), /local runtime/);
  await assert.rejects(installSkills(f.root, 'source-0', { agent: 'codex', target, runner: async () => { throw new Error('installer failed'); } }), /installer failed/);
  assert.equal(await exists(path.join(target, '.agents/skills/source-0')), false);
});

test('cloud destination symlinks cannot redirect installation outside the selected project', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const target = path.join(f.root, '.cache/project');
  const elsewhere = path.join(f.root, '.cache/elsewhere');
  await mkdir(target, { recursive: true }); await mkdir(elsewhere, { recursive: true });
  await symlink(elsewhere, path.join(target, '.agents'));
  await assert.rejects(installSkills(f.root, 'source-0', { agent: 'codex', target, cloud: true, runner: copyRunner }), /escapes the selected project/);
  assert.equal(await exists(path.join(elsewhere, 'skills/source-0')), false);
});

test('a managed unmodified suite updates atomically to the new locked commit', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const target = path.join(f.root, '.cache/update-project'); await mkdir(target, { recursive: true });
  const first = await installSkills(f.root, 'source-0', { agent: 'codex', target, runner: copyRunner });
  await writeText(path.join(f.upstream[0], 'shared/guide.md'), 'Updated original resource\n');
  f.heads[0] = 40;
  await sync(f.root, { checkout: f.checkout });
  const updated = await installSkills(f.root, 'source-0', { agent: 'codex', target, update: true, runner: copyRunner });
  assert.equal(first.target, updated.target);
  assert.equal(updated.sha, sha(40));
  assert.equal(await readFile(path.join(updated.target, 'upstream/shared/guide.md'), 'utf8'), 'Updated original resource\n');
  const receipt = await readJson<{ sha: string }>(path.join(updated.target, '.scientific-market-install.json'));
  assert.equal(receipt.sha, sha(40));
});

test('an unexpected license change freezes only that upstream source', async t => {
  const f = await fixture(2); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  await writeText(path.join(f.upstream[0], 'LICENSE'), 'All rights reserved.\n');
  f.heads[0] = 30; f.heads[1] = 31;
  const result = await sync(f.root, { checkout: f.checkout });
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0].error, /license no longer matches/);
  assert.deepEqual(result.changed, ['source-1']);
  const locked = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  assert.equal(locked.sources['source-0'].sha, sha(1));
});

test('an invalid upstream plugin manifest retains the previous valid release', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.sources[0].discovery = { kind: 'plugin', root: '.' };
  await writeJson(path.join(f.upstream[0], '.claude-plugin/plugin.json'), { name: 'native-suite', skills: ['./skills/example'] });
  await writeJson(path.join(f.root, 'sources.json'), { version: 1, sources: f.sources });
  assert.equal((await sync(f.root, { checkout: f.checkout })).failed.length, 0);
  const before = await readJson<CatalogLock>(path.join(f.root, 'catalog/lock.json'));
  await writeText(path.join(f.upstream[0], '.claude-plugin/plugin.json'), '{"name":');
  f.heads[0] = 50;
  const report = await sync(f.root, { checkout: f.checkout });
  assert.equal(report.failed.length, 1);
  assert.deepEqual(await readJson(path.join(f.root, 'catalog/lock.json')), before);
  await validateRepository(f.root);
});

test('DSH indexes only reference published commits and retain immutable old versions', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  let catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const pending = buildDshIndex(f.config, catalog.packages);
  assert.equal(pending.index.plugins.length, 0);
  assert.equal(pending.pending.length, 1);
  const first = buildDshIndex(f.config, catalog.packages, undefined, sha(100), 1000).index;
  f.heads[0] = 9;
  await sync(f.root, { checkout: f.checkout });
  catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const second = buildDshIndex(f.config, catalog.packages, first, sha(101), 2000).index;
  assert.equal(second.plugins[0].versions.length, 2);
  assert.equal(second.plugins[0].versions[0].source.commit, sha(100));
  validateDsh(second);
  second.plugins[0].versions[1].source.commit = 'main';
  assert.throws(() => validateDsh(second), /pinned/);
});

test('published marketplaces point to immutable bundles instead of local resource directories', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const publication = sha(90);
  await sync(f.root, { checkout: f.checkout, publishDsh: true, publish: async () => publication });
  const catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const pkg = catalog.packages[0];
  assert.equal(pkg.distribution?.commit, publication);
  const codex = await readJson<{ plugins: { source: { source: string; sha: string; path: string } }[] }>(path.join(f.root, '.agents/plugins/marketplace.json'));
  assert.equal(codex.plugins[0].source.source, 'git-subdir');
  assert.equal(codex.plugins[0].source.sha, publication);
  assert.equal(codex.plugins[0].source.path, pkg.packagePath);
  const cursor = await readJson<{ plugins: { source: string }[] }>(path.join(f.root, '.cursor-plugin/marketplace.json'));
  assert.equal(cursor.plugins[0].source, 'https://github.com/test/market/tree/' + publication + '/' + pkg.packagePath);
  await validateRepository(f.root);
});

test('an absent bundle is extracted from its Git commit and checked before becoming available', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout });
  const pkg = (await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'))).packages[0];
  await git(['init', '--quiet'], f.root);
  await git(['add', '--force', '--', pkg.packagePath], f.root);
  await git(['-c', 'user.name=Test', '-c', 'user.email=test@example.test', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Bundle fixture'], f.root);
  const commit = (await git(['rev-parse', 'HEAD'], f.root)).trim();
  const cache = path.join(f.root, '.cache/bundle-repository'); await mkdir(cache, { recursive: true });
  await git(['init', '--bare', '--quiet'], cache);
  await git(['fetch', '--quiet', f.root, commit], cache);
  pkg.distribution = { repository: 'test/market', commit, path: pkg.packagePath };
  await rm(path.join(f.root, pkg.packagePath), { recursive: true });
  await ensurePackage(f.root, pkg);
  assert.equal(await treeDigest(path.join(f.root, pkg.packagePath)), pkg.artifactHash);
  assert.equal(await readFile(path.join(f.root, pkg.genericSkillPath, 'upstream/shared/guide.md'), 'utf8'), '# Shared resource\nOriginal content.\n');
  await rm(path.join(f.root, pkg.packagePath), { recursive: true });
  await assert.rejects(ensurePackage(f.root, { ...pkg, artifactHash: '0'.repeat(64) }), /does not match the lock/);
  assert.equal(await exists(path.join(f.root, pkg.packagePath)), false);
});

test('Codex preview metadata exposes source, skill count and inventory without materializing resources', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await sync(f.root, { checkout: f.checkout, publishDsh: true, publish: async () => sha(91) });
  const pkg = (await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'))).packages[0];
  await rm(path.join(f.root, pkg.packagePath), { recursive: true });
  const market = await readJson<{ plugins: { interface: { shortDescription: string; longDescription: string } }[] }>(path.join(f.root, '.agents/plugins/marketplace.json'));
  const preview = market.plugins[0].interface;
  assert.ok(preview.shortDescription.startsWith('1 项技能'));
  assert.ok(preview.longDescription.includes('来源：test/source-0'));
  assert.ok(preview.longDescription.includes('- example-0：A test workflow'));
  assert.equal(await exists(path.join(f.root, pkg.packagePath)), false);
});

test('DSH publication writes a separate branch commit and keeps old package trees reachable', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await writeText(path.join(f.upstream[0], 'shared/guide.md'), '# Original CRLF resource\r\nKeep exact bytes.\r\n');
  await sync(f.root, { checkout: f.checkout });
  await git(['init', '--quiet', '--initial-branch=main'], f.root);
  await writeText(path.join(f.root, '.gitignore'), '.cache/\n.sync-stage/\nnode_modules/\n');
  await git(['add', '--all'], f.root);
  await git(['-c', 'user.name=Test', '-c', 'user.email=test@example.test', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Initial fixture'], f.root);
  const bare = path.join(f.root, '.cache/remote.git'); await mkdir(bare, { recursive: true });
  await git(['init', '--bare', '--quiet'], bare);
  await git(['remote', 'add', 'fixture', bare], f.root);
  let catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const locate = (pkg: PackageRecord): string => path.join(f.root, pkg.packagePath);
  const first = await publishDsh(f.root, f.config, catalog.packages, locate, { remote: 'fixture', push: false });
  await git(['push', '--quiet', 'fixture', first + ':refs/heads/dist-dsh'], f.root);
  const manifestPath = catalog.packages[0].packagePath + '/package.json';
  assert.equal(JSON.parse(await git(['show', first + ':' + manifestPath], f.root)).version, '0.1.0');
  const guidePath = catalog.packages[0].genericSkillPath + '/upstream/shared/guide.md';
  assert.equal(await git(['show', first + ':' + guidePath], f.root), '# Original CRLF resource\r\nKeep exact bytes.\r\n');
  f.heads[0] = 10; await sync(f.root, { checkout: f.checkout });
  catalog = await readJson<Catalog>(path.join(f.root, 'catalog/catalog.json'));
  const second = await publishDsh(f.root, f.config, catalog.packages, locate, { remote: 'fixture', push: false });
  assert.notEqual(first, second);
  assert.equal((await git(['rev-parse', second + '^'], f.root)).trim(), first);
  assert.equal(JSON.parse(await git(['show', first + ':' + manifestPath], f.root)).version, '0.1.0');
  assert.equal(JSON.parse(await git(['show', second + ':' + manifestPath], f.root)).version, '0.1.1');
  assert.equal((await git(['branch', '--show-current'], f.root)).trim(), 'main');
});
