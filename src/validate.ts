import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { adapters, entryName } from './adapters.ts';
import type { DshIndex } from './adapters.ts';
import { readSkill } from './discovery.ts';
import { AGENTS, exists, inside, object, readJson, safeRelative, treeDigest } from './fs.ts';
import { loadConfig } from './config.ts';
import { probeDshBundle } from './dsh.ts';
import type { Catalog, CatalogLock, JsonObject, PackageRecord } from './types.ts';

export type PackageLocator = (pkg: PackageRecord) => string;
export function validateEntryNames(packages: PackageRecord[]): void {
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const pkg of packages) {
    if (ids.has(pkg.id)) throw new Error('Duplicate package id: ' + pkg.id);
    ids.add(pkg.id);
    if (paths.has(pkg.packagePath)) throw new Error('Duplicate package storage path: ' + pkg.packagePath);
    paths.add(pkg.packagePath);
  }
  for (const agent of AGENTS) {
    const names = new Set<string>();
    for (const pkg of packages) {
      if (pkg.compatibility[agent].level === 'unsupported') continue;
      const name = entryName(pkg, agent);
      if (names.has(name)) throw new Error('Duplicate ' + agent + ' plugin name: ' + name);
      names.add(name);
    }
  }
}
export function validateDsh(index: DshIndex): void {
  if (index.format !== 1 || !index.title?.en || !Array.isArray(index.plugins)) throw new Error('Invalid DSH index');
  const names = new Set<string>();
  for (const plugin of index.plugins) {
    if (names.has(plugin.name) || !/^dsh-sam-[a-z0-9-]+$/.test(plugin.name)) throw new Error('Invalid or duplicate DSH name');
    names.add(plugin.name);
    if (!plugin.versions.length) throw new Error('DSH plugin has no published version');
    const versions = new Set<string>();
    for (const version of plugin.versions) {
      if (!/^\d+\.\d+\.\d+$/.test(version.version) || versions.has(version.version)) throw new Error('Invalid or duplicate DSH version');
      versions.add(version.version);
      if (!Number.isInteger(version.publishTimestamp) || version.publishTimestamp <= 0) throw new Error('Invalid DSH publication timestamp');
      if (version.source.type !== 'git' || !/^[a-f0-9]{40}$/.test(version.source.commit) || !/^https:\/\/github.com\/[\w.-]+\/[\w.-]+$/.test(version.source.url)) throw new Error('DSH source must point to a pinned GitHub commit');
      safeRelative(version.source.path);
    }
  }
}
export async function validatePackage(pkg: PackageRecord, directory: string): Promise<void> {
  if (!/^[a-f0-9]{40}$/.test(pkg.sha) || !/^[a-f0-9]{64}$/.test(pkg.digest)) throw new Error('Unpinned package: ' + pkg.id);
  if (await treeDigest(directory) !== pkg.artifactHash) throw new Error('Package files differ from the locked artifact: ' + pkg.id);
  const provenance = await readJson<JsonObject>(path.join(directory, 'PROVENANCE.json'));
  if (provenance.commit !== pkg.sha || provenance.digest !== pkg.digest || provenance.distributionVersion !== pkg.distributionVersion) throw new Error('Provenance mismatch: ' + pkg.id);
  const router = safeRelative(path.posix.relative(pkg.packagePath, pkg.genericSkillPath));
  const entry = await readSkill(directory, router);
  if (entry.name !== (pkg.genericSkillName || pkg.id)) throw new Error('Router identity mismatch');
  for (const agent of ['codex', 'claude-code', 'cursor'] as const) {
    const file = agent === 'codex' ? '.codex-plugin/plugin.json' : agent === 'claude-code' ? '.claude-plugin/plugin.json' : '.cursor-plugin/plugin.json';
    const manifest = await readJson<JsonObject>(path.join(directory, file));
    if (manifest.name !== pkg.id || manifest.version !== pkg.distributionVersion || !Array.isArray(manifest.skills) || !manifest.skills.length) throw new Error('Invalid generated ' + agent + ' manifest for ' + pkg.id);
    for (const skillPath of manifest.skills) await readSkill(directory, safeRelative(String(skillPath)));
  }
  const dsh = await readJson<JsonObject>(path.join(directory, 'package.json'));
  if (dsh.name !== 'dsh-sam-' + pkg.id || dsh.version !== pkg.distributionVersion || !object(dsh.dsh, 'dsh').bundle) throw new Error('Invalid DSH bundle');
  for (const file of ['dsh/index.mjs', 'dsh/cordis.patch.yml']) if (!await exists(path.join(directory, file))) throw new Error('Missing DSH component: ' + file);
  if (!(await readFile(path.join(directory, 'dsh/cordis.patch.yml'), 'utf8')).startsWith('- insert:')) throw new Error('Unexpected DSH patch');
  if (pkg.compatibility.dsh.level !== 'unsupported') await probeDshBundle(directory, pkg.skills.map(skill => skill.name));
}
export async function validateArtifacts(artifacts: Record<string, unknown>, packages: PackageRecord[], locate: PackageLocator): Promise<void> {
  validateEntryNames(packages);
  for (const pkg of packages) await validatePackage(pkg, locate(pkg));
  for (const agent of ['codex', 'claude-code', 'cursor'] as const) {
    const file = adapters[agent].marketplacePath!;
    const manifest = object(artifacts[file], file);
    if (!manifest.name || !Array.isArray(manifest.plugins)) throw new Error('Invalid marketplace: ' + file);
    const expected = packages.filter(pkg => pkg.compatibility[agent].level !== 'unsupported');
    if (manifest.plugins.length !== expected.length) throw new Error('Incomplete marketplace: ' + file);
    for (const item of manifest.plugins) {
      const entry = object(item, 'entry');
      const pkg = expected.find(pkg => entryName(pkg, agent) === entry.name);
      if (!pkg) throw new Error('Unknown marketplace plugin: ' + String(entry.name));
      if (typeof entry.source === 'string') {
        if (safeRelative(entry.source) !== pkg.packagePath) throw new Error('Incorrect local plugin path');
      } else {
        const source = object(entry.source, 'source');
        if (source.source === 'local') { if (safeRelative(String(source.path)) !== pkg.packagePath) throw new Error('Incorrect local plugin path'); }
        else if (!/^[a-f0-9]{40}$/.test(String(source.sha))) throw new Error('Unpinned remote plugin source');
      }
    }
  }
  validateDsh(artifacts['dsh/index.json'] as DshIndex);
}
export async function validateRepository(root: string): Promise<{ sources: number; packages: number; pendingDsh: number }> {
  const { config, sources } = await loadConfig(root);
  const catalog = await readJson<Catalog>(path.join(root, 'catalog/catalog.json'));
  const lock = await readJson<CatalogLock>(path.join(root, 'catalog/lock.json'));
  if (catalog.version !== 1 || lock.version !== 1 || catalog.name !== config.name) throw new Error('Invalid catalog or lock format');
  if (catalog.sources.length !== sources.length || !sources.every(source => catalog.sources.some(item => item.id === source.id))) throw new Error('Catalog does not cover configured sources');
  const locked = Object.values(lock.sources).flatMap(source => source.packages);
  if (JSON.stringify(locked.sort((a, b) => a.id.localeCompare(b.id, 'en'))) !== JSON.stringify([...catalog.packages].sort((a, b) => a.id.localeCompare(b.id, 'en')))) throw new Error('Catalog differs from locked packages');
  const artifacts: Record<string, unknown> = {};
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json', '.cursor-plugin/marketplace.json', 'dsh/index.json']) artifacts[file] = await readJson(inside(root, file));
  await validateArtifacts(artifacts, catalog.packages, pkg => inside(root, pkg.packagePath));
  const pending = await readJson<{ packages: string[] }>(path.join(root, 'dsh/pending.json'));
  return { sources: sources.length, packages: catalog.packages.length, pendingDsh: pending.packages.length };
}
