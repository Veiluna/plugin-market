import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { buildArtifacts, catalogMarkdown } from './adapters.ts';
import type { DshIndex } from './adapters.ts';
import { loadConfig } from './config.ts';
import { discoverPackages } from './discovery.ts';
import { digest, exists, inside, json, readJson, replaceDirectory, writeJson, writeText } from './fs.ts';
import { checkoutSource, resolveRemoteHead } from './git.ts';
import { ADAPTER_VERSION, buildPackage } from './package.ts';
import { publishDsh } from './publish.ts';
import { ensurePackage } from './bundles.ts';
import { validateArtifacts, validateEntryNames, validatePackage } from './validate.ts';
import type { PackageLocator } from './validate.ts';
import type { Catalog, CatalogLock, Checkout, LockedSource, MarketConfig, PackageRecord, SourceDefinition, SyncReport } from './types.ts';

export interface SyncOptions {
  dryRun?: boolean;
  publishDsh?: boolean;
  rebuild?: boolean;
  sourceIds?: string[];
  checkout?: (root: string, source: SourceDefinition) => Promise<Checkout>;
  publish?: (root: string, config: MarketConfig, packages: PackageRecord[], locate: PackageLocator) => Promise<string>;
  onProgress?: (message: string) => void;
}
export async function sync(root: string, options: SyncOptions = {}): Promise<SyncReport> {
  if (options.dryRun && options.publishDsh) throw new Error('--dry-run cannot publish a distribution branch');
  const { config, sources } = await loadConfig(root);
  if (options.sourceIds?.some(id => !sources.some(source => source.id === id))) throw new Error('Unknown selected source');
  const lockPath = path.join(root, 'catalog/lock.json');
  const previous: CatalogLock = await exists(lockPath) ? await readJson(lockPath) : { version: 1, sources: {} };
  for (const source of Object.values(previous.sources)) for (const pkg of source.packages) await ensurePackage(root, pkg);
  const lock: CatalogLock = { version: 1, sources: {} };
  const report: SyncReport = { changed: [], unchanged: [], failed: [] };
  const stage = path.join(root, '.sync-stage', randomUUID());
  await mkdir(stage, { recursive: true });
  const staged = new Set<string>();
  const locate: PackageLocator = pkg => inside(staged.has(pkg.sourceId) ? stage : root, pkg.packagePath);
  try {
    for (const source of sources) {
      const old = previous.sources[source.id];
      if (options.sourceIds && !options.sourceIds.includes(source.id)) { if (old) lock.sources[source.id] = old; continue; }
      options.onProgress?.('Checking ' + source.id);
      try {
        const definitionDigest = digest(json(source) + ADAPTER_VERSION);
        const head = options.checkout ? await options.checkout(root, source) : await resolveRemoteHead(root, source);
        if (!options.rebuild && old?.sha === head.sha && old.branch === head.branch && old.definitionDigest === definitionDigest && (await Promise.all(old.packages.map(pkg => exists(inside(root, pkg.packagePath))))).every(Boolean)) {
          lock.sources[source.id] = old;
          report.unchanged.push(source.id);
          continue;
        }
        const checkout = 'directory' in head ? head as Checkout : await checkoutSource(root, source, head);
        const definitions = await discoverPackages(source, checkout.directory);
        const packages: PackageRecord[] = [];
        for (const definition of definitions) {
          const built = await buildPackage(source, definition, checkout.directory, checkout.sha, stage, config, old?.packages.find(pkg => pkg.id === definition.id));
          await validatePackage(built, inside(stage, built.packagePath));
          packages.push(built);
        }
        const others = sources.filter(item => item.id !== source.id).flatMap(item => (lock.sources[item.id] || previous.sources[item.id])?.packages || []);
        validateEntryNames([...others, ...packages]);
        lock.sources[source.id] = { repository: source.repository, branch: checkout.branch, sha: checkout.sha, definitionDigest, packages };
        staged.add(source.id);
        report.changed.push(source.id);
        options.onProgress?.('Built ' + source.id + ': ' + packages.length + ' packages');
      } catch (error) {
        if (old) lock.sources[source.id] = old;
        report.failed.push({ id: source.id, error: error instanceof Error ? error.message : String(error) });
        options.onProgress?.('Retained last good version of ' + source.id + ': ' + report.failed.at(-1)!.error);
      }
    }
    const catalog: Catalog = {
      version: 1, name: config.name, description: config.title,
      sources: sources.map(source => {
        const locked = lock.sources[source.id];
        const failure = report.failed.find(item => item.id === source.id);
        return { id: source.id, repository: source.repository, ...(source.family ? { family: source.family } : {}), license: source.license, ...(locked ? { sha: locked.sha } : {}), status: locked ? 'ready' : 'unavailable', ...(failure ? { error: failure.error } : !locked ? { error: 'Not synchronized yet' } : {}) };
      }),
      packages: Object.values(lock.sources).flatMap(source => source.packages).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    };
    const previousDsh = await exists(path.join(root, 'dsh/index.json')) ? await readJson<DshIndex>(path.join(root, 'dsh/index.json')) : undefined;
    let artifacts = buildArtifacts(config, catalog, lock, previousDsh);
    await validateArtifacts(artifacts, catalog.packages, locate);
    if (options.publishDsh) {
      options.onProgress?.('Publishing DSH bundles before the index');
      const commit = await (options.publish || publishDsh)(root, config, catalog.packages, locate);
      for (const pkg of catalog.packages) pkg.distribution = { repository: config.repository, commit, path: pkg.packagePath };
      artifacts = buildArtifacts(config, catalog, lock, previousDsh, commit);
      await validateArtifacts(artifacts, catalog.packages, locate);
    }
    if (!options.dryRun) {
      // All source builds and the complete set of indexes have passed validation before replacing any live files.
      for (const id of staged) {
        const current = lock.sources[id].packages;
        for (const pkg of current) await replaceDirectory(inside(stage, pkg.packagePath), inside(root, pkg.packagePath));
        for (const old of previous.sources[id]?.packages || []) {
          if (!current.some(pkg => pkg.packagePath === old.packagePath)) await rm(inside(root, old.packagePath), { recursive: true, force: true });
        }
      }
      for (const [id, old] of Object.entries(previous.sources)) if (!sources.some(source => source.id === id)) {
        for (const pkg of old.packages) await rm(inside(root, pkg.packagePath), { recursive: true, force: true });
      }
      for (const [file, value] of Object.entries(artifacts)) {
        const destination = inside(root, file);
        const content = json(value);
        if (await exists(destination) && await readFile(destination, 'utf8') === content) continue;
        const temporary = destination + '.next';
        await writeText(temporary, content);
        await rename(temporary, destination);
      }
      const doc = catalogMarkdown(catalog, config);
      const docPath = path.join(root, 'docs/CATALOG.md');
      if (!await exists(docPath) || await readFile(docPath, 'utf8') !== doc) await writeText(docPath, doc);
    }
    await writeJson(path.join(root, '.cache/sync-report.json'), report);
    return report;
  } finally { await rm(stage, { recursive: true, force: true }); }
}
