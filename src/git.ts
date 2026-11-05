import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { exists, object, safeRelative } from './fs.ts';
import type { Checkout, SourceDefinition } from './types.ts';

const exec = promisify(execFile);
export async function git(args: string[], cwd: string, timeout = 180_000): Promise<string> {
  const result = await exec('git', args, { cwd, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  return result.stdout;
}
export function parseRemoteHead(output: string): { branch: string; sha: string } {
  const branch = output.match(/^ref: refs\/heads\/([^\r\n\t]+)\s+HEAD$/m)?.[1];
  const sha = output.match(/^([a-f0-9]{40})\s+HEAD$/m)?.[1];
  if (!branch || !sha) throw new Error('Remote must have a default branch and a full Git commit SHA');
  return { branch, sha };
}
export async function resolveRemoteHead(root: string, source: SourceDefinition): Promise<{ branch: string; sha: string }> {
  return parseRemoteHead(await git(['ls-remote', '--symref', 'https://github.com/' + source.repository + '.git', 'HEAD'], root));
}
export async function checkoutSource(root: string, source: SourceDefinition, resolved?: { branch: string; sha: string }): Promise<Checkout> {
  const url = 'https://github.com/' + source.repository + '.git';
  const head = resolved || await resolveRemoteHead(root, source);
  const directory = path.join(root, '.cache', 'upstream', source.id);
  await mkdir(directory, { recursive: true });
  const hooks = path.join(root, '.cache', 'empty-hooks');
  await mkdir(hooks, { recursive: true });
  if (!await exists(path.join(directory, '.git'))) {
    await git(['init', '--quiet'], directory);
    await git(['remote', 'add', 'origin', url], directory);
  } else await git(['remote', 'set-url', 'origin', url], directory);
  await git(['config', 'core.hooksPath', hooks], directory);
  await git(['config', 'core.autocrlf', 'false'], directory);
  await git(['config', 'remote.origin.promisor', 'true'], directory);
  await git(['config', 'remote.origin.partialclonefilter', 'blob:none'], directory);
  await git(['fetch', '--quiet', '--depth=1', '--filter=blob:none', 'origin', head.sha], directory);
  const tree = await git(['ls-tree', head.sha], directory);
  const directories = new Set(tree.split('\n').filter(line => line.startsWith('040000 tree ')).map(line => line.split('\t')[1]));
  const wanted = new Set(['.agents', '.codex-plugin', '.claude-plugin', '.cursor-plugin', 'plugins', 'skills']);
  const paths = [...source.resources];
  if (source.discovery.kind === 'plugin') paths.push(source.discovery.root);
  if (source.discovery.kind === 'skills') for (const group of source.discovery.packages) paths.push(...group.roots || [], ...group.containers || []);
  if (source.discovery.kind === 'marketplace') {
    paths.push(source.discovery.manifest);
    const manifest = object(JSON.parse(await git(['show', head.sha + ':' + safeRelative(source.discovery.manifest)], directory)), 'marketplace');
    if (!Array.isArray(manifest.plugins)) throw new Error('Upstream marketplace has no plugins array');
    for (const item of manifest.plugins) {
      const entry = object(item, 'plugin');
      if (typeof entry.source === 'string') paths.push(entry.source);
      else if (entry.source && typeof entry.source === 'object') {
        const src = object(entry.source, 'source');
        if (src.source === 'local' && typeof src.path === 'string') paths.push(src.path);
      }
      for (const component of ['skills', 'agents', 'commands']) {
        const values = entry[component];
        if (typeof values === 'string') paths.push(values);
        else if (Array.isArray(values)) for (const value of values) if (typeof value === 'string') paths.push(value);
      }
    }
  }
  for (const item of paths) { const first = safeRelative(item).split('/')[0]; if (first !== '.') wanted.add(first); }
  await git(['sparse-checkout', 'set', '--cone', '--skip-checks', ...[...wanted].filter(item => directories.has(item)).sort()], directory);
  // Only the disposable upstream cache is reset, never the user's project worktree.
  await git(['checkout', '--quiet', '--detach', '--force', head.sha], directory);
  await git(['clean', '-ffdx', '--quiet'], directory);
  return { ...head, directory };
}
