import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { AGENTS, copyChecked, digest, exists, inside, json, nextVersion, safeRelative, slug, treeDigest, writeJson, writeText } from './fs.ts';
import { sourceFile } from './discovery.ts';
import { DSH_ENGINE_RANGE } from './adapters.ts';
import type { AgentId, Compatibility, MarketConfig, PackageDefinition, PackageRecord, SourceDefinition } from './types.ts';

export const ADAPTER_VERSION = '5';
const capabilityPaths: Record<string, string[]> = { hooks: ['hooks/hooks.json'], agents: ['agents'], commands: ['commands'], mcp: ['.mcp.json', 'mcp.json'], apps: ['.app.json'] };
const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'];

export async function assertLicense(checkout: string, source: SourceDefinition): Promise<string[]> {
  const found: string[] = [];
  for (const relative of licenseNames) {
    if (!await exists(inside(checkout, relative))) continue;
    const text = await readFile(await sourceFile(checkout, relative), 'utf8');
    if (!text.trim()) throw new Error('Empty upstream license');
    const patterns: Record<string, RegExp> = { MIT: /permission is hereby granted/i, 'Apache-2.0': /Apache License|apache.org\/licenses\/LICENSE-2.0/i, 'CC-BY-NC-4.0': /Attribution.NonCommercial|creativecommons.org\/licenses\/by-nc\/4\.0|CC BY-NC/i };
    const pattern = patterns[source.license];
    if (pattern && !pattern.test(text)) throw new Error('Upstream license no longer matches ' + source.license + ': ' + relative);
    found.push(relative);
  }
  if (!found.length) throw new Error('No upstream license; distribution requires curator review');
  return found;
}

export async function copyPayload(checkout: string, destination: string, source: SourceDefinition, definition: PackageDefinition): Promise<string[]> {
  const knownIssues = new Set<string>();
  const licenses = await assertLicense(checkout, source);
  const roots = new Set([...definition.skills, ...Object.values(definition.agentSkills).flatMap(value => value || [])].map(skill => skill.path));
  const candidates = [...roots, ...source.resources, ...licenses];
  for (const extra of ['README.md', 'NOTICE', 'NOTICE.md', 'THIRD_PARTY.md', 'CITATION.cff']) if (await exists(inside(checkout, extra))) candidates.push(extra);
  const selected = [...new Set(candidates.map(safeRelative))].sort((a, b) => a.length - b.length || a.localeCompare(b, 'en'));
  const copied: string[] = [];
  for (const relative of selected) {
    if (copied.some(parent => parent === '.' || relative === parent || relative.startsWith(parent + '/'))) continue;
    if (!await exists(inside(checkout, relative))) throw new Error('Required package resource is missing: ' + relative);
    await copyChecked(inside(checkout, relative), inside(destination, relative), checkout);
    copied.push(relative);
  }
  // Validate actionable resource links in original SKILL instructions, not examples of future output files.
  for (const skill of [...definition.skills, ...Object.values(definition.agentSkills).flatMap(value => value || [])]) {
    const raw = await readFile(await sourceFile(checkout, path.posix.join(skill.path, 'SKILL.md')), 'utf8');
    const text = raw.replace(/```[\s\S]*?```/g, '');
    for (const match of text.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)) {
      const href = match[1].split('#')[0];
      if (!/^(?:\.\.\/)*(?:\.\/)?(?:references|scripts|assets|templates|shared)\//.test(href) || /[{}<>*]|:\/\//.test(href)) continue;
      const relative = safeRelative(path.posix.join(skill.path, decodeURIComponent(href)));
      if (!await exists(inside(checkout, relative))) {
        const exception = source.resourceExceptions?.find(item => item.path === relative);
        if (exception) { knownIssues.add(relative + ' — ' + exception.reason); continue; }
        throw new Error('Missing linked skill resource: ' + relative);
      }
      if (!await exists(inside(destination, relative))) await copyChecked(await sourceFile(checkout, relative), inside(destination, relative), checkout);
    }
  }
  return [...knownIssues].sort();
}

