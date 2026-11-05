import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { exists, inside, nonempty, object, safeRelative, slug } from './fs.ts';
import type { AgentId, JsonObject, NativeSource, PackageDefinition, SkillRecord, SourceDefinition } from './types.ts';

export async function sourceFile(root: string, relative: string): Promise<string> {
  const file = inside(root, relative);
  const resolved = await realpath(file);
  const boundary = await realpath(root);
  if (resolved !== boundary && !resolved.startsWith(boundary + path.sep)) throw new Error('Source path escapes checkout: ' + relative);
  return resolved;
}
export function parseYaml(text: string, label: string): JsonObject {
  const document = parseDocument(text, { uniqueKeys: true });
  if (document.errors.length) throw new Error(label + ': ' + document.errors.map(error => error.message).join('; '));
  return object(document.toJS({ maxAliasCount: 100 }), label);
}
export async function readSkill(root: string, relative: string): Promise<SkillRecord> {
  const file = await sourceFile(root, path.posix.join(safeRelative(relative), 'SKILL.md'));
  const bytes = await readFile(file);
  if (bytes.length > 1024 * 1024) throw new Error('Skill exceeds 1 MiB: ' + relative);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!front) throw new Error('Missing YAML frontmatter: ' + relative);
  const metadata = parseYaml(front, relative);
  const name = nonempty(metadata.name, relative + ' name');
  const description = nonempty(metadata.description, relative + ' description');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(name)) throw new Error('Invalid skill name: ' + name + ' at ' + relative);
  const agentMetadata = path.posix.join(relative, 'agents/openai.yaml');
  if (await exists(inside(root, agentMetadata))) {
    const agent = parseYaml(await readFile(await sourceFile(root, agentMetadata), 'utf8'), agentMetadata);
    if (agent.policy !== undefined && agent.policy !== null) {
      const policy = object(agent.policy, agentMetadata + ' policy');
      const implicit = policy.allow_implicit_invocation;
      if (implicit !== undefined && implicit !== null && typeof implicit !== 'boolean') throw new Error('allow_implicit_invocation must be boolean: ' + agentMetadata);
    }
  }
  return { name, description: description.trim(), path: safeRelative(relative) };
}
export async function scanSkills(root: string, paths: string[]): Promise<SkillRecord[]> {
  const result = new Map<string, SkillRecord>();
  for (const relative of paths) {
    const normalized = safeRelative(relative);
    if (await exists(inside(root, path.posix.join(normalized, 'SKILL.md')))) {
      result.set(normalized, await readSkill(root, normalized));
      continue;
    }
    const directory = await sourceFile(root, normalized);
    if (!(await stat(directory)).isDirectory()) throw new Error('Skills path is not a directory: ' + relative);
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (entry.name.startsWith('.') || (!entry.isDirectory() && !entry.isSymbolicLink())) continue;
      const child = path.posix.join(normalized, entry.name);
      if (await exists(inside(root, path.posix.join(child, 'SKILL.md')))) result.set(child, await readSkill(root, child));
    }
  }
  const names = new Set<string>();
  for (const skill of result.values()) {
    if (names.has(skill.name)) throw new Error('Duplicate skill name in one package: ' + skill.name);
    names.add(skill.name);
  }
  return [...result.values()];
}
function resolveComponent(sourceRoot: string, component: string): string {
  if (path.posix.isAbsolute(component) || /^[a-z]:/i.test(component) || component.includes('\\')) throw new Error('Absolute component path: ' + component);
  return safeRelative(path.posix.join(sourceRoot, component));
}
async function manifestSkills(checkout: string, root: string, manifest: JsonObject): Promise<SkillRecord[]> {
  let values = manifest.skills;
  if (values === undefined) values = './skills';
  const paths = typeof values === 'string' ? [values] : Array.isArray(values) ? values.map(value => nonempty(value, 'skill path')) : [];
  if (!paths.length) throw new Error('Plugin must contain published skills');
  return scanSkills(checkout, paths.map(value => resolveComponent(root, value)));
}
async function nativeManifests(checkout: string, root: string): Promise<Partial<Record<AgentId, NativeSource>>> {
  const native: Partial<Record<AgentId, NativeSource>> = {};
  for (const [agent, relative] of [['codex', '.codex-plugin/plugin.json'], ['claude-code', '.claude-plugin/plugin.json'], ['cursor', '.cursor-plugin/plugin.json']] as const) {
    const candidate = path.posix.join(root, relative);
    if (await exists(inside(checkout, candidate))) native[agent] = { root, manifest: object(JSON.parse(await readFile(await sourceFile(checkout, candidate), 'utf8')), candidate) };
  }
  const portableFile = path.posix.join(root, 'plugin.json');
  if (await exists(inside(checkout, portableFile))) {
    const portable = object(JSON.parse(await readFile(await sourceFile(checkout, portableFile), 'utf8')), portableFile);
    if (portable.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') {
      for (const agent of ['codex', 'cursor'] as const) native[agent] ||= { root, manifest: portable };
    }
  }
  return native;
}
async function discoverPlugin(source: SourceDefinition, checkout: string, root: string, entry?: JsonObject): Promise<PackageDefinition> {
  const native = await nativeManifests(checkout, root);
  if (entry) {
    const agent: AgentId = source.discovery.kind === 'marketplace' && source.discovery.manifest.startsWith('.agents/') ? 'codex' : 'claude-code';
    native[agent] = { ...native[agent], root, entry };
  }
  const primary = native['claude-code'] || native.codex || native.cursor;
  if (!primary) throw new Error('No supported upstream manifest at ' + root);
  const primaryManifest = { ...primary.manifest, ...primary.entry };
  const name = nonempty(primaryManifest.name, 'plugin name');
  const id = source.discovery.kind === 'marketplace' ? slug(source.id + '-' + name) : source.id;
  const skills = await manifestSkills(checkout, root, primaryManifest);
  const agentSkills: Partial<Record<AgentId, SkillRecord[]>> = {};
  for (const [agent, value] of Object.entries(native)) agentSkills[agent as AgentId] = await manifestSkills(checkout, root, { ...value.manifest, ...value.entry });
  const version = primaryManifest.version;
  return { id, name, sourceId: source.id, sourceRoot: root, description: source.description + (id !== source.id ? ' / ' + name : ''), skills, native, agentSkills, ...(typeof version === 'string' ? { upstreamVersion: version } : {}) };
}
export async function discoverPackages(source: SourceDefinition, checkout: string): Promise<PackageDefinition[]> {
  const discovery = source.discovery;
  let result: PackageDefinition[];
  if (discovery.kind === 'plugin') result = [await discoverPlugin(source, checkout, safeRelative(discovery.root))];
  else if (discovery.kind === 'marketplace') {
    const manifest = object(JSON.parse(await readFile(await sourceFile(checkout, discovery.manifest), 'utf8')), 'marketplace');
    if (!Array.isArray(manifest.plugins) || !manifest.plugins.length) throw new Error('Empty upstream marketplace');
    result = [];
    for (const value of manifest.plugins) {
      const entry = object(value, 'marketplace entry');
      const src = entry.source;
      let relative: string;
      if (typeof src === 'string') relative = safeRelative(src);
      else {
        const descriptor = object(src, 'plugin source');
        if (descriptor.source !== 'local') throw new Error('Nested external sources require an explicit sources.json entry');
        relative = safeRelative(nonempty(descriptor.path, 'local source path'));
      }
      result.push(await discoverPlugin(source, checkout, relative, entry));
    }
  } else {
    result = [];
    for (const group of discovery.packages) {
      const skills = await scanSkills(checkout, [...group.roots || [], ...group.containers || []]);
      result.push({ id: discovery.packages.length === 1 ? source.id : slug(source.id + '-' + group.name), name: group.name, description: source.description, sourceId: source.id, sourceRoot: '.', skills, native: {}, agentSkills: {} });
    }
  }
  const ids = new Set<string>();
  for (const item of result) {
    if (!item.skills.length) throw new Error('Empty skill package: ' + item.id);
    if (ids.has(item.id)) throw new Error('Duplicate package id: ' + item.id);
    ids.add(item.id);
  }
  return result;
}
