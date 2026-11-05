import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { installSkills } from '../src/install.ts';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const project = path.resolve(process.argv[2] || path.join(root, '.cache/verification/cloud-project'));
const binary = process.env.MARKET_CODEX_BINARY || 'codex';
const config = JSON.parse(await readFile(path.join(root, 'market.config.json'), 'utf8'));
const override = 'marketplaces.' + config.name + '={source_type="local",source=' + JSON.stringify(root) + '}';
const version = (await exec(binary, ['--version'])).stdout.trim();
const listing = JSON.parse((await exec(binary, ['-c', override, 'plugin', 'list', '--available', '--marketplace', config.name, '--json'], { cwd: root, maxBuffer: 8 * 1024 * 1024 })).stdout);
const available = listing.available || [];
const expected = JSON.parse(await readFile(path.join(root, '.agents/plugins/marketplace.json'), 'utf8')).plugins;
assert.equal(available.length, expected.length, 'Codex must discover every applicable marketplace entry');
await mkdir(project, { recursive: true });
await exec('git', ['init', '--quiet'], { cwd: project });
await installSkills(root, 'research-paper-writing', { agent: 'codex', cloud: true, target: project, update: true });

const state = path.join(root, '.cache/verification/codex-state');
await mkdir(state, { recursive: true });
const verificationProfile = await mkdtemp(path.join(root, '.cache/verification/codex-profile-'));
const nativeProject = path.join(verificationProfile, 'native-project');
await mkdir(nativeProject, { recursive: true });
await exec('git', ['init', '--quiet'], { cwd: nativeProject });
const profileEnvironment = { ...process.env, CODEX_HOME: verificationProfile };
await exec(binary, ['-c', override, 'plugin', 'add', 'research-paper-writing@' + config.name, '--json'], { cwd: root, env: profileEnvironment, maxBuffer: 8 * 1024 * 1024 });
// Configure this child Codex's actual profile directory; the parent session's profile is untouched.
const child = spawn(binary, ['-c', override, '-c', 'sqlite_home=' + JSON.stringify(state), '-c', 'log_dir=' + JSON.stringify(state), 'app-server'], { cwd: project, env: profileEnvironment, stdio: ['pipe', 'pipe', 'pipe'] });
const pending = new Map();
let nextId = 0;
let buffer = '';
let stderr = '';
child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-4000); });
child.on('error', error => { for (const operation of pending.values()) operation.reject(error); pending.clear(); });
child.on('close', () => { for (const operation of pending.values()) operation.reject(new Error('Codex app-server closed before replying: ' + stderr)); pending.clear(); });
child.stdout.on('data', chunk => {
  buffer += chunk.toString();
  while (buffer.includes('\n')) {
    const position = buffer.indexOf('\n');
    const line = buffer.slice(0, position); buffer = buffer.slice(position + 1);
    if (!line.trim()) continue;
    let message; try { message = JSON.parse(line); } catch { continue; }
    if (message.id !== undefined && pending.has(message.id)) {
      const operation = pending.get(message.id); pending.delete(message.id);
      if (message.error) operation.reject(new Error(JSON.stringify(message.error)));
      else operation.resolve(message.result);
    }
  }
});
function request(method, params) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Timeout waiting for ' + method)); }, 20000);
    pending.set(id, { resolve: result => { clearTimeout(timeout); resolve(result); }, reject: error => { clearTimeout(timeout); reject(error); } });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
  });
}
let report;
try {
  await request('initialize', { clientInfo: { name: 'scientific-market-verifier', version: '0.1.0' }, capabilities: { experimentalApi: true } });
  child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
  const response = await request('skills/list', { cwds: [project, nativeProject], forceReload: true });
  await writeFile(path.join(root, '.cache/verification/codex-skills-debug.json'), JSON.stringify(response, null, 2));
  const data = response.data || [];
  const nativeSkills = (data.find(entry => entry.cwd === nativeProject)?.skills || []);
  const nativeSkill = nativeSkills.find(entry => entry.name === 'research-paper-writing:research-paper-writing');
  assert.ok(nativeSkill, 'Codex must load the skill from the installed native plugin');
  assert.ok((await readFile(nativeSkill.path, 'utf8')).length > 0);
  const skills = data.flatMap(entry => entry.skills || []);
  const skill = skills.find(entry => entry.name === 'research-paper-writing-suite' && String(entry.path).startsWith(project + path.sep));
  assert.ok(skill, 'Installed project skill must be visible in real Codex skills/list');
  const installed = path.dirname(await realpath(skill.path));
  assert.ok(installed.startsWith(await realpath(project) + path.sep));
  const router = await readFile(skill.path, 'utf8');
  assert.match(router, /upstream\//);
  const original = path.join(installed, 'upstream/research-paper-writing');
  assert.ok((await readFile(path.join(original, 'SKILL.md'), 'utf8')).length > 0);
  const references = await readdir(path.join(original, 'references'), { recursive: true });
  const reference = references.find(file => file.endsWith('.md'));
  assert.ok(reference, 'Original references must accompany the skill');
  assert.ok((await readFile(path.join(original, 'references', reference), 'utf8')).length > 0);
  report = { client: version, marketplaceEntriesDiscovered: available.length, nativePluginInstalled: true, nativePluginSkillDiscovered: nativeSkill.name, projectSkillDiscovered: skill.name, originalInstructionsReadable: true, originalReferenceReadable: true, sourceCommit: JSON.parse(await readFile(path.join(installed, 'UPSTREAM.json'), 'utf8')).commit, verification: 'native-install-metadata-discovery-and-resource-loading', modelRequests: 0 };
} finally { child.stdin.end(); child.kill('SIGTERM'); }
await mkdir(path.join(root, '.cache/verification'), { recursive: true });
await writeFile(path.join(root, '.cache/verification/codex.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