async function capabilities(checkout: string, definition: PackageDefinition): Promise<string[]> {
  const found = new Set<string>();
  for (const native of Object.values(definition.native)) {
    for (const [capability, files] of Object.entries(capabilityPaths)) {
      if (files.some(file => native.manifest?.[capability] !== undefined || native.manifest?.mcpServers !== undefined && capability === 'mcp')) found.add(capability);
      for (const file of files) if (await exists(inside(checkout, path.posix.join(native.root, file)))) found.add(capability);
    }
  }
  return [...found].sort();
}

export function compatibilityFor(source: SourceDefinition, definition: PackageDefinition, extraCapabilities: string[]): Record<AgentId, Compatibility> {
  return Object.fromEntries(AGENTS.map(agent => {
    const restricted = source.restrictedAgents?.[agent];
    const direct = !!definition.native[agent] && (agent === 'codex' || agent === 'claude-code');
    return [agent, { level: restricted ? 'unsupported' : direct ? 'native' : 'skills-only', reason: restricted || (direct ? '引用上游原生插件，完整工作流仍需满足上游运行要求。' : '分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。'), verification: 'structure-validated', missingCapabilities: restricted ? ['native-runtime'] : direct ? [] : extraCapabilities }];
  })) as Record<AgentId, Compatibility>;
}

function routerText(source: SourceDefinition, definition: PackageDefinition, sha: string, genericName: string): string {
  return [
    '---', 'name: ' + genericName, 'description: ' + JSON.stringify(source.description + ' 使用原始技能与配套资源的套件入口。'), 'disable-model-invocation: true', '---', '',
    '# ' + definition.name, '',
    'This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.',
    'Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.',
    'Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.',
    'Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.',
    'Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.', '',
    'Source: https://github.com/' + source.repository + '/tree/' + sha, 'License: ' + source.license, '',
    '## Skills', '',
    ...definition.skills.map(skill => '- ' + skill.name + ': [original instructions](upstream/' + (skill.path === '.' ? '' : skill.path + '/') + 'SKILL.md) — ' + skill.description.replaceAll('\n', ' ').replaceAll('|', '\\|')),
    '', '## Requirements', '', ...source.requirements.map(requirement => '- ' + requirement), '',
  ].join('\n');
}

