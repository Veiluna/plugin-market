import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { copyChecked, writeJson, writeText } from './fs.ts';
import { git } from './git.ts';
import type { PackageLocator } from './validate.ts';
import type { MarketConfig, PackageRecord } from './types.ts';

export async function publishDsh(root: string, config: MarketConfig, packages: PackageRecord[], locate: PackageLocator, options: { push?: boolean; remote?: string } = {}): Promise<string> {
  const remote = options.remote || 'origin';
  if (options.remote && options.push !== false) throw new Error('A custom publication remote is only allowed in local verification');
  const origin = (await git(['remote', 'get-url', remote], root)).trim();
  if (!options.remote) {
    const repository = origin.replace(/^https:\/\/(?:[^@/]+@)?github\.com\//, '').replace(/^git@github\.com:/, '').replace(/\.git$/, '');
    if (repository.toLowerCase() !== config.repository.toLowerCase()) throw new Error('Publication origin differs from market.config.json; update repository metadata before publishing');
  }
  const reference = 'refs/heads/' + config.distributionBranch;
  const advertised = (await git(['ls-remote', '--heads', remote, reference], root)).trim();
  let base = (await git(['rev-parse', 'HEAD'], root)).trim();
  if (advertised) {
    await git(['fetch', '--quiet', remote, reference], root);
    base = (await git(['rev-parse', 'FETCH_HEAD'], root)).trim();
  }
  const cache = path.join(root, '.cache');
  await mkdir(cache, { recursive: true });
  const worktree = await mkdtemp(path.join(cache, 'dsh-publish-'));
  const hooks = path.join(cache, 'empty-hooks');
  await mkdir(hooks, { recursive: true });
  let attached = false;
  try {
    await git(['-c', 'core.hooksPath=' + hooks, 'worktree', 'add', '--quiet', '--detach', worktree, base], root);
    attached = true;
    for (const entry of await readdir(worktree)) if (entry !== '.git') await rm(path.join(worktree, entry), { recursive: true, force: true });
    const eligible = packages;
    for (const pkg of eligible) await copyChecked(locate(pkg), path.join(worktree, pkg.packagePath), locate(pkg));
    await writeText(path.join(worktree, '.gitattributes'), 'p/** -text\n');
    await writeJson(path.join(worktree, 'distribution.json'), { version: 1, marketplace: config.repository, packages: eligible.map(pkg => ({ id: pkg.id, path: pkg.packagePath, version: pkg.distributionVersion, upstreamCommit: pkg.sha, artifactHash: pkg.artifactHash })) });
    await writeText(path.join(worktree, 'README.md'), '# Scientific Agent Market — DSH bundles\n\nGenerated distribution branch. Source, licenses and PROVENANCE.json accompany every bundle.\nVersion history remains reachable through ordinary Git commits. Do not force-push this branch.\n');
    await git(['add', '--force', '--all'], worktree);
    // Do not publish a tree whose Git attributes silently changed locked resource bytes.
    const entries = (await git(['ls-files', '--stage', '-z', '--', 'p'], worktree)).split('\0').filter(Boolean);
    for (const entry of entries) {
      const separator = entry.indexOf('\t');
      const expected = entry.slice(0, separator).split(' ')[1];
      const file = entry.slice(separator + 1);
      const bytes = await readFile(path.join(worktree, file));
      const actual = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
      if (actual !== expected) throw new Error('Git attributes changed a locked distribution resource: ' + file);
    }
    const changed = (await git(['diff', '--cached', '--name-only'], worktree)).trim();
    if (changed) await git(['-c', 'core.hooksPath=' + hooks, '-c', 'user.name=scientific-market[bot]', '-c', 'user.email=scientific-market@users.noreply.github.com', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Publish verified DSH skill bundles'], worktree);
    const commit = (await git(['rev-parse', 'HEAD'], worktree)).trim();
    if (options.push !== false && (changed || !advertised)) await git(['push', '--porcelain', remote, commit + ':' + reference], root);
    return commit;
  } finally {
    if (attached) await git(['worktree', 'remove', '--force', worktree], root);
    else await rm(worktree, { recursive: true, force: true });
  }
}
