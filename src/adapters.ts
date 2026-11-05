import type { AgentAdapter, AgentId, Catalog, CatalogLock, JsonObject, MarketConfig, PackageRecord } from './types.ts';

export const adapters: Record<AgentId, AgentAdapter> = {
  codex: { id: 'codex', label: 'Codex', marketplacePath: '.agents/plugins/marketplace.json', projectSkills: '.agents/skills', userSkills: '.agents/skills' },
  'claude-code': { id: 'claude-code', label: 'Claude Code', marketplacePath: '.claude-plugin/marketplace.json', projectSkills: '.claude/skills', userSkills: '.claude/skills' },
  cursor: { id: 'cursor', label: 'Cursor', marketplacePath: '.cursor-plugin/marketplace.json', projectSkills: '.cursor/skills', userSkills: '.cursor/skills' },
  dsh: { id: 'dsh', label: 'DeepSeek Harness', marketplacePath: 'dsh/index.json', projectSkills: '.dsh/skills', userSkills: '.dsh/skills' },
  universal: { id: 'universal', label: 'Agent Skills', projectSkills: '.agents/skills', userSkills: '.agents/skills' },
};
export const DSH_ENGINE_RANGE = '^0.2.1-rc.5';

export function entryName(pkg: PackageRecord, agent: AgentId): string {
  const native = pkg.native[agent];
  return pkg.compatibility[agent].level === 'native' ? String(native?.entry?.name || native?.manifest?.name || pkg.name) : pkg.id;
}
function remoteSource(pkg: PackageRecord, root: string, agent: 'codex' | 'claude-code'): JsonObject {
  if (root === '.') return agent === 'codex' ? { source: 'url', url: 'https://github.com/' + pkg.repository + '.git', sha: pkg.sha } : { source: 'github', repo: pkg.repository, sha: pkg.sha };
  return { source: 'git-subdir', url: 'https://github.com/' + pkg.repository + '.git', path: './' + root, sha: pkg.sha };
}

export interface DshVersion { version: string; publishTimestamp: number; source: { type: 'git'; url: string; commit: string; path: string }; engines: { dsh: string } }
export interface DshPlugin { name: string; title: string; description: string; author: string; homepage: string; repository: { url: string }; versions: DshVersion[] }
export interface DshIndex { format: 1; title: { en: string; zh: string }; description: string; plugins: DshPlugin[] }

export function buildDshIndex(config: MarketConfig, packages: PackageRecord[], previous?: DshIndex, commit?: string, timestamp = Math.floor(Date.now() / 1000)): { index: DshIndex; pending: string[] } {
  if (commit && !/^[a-f0-9]{40}$/.test(commit)) throw new Error('DSH publication needs an existing full Git commit');
  const pending: string[] = [];
  const plugins: DshPlugin[] = [];
  const url = 'https://github.com/' + config.repository;
  for (const pkg of packages.filter(pkg => pkg.compatibility.dsh.level !== 'unsupported')) {
    const name = 'dsh-sam-' + pkg.id;
    const old = previous?.plugins.find(plugin => plugin.name === name);
    const versions = (old?.versions || []).filter(version => version.source.url === url).map(version => structuredClone(version));
    if (!versions.some(version => version.version === pkg.distributionVersion)) {
      if (commit) versions.push({ version: pkg.distributionVersion, publishTimestamp: timestamp, source: { type: 'git', url, commit, path: pkg.packagePath }, engines: { dsh: DSH_ENGINE_RANGE } });
      else pending.push(pkg.id);
    }
    if (!versions.length) continue;
    plugins.push({ name, title: pkg.name, description: pkg.description, author: pkg.repository.split('/')[0], homepage: 'https://github.com/' + pkg.repository + '/tree/' + pkg.sha, repository: { url: 'https://github.com/' + pkg.repository }, versions });
  }
  return { index: { format: 1, title: { en: 'Scientific Agent Market', zh: config.title }, description: 'Commit-pinned scientific Skills bundles. Native hooks, MCP, commands and agents are not installed by these bundles.', plugins }, pending };
}

