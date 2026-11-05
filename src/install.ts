import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, realpath, rename, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { adapters } from './adapters.ts';
import { loadConfig } from './config.ts';
import { copyChecked, exists, inside, readJson, safeRelative, treeDigest, writeJson } from './fs.ts';
import { git } from './git.ts';
import { readSkill } from './discovery.ts';
import { validatePackage } from './validate.ts';
import { ensurePackage } from './bundles.ts';
import type { AgentId, Catalog, MarketConfig, PackageRecord } from './types.ts';

const exec = promisify(execFile);
const receiptFile = '.scientific-market-install.json';
export interface InstallOptions {
  agent: AgentId;
  target?: string;
  scope?: 'project' | 'user';
  skillsDir?: string;
  cloud?: boolean;
  dryRun?: boolean;
  update?: boolean;
  force?: boolean;
  runner?: (source: string, stage: string, pkg: PackageRecord, config: MarketConfig) => Promise<void>;
}
interface Receipt { installer: string; repository: string; packageId: string; sha: string; distributionVersion: string; installedHash: string }

async function runSkillsCli(source: string, stage: string, pkg: PackageRecord, config: MarketConfig, root: string): Promise<void> {
  const npm = process.env.npm_execpath;
  if (!npm && process.platform === 'win32') throw new Error('On Windows, run this command through npm run market');
  const cache = path.join(root, '.cache/npm');
  const args = ['--cache', cache, 'exec', '--yes', '--package=skills@' + config.skillsCliVersion, '--', 'skills', 'add', source, '--skill', pkg.genericSkillName || pkg.id, '--agent', 'universal', '--copy', '--yes'];
  const executable = npm ? process.execPath : 'npm';
  const argv = npm ? [npm, ...args] : args;
  await exec(executable, argv, { cwd: stage, timeout: 180_000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, npm_config_cache: cache, npm_config_ignore_scripts: 'true', CI: '1' } });
}

async function checkDestination(root: string, target: string): Promise<void> {
  const boundary = await realpath(root);
  let ancestor = path.dirname(target);
  while (!await exists(ancestor)) ancestor = path.dirname(ancestor);
  const resolved = await realpath(ancestor);
  if (resolved !== boundary && !resolved.startsWith(boundary + path.sep)) throw new Error('Target skills directory escapes the selected project or user root through a symlink');
  if (await exists(target) && (await lstat(target)).isSymbolicLink()) throw new Error('Refusing to replace a symlinked skill directory');
}

export async function installSkills(root: string, packageId: string, options: InstallOptions): Promise<{ packageId: string; sha: string; target: string; dryRun: boolean }> {
  const { config } = await loadConfig(root);
  const catalog = await readJson<Catalog>(path.join(root, 'catalog/catalog.json'));
  const pkg = catalog.packages.find(pkg => pkg.id === packageId);
  if (!pkg) throw new Error('Unknown package: ' + packageId);
  const adapter = adapters[options.agent];
  if (!adapter) throw new Error('Unknown agent; use universal with --skills-dir for another host');
  if (pkg.compatibility[options.agent].level === 'unsupported') throw new Error(pkg.compatibility[options.agent].reason);
  const scope = options.scope || 'project';
  if (options.cloud && (options.agent !== 'codex' || scope !== 'project')) throw new Error('Codex Cloud installation must be project-scoped for agent codex');
  if (options.cloud && pkg.cloud === 'unsupported') throw new Error('This package requires a local runtime and is unavailable in Codex Cloud');
  if (scope === 'project' && !options.target) throw new Error('Project installation requires --target /path/to/project');
  const targetRoot = scope === 'project' ? path.resolve(options.target!) : homedir();
  if (!await exists(targetRoot)) throw new Error('Target root does not exist: ' + targetRoot);
  const skillsDirectory = options.skillsDir ? safeRelative(options.skillsDir) : scope === 'project' ? adapter.projectSkills : adapter.userSkills;
  if (!skillsDirectory) throw new Error('This agent has no user-level Skills path');
  const skillName = pkg.genericSkillName || pkg.id;
  const target = inside(targetRoot, path.posix.join(skillsDirectory, skillName));
  await checkDestination(targetRoot, target);
  const source = inside(root, pkg.genericSkillPath);
  await ensurePackage(root, pkg);
  await validatePackage(pkg, inside(root, pkg.packagePath));
  const sourceHash = await treeDigest(source);
  if (await exists(target) && !options.force) {
    const receiptPath = path.join(target, receiptFile);
    if (!options.update || !await exists(receiptPath)) throw new Error('Target exists. Use --update for an unmodified managed install, or explicitly --force to replace it: ' + target);
    const receipt = await readJson<Receipt>(receiptPath);
    if (receipt.installer !== config.name || receipt.repository !== config.repository || receipt.packageId !== pkg.id) throw new Error('Target belongs to a different installer or package');
    if (await treeDigest(target, [receiptFile]) !== receipt.installedHash) throw new Error('Local skill files have changed; preserving them. Use --force only if replacement is intended.');
  }
  const result = { packageId, sha: pkg.sha, target, dryRun: !!options.dryRun };
  if (options.dryRun) return result;
  const stage = await mkdtemp(path.join(tmpdir(), 'scientific-market-install-'));
  let prepared: string | undefined;
  let backup: string | undefined;
  try {
    await git(['init', '--quiet'], stage);
    await (options.runner ? options.runner(source, stage, pkg, config) : runSkillsCli(source, stage, pkg, config, root));
    const stagedSkill = path.join(stage, '.agents/skills', skillName);
    const skill = await readSkill(stage, path.posix.join('.agents/skills', skillName));
    if (skill.name !== skillName || await treeDigest(stagedSkill) !== sourceHash) throw new Error('skills CLI did not copy the complete locked suite and resources');
    await mkdir(path.dirname(target), { recursive: true });
    prepared = target + '.new-' + randomUUID();
    await copyChecked(stagedSkill, prepared, stagedSkill);
    // A Skills-only installation must not be rediscovered as an entire native plugin.
    for (const generated of ['.codex-plugin', '.claude-plugin', '.cursor-plugin', 'package.json', 'dsh']) await rm(path.join(prepared, generated), { recursive: true, force: true });
    const installedHash = await treeDigest(prepared);
    await writeJson(path.join(prepared, receiptFile), { installer: config.name, repository: config.repository, packageId: pkg.id, sha: pkg.sha, distributionVersion: pkg.distributionVersion, installedHash } satisfies Receipt);
    if (await exists(target)) { backup = target + '.backup-' + randomUUID(); await rename(target, backup); }
    try { await rename(prepared, target); prepared = undefined; }
    catch (error) { if (backup) { await rename(backup, target); backup = undefined; } throw error; }
    if (backup) { await rm(backup, { recursive: true, force: true }); backup = undefined; }
    return result;
  } finally {
    await rm(stage, { recursive: true, force: true });
    if (prepared) await rm(prepared, { recursive: true, force: true });
    if (backup && !await exists(target)) await rename(backup, target);
  }
}