export async function buildPackage(source: SourceDefinition, definition: PackageDefinition, checkout: string, sha: string, output: string, config: MarketConfig, previous?: PackageRecord): Promise<PackageRecord> {
  // Keep storage paths short independently of public package and skill names.
  const packagePath = path.posix.join('packages', digest(definition.id).slice(0, 12));
  const directory = inside(output, packagePath);
  await rm(directory, { recursive: true, force: true });
  const genericName = slug(definition.id + '-suite');
  const routerRelative = 's';
  const router = path.join(directory, routerRelative);
  const upstream = path.join(router, 'upstream');
  await mkdir(upstream, { recursive: true });
  const knownIssues = await copyPayload(checkout, upstream, source, definition);
  const payloadDigest = digest(await treeDigest(upstream) + json(definition) + json(source) + sha + ADAPTER_VERSION);
  const distributionVersion = previous?.digest === payloadDigest ? previous.distributionVersion : nextVersion(previous?.distributionVersion);
  const nativeCapabilities = await capabilities(checkout, definition);
  const record: PackageRecord = {
    ...definition, repository: source.repository, ...(source.family ? { family: source.family } : {}), license: source.license,
    sha, digest: payloadDigest, artifactHash: '', distributionVersion, packagePath, genericSkillName: genericName, genericSkillPath: path.posix.join(packagePath, routerRelative),
    cloud: source.cloud, operatingSystems: source.operatingSystems || ['unspecified'], requirements: source.requirements,
    compatibility: compatibilityFor(source, definition, nativeCapabilities), nativeCapabilities, knownIssues,
  };
  if (knownIssues.length) {
    record.description += '（上游有 ' + knownIssues.length + ' 项可选参考缺失，详见目录）';
    for (const entry of Object.values(record.compatibility)) {
      entry.reason += ' 已登记上游可选参考文档缺失。';
      entry.missingCapabilities.push('optional-upstream-references');
    }
  }
  await writeText(path.join(router, 'SKILL.md'), routerText(source, definition, sha, genericName) + (knownIssues.length ? '\n## Known upstream limitations\n\n' + knownIssues.map(issue => '- ' + issue).join('\n') + '\n' : ''));
  const provenance = { sourceId: source.id, packageId: definition.id, repository: source.repository, commit: sha, license: source.license, upstreamVersion: definition.upstreamVersion || null, distributionVersion, digest: payloadDigest, adapterVersion: ADAPTER_VERSION };
  await writeJson(path.join(router, 'UPSTREAM.json'), provenance);
  await writeJson(path.join(directory, 'PROVENANCE.json'), provenance);
  const base = { name: definition.id, version: distributionVersion, description: definition.description, author: { name: config.publisher }, homepage: 'https://github.com/' + source.repository, repository: 'https://github.com/' + config.repository, license: source.license };
  for (const [agent, location] of [['codex', '.codex-plugin/plugin.json'], ['claude-code', '.claude-plugin/plugin.json'], ['cursor', '.cursor-plugin/plugin.json']] as const) {
    const skills = definition.agentSkills[agent] || definition.skills;
    await writeJson(path.join(directory, location), { ...base, skills: skills.map(skill => './' + routerRelative + '/upstream/' + (skill.path === '.' ? '' : skill.path)) });
  }
  const dshName = 'dsh-sam-' + definition.id;
  await writeJson(path.join(directory, 'package.json'), { name: dshName, version: distributionVersion, description: definition.description, type: 'module', license: source.license, repository: 'https://github.com/' + config.repository, engines: { node: '>=24', dsh: DSH_ENGINE_RANGE }, exports: { '.': './dsh/index.mjs', './package.json': './package.json' }, peerDependencies: { '@deepseek-ai/dsh-skill-filesystem': DSH_ENGINE_RANGE }, dsh: { bundle: { patch: './dsh/cordis.patch.yml' } } });
  await writeText(path.join(directory, 'dsh/cordis.patch.yml'), '- insert:\n    - id: ' + dshName + '\n      name: ' + dshName + '\n');
  const parents = [...new Set(definition.skills.map(skill => path.posix.dirname(routerRelative + '/upstream/' + (skill.path === '.' ? '' : skill.path))))];
  const published = definition.skills.map(skill => routerRelative + '/upstream/' + (skill.path === '.' ? '' : skill.path + '/') + 'SKILL.md');
  await writeText(path.join(directory, 'dsh/index.mjs'), [
    "import {fileURLToPath} from 'node:url';", "import {normalize} from 'node:path';", "import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';", "export const name = '" + dshName + "';", "export const inject = ['skills'];", 'const roots = ' + JSON.stringify(parents) + ';',
    'const published = ' + JSON.stringify(published) + ';', "const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));",
    'export function apply(ctx) {', '  for (let i = 0; i < roots.length; i++) {', "    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));", '    ctx.skills.registerProvider(control => {', "      const provider = new FileSystemSkillProvider(ctx, control, {providerName: '" + dshName + "-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});", '      const discover = provider.list.bind(provider);', '      provider.list = async options => {', '        const result = await discover(options);', '        const accept = candidate => allowed.has(normalize(candidate.locator.path));', '        return Array.isArray(result) ? result.filter(accept) : {...result, candidates: result.candidates.filter(accept)};', '      };', '      return provider;', '    });', '  }', '}', '',
  ].join('\n'));
  const claudeInstall = record.compatibility['claude-code'].level === 'skills-only' ? '/plugin install ' + definition.id + ' --marketplace ' + config.repository : '';
  await writeText(path.join(directory, 'README.md'), ['# ' + definition.name, '', source.description, '', '上游提交：' + sha, '原始资源与许可证位于 ' + routerRelative + '/upstream/。', 'DSH 封装仅挂载 Skills，不修改模型、授权或运行配置。', '通用套件入口：' + genericName, '原生插件安装入口和兼容范围见市场目录。', '', claudeInstall, ''].join('\n'));
  record.artifactHash = await treeDigest(directory);
  return record;
}