export function buildArtifacts(config: MarketConfig, catalog: Catalog, lock: CatalogLock, previousDsh?: DshIndex, dshCommit?: string): Record<string, unknown> {
  const codex: JsonObject[] = [];
  const claude: JsonObject[] = [];
  const cursor: JsonObject[] = [];
  for (const pkg of catalog.packages) {
    for (const agent of ['codex', 'claude-code', 'cursor'] as const) {
      if (pkg.compatibility[agent].level === 'unsupported') continue;
      const native = pkg.compatibility[agent].level === 'native' ? pkg.native[agent] : undefined;
      const name = entryName(pkg, agent);
      if (agent === 'codex') codex.push({ name, source: native ? remoteSource(pkg, native.root, agent) : { source: 'local', path: './' + pkg.packagePath }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Research' });
      else if (agent === 'claude-code') {
        const entry: JsonObject = { name, source: native ? remoteSource(pkg, native.root, agent) : './' + pkg.packagePath, description: pkg.description, license: pkg.license };
        if (native?.entry) for (const key of ['skills', 'agents', 'commands', 'hooks', 'mcpServers', 'strict', 'version', 'keywords']) if (native.entry[key] !== undefined) entry[key] = native.entry[key];
        claude.push(entry);
      } else cursor.push({ name, source: './' + pkg.packagePath, description: pkg.description });
    }
  }
  const dsh = buildDshIndex(config, catalog.packages, previousDsh, dshCommit);
  return {
    '.agents/plugins/marketplace.json': { name: config.name, interface: { displayName: config.title }, plugins: codex },
    '.claude-plugin/marketplace.json': { name: config.name, owner: { name: config.publisher }, metadata: { description: config.title }, plugins: claude },
    '.cursor-plugin/marketplace.json': { name: config.name, owner: { name: config.publisher }, metadata: { description: config.title }, plugins: cursor },
    'dsh/index.json': dsh.index,
    'dsh/pending.json': { description: 'Build queue, not an installable DSH index. Publish these bundles before updating index.json.', packages: dsh.pending },
    'catalog/catalog.json': catalog,
    'catalog/lock.json': lock,
  };
}

export function catalogMarkdown(catalog: Catalog, config: MarketConfig): string {
  const esc = (text: string): string => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
  const lines = ['# 科研插件目录', '', '由 sources.json 与锁定提交生成。结构校验不等于工作流功能实测；原生插件仍需上游要求的工具、登录或服务。', '', '| 插件 ID | 上游 | Skills | Codex | Claude Code | Cursor | DSH | 云端 | 授权 |', '| --- | --- | ---: | --- | --- | --- | --- | --- | --- |'];
  for (const pkg of catalog.packages) lines.push('| ' + [pkg.id, '[' + pkg.repository + '](https://github.com/' + pkg.repository + '/tree/' + pkg.sha + ')', String(pkg.skills.length), ...(['codex', 'claude-code', 'cursor', 'dsh'] as const).map(agent => pkg.compatibility[agent].level), pkg.cloud, pkg.license].map(esc).join(' | ') + ' |');
  lines.push('', '## 安装与前置条件', '');
  for (const pkg of catalog.packages) {
    lines.push('### ' + pkg.id, '', pkg.description, '', '- 上游版本：' + (pkg.upstreamVersion || '未声明') + '；分发版本：' + pkg.distributionVersion, '- 原始技能数：' + pkg.skills.length + '；通用安装提供一个保持原资源布局的套件入口。', '- 提交：' + pkg.sha, '- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）');
    lines.push('- 通用入口名：' + (pkg.genericSkillName || pkg.id) + '；递归发现技能的客户端也可能列出原始子技能。');
    if (pkg.family) lines.push('- 发行家族：' + pkg.family + '，各发行版独立同步。');
    for (const requirement of pkg.requirements) lines.push('- ' + requirement);
    for (const issue of pkg.knownIssues || []) lines.push('- 已知上游缺陷：' + issue);
    for (const [agent, value] of Object.entries(pkg.compatibility)) if (value.level === 'unsupported' || value.missingCapabilities.length) lines.push('- ' + agent + '：' + value.reason + (value.missingCapabilities.length ? ' 缺失：' + value.missingCapabilities.join(', ') : ''));
    lines.push('', '    npm run market -- install-skills ' + pkg.id + ' --agent codex --target /path/to/project', '');
    if (pkg.compatibility.codex.level === 'unsupported') lines.push('以上 Codex 降级安装受限，请按兼容表选择该发行版的原生平台。', '');
  }
  const failures = catalog.sources.filter(source => source.error);
  if (failures.length) lines.push('## 同步异常', '', ...failures.map(source => '- ' + source.id + '：' + source.error), '');
  lines.push('DSH 索引：https://raw.githubusercontent.com/' + config.repository + '/HEAD/dsh/index.json', '');
  return lines.join('\n');
}
