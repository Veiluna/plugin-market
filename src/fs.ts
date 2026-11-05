import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { JsonObject } from './types.ts';

export const AGENTS = ['codex', 'claude-code', 'cursor', 'dsh', 'universal'] as const;
export function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' must be an object');
  return value as JsonObject;
}
export function nonempty(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(label + ' must be a nonempty string');
  return value;
}
export function safeRelative(value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '');
  if (path.posix.isAbsolute(normalized) || /^[a-z]:/i.test(normalized) || normalized.split('/').includes('..') || normalized.includes('\0')) throw new Error('Unsafe relative path: ' + value);
  return path.posix.normalize(normalized || '.');
}
export function inside(root: string, relative: string): string {
  return path.join(root, safeRelative(relative));
}
export function posix(value: string): string { return value.split(path.sep).join('/'); }
export async function exists(file: string): Promise<boolean> {
  try { await lstat(file); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}
export async function readJson<T = JsonObject>(file: string): Promise<T> { return JSON.parse(await readFile(file, 'utf8')) as T; }
export function json(value: unknown): string { return JSON.stringify(value, null, 2) + '\n'; }
export async function writeText(file: string, content: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}
export async function writeJson(file: string, value: unknown): Promise<void> { await writeText(file, json(value)); }
export function digest(value: string | Buffer): string { return createHash('sha256').update(value).digest('hex'); }
export function slug(value: string): string {
  const clean = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!clean) throw new Error('Cannot create identifier from ' + value);
  return clean.length <= 58 ? clean : clean.slice(0, 47) + '-' + digest(value).slice(0, 10);
}
export function nextVersion(previous?: string): string {
  if (!previous) return '0.1.0';
  if (!/^\d+\.\d+\.\d+$/.test(previous)) throw new Error('Invalid distribution version: ' + previous);
  const [major, minor, patch] = previous.split('.').map(Number);
  return [major, minor, patch + 1].join('.');
}
export async function filesUnder(root: string): Promise<string[]> {
  const result: string[] = [];
  async function visit(directory: string): Promise<void> {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.cache' || entry.name === '__pycache__') continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(full);
      else result.push(posix(path.relative(root, full)));
    }
  }
  await visit(root);
  return result;
}
export async function copyChecked(source: string, destination: string, boundary: string, ancestry = new Set<string>()): Promise<void> {
  const resolved = await realpath(source);
  const root = await realpath(boundary);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error('Symlink escapes package: ' + source);
  if (ancestry.has(resolved)) throw new Error('Symlink cycle: ' + source);
  const stat = await lstat(resolved);
  if (stat.isDirectory()) {
    const next = new Set(ancestry).add(resolved);
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(resolved)) {
      if (['.git', 'node_modules', '.cache', '__pycache__'].includes(entry)) continue;
      await copyChecked(path.join(resolved, entry), path.join(destination, entry), root, next);
    }
  } else if (stat.isFile()) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(resolved), { mode: stat.mode & 0o777 });
  } else throw new Error('Unsupported file type: ' + source);
}
export async function treeDigest(root: string, exclusions: string[] = []): Promise<string> {
  const hash = createHash('sha256');
  for (const file of await filesUnder(root)) {
    if (exclusions.includes(file)) continue;
    hash.update(file + '\0');
    const full = inside(root, file);
    // Content hashes must survive Windows checkouts without POSIX executable bits.
    hash.update(await readFile(full));
    hash.update('\0');
  }
  return hash.digest('hex');
}
export async function replaceDirectory(source: string, target: string): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  const old = target + '.previous';
  await rm(old, { recursive: true, force: true });
  const hadTarget = await exists(target);
  if (hadTarget) await rename(target, old);
  try { await rename(source, target); } catch (error) { if (hadTarget) await rename(old, target); throw error; }
  await rm(old, { recursive: true, force: true });
}
