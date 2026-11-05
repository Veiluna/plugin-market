import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { x as extract } from 'tar';
import { exists, inside, replaceDirectory, safeRelative, treeDigest } from './fs.ts';
import { git } from './git.ts';
import type { PackageRecord } from './types.ts';

// The public default branch contains metadata. Materialize immutable bundles only in an ignored cache.
export async function ensurePackage(root: string, pkg: PackageRecord): Promise<string> {
  const destination = inside(root, pkg.packagePath);
  if (await exists(destination)) return destination;
  const source = pkg.distribution;
  if (!source || !/^[\w.-]+\/[\w.-]+$/.test(source.repository) || !/^[a-f0-9]{40}$/.test(source.commit) || safeRelative(source.path) !== pkg.packagePath) throw new Error('Missing published bundle reference: ' + pkg.id);
  const cache = path.join(root, '.cache/bundle-repository');
  await mkdir(cache, { recursive: true });
  if (!await exists(path.join(cache, 'HEAD'))) await git(['init', '--bare', '--quiet'], cache);
  try { await git(['cat-file', '-e', source.commit + '^{commit}'], cache); }
  catch { await git(['fetch', '--quiet', '--depth=1', 'https://github.com/' + source.repository + '.git', source.commit], cache); }
  const stage = await mkdtemp(path.join(root, '.cache/bundle-extract-'));
  try {
    const archive = path.join(stage, 'bundle.tar');
    const payload = path.join(stage, 'payload');
    await mkdir(payload);
    await git(['archive', '--format=tar', '--output=' + archive, source.commit, source.path], cache);
    const prefix = source.path + '/';
    await extract({ file: archive, cwd: payload, strip: source.path.split('/').length, strict: true, filter(file, entry) {
      if (!('type' in entry)) throw new Error('Invalid distribution archive entry');
      if (entry.type === 'Directory' && prefix.startsWith(file) && file !== prefix) return false;
      if (entry.type === 'SymbolicLink' || entry.type === 'Link' || !file.startsWith(prefix)) throw new Error('Unsafe distribution archive entry: ' + file);
      safeRelative(file);
      return true;
    } });
    if (await treeDigest(payload) !== pkg.artifactHash) throw new Error('Published bundle does not match the lock: ' + pkg.id);
    await replaceDirectory(payload, destination);
    return destination;
  } finally { await rm(stage, { recursive: true, force: true }); }
}
