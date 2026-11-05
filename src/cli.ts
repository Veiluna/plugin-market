import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readJson } from './fs.ts';
import { installSkills } from './install.ts';
import { sync } from './sync.ts';
import { validateRepository } from './validate.ts';
import type { AgentId, Catalog } from './types.ts';

const help = [
  'Scientific Agent Market — 科研精选插件市场', '',
  'npm run market -- list [--agent codex] [--cloud] [--json]',
  'npm run market -- show <package-id>',
  'npm run market -- sync [--source <id>] [--dry-run] [--rebuild] [--publish-dsh]',
  'npm run market -- validate',
  'npm run market -- install-skills <package-id> --agent codex --target /path/to/project [--cloud] [--update] [--dry-run]',
  'npm run market -- install-skills <package-id> --agent universal --target /path/to/project --skills-dir .other-agent/skills',
  'npm run market -- install-skills <package-id> --agent claude-code --scope user', '',
  '通用入口仅安装 Skills 套件。完整原生插件请从对应市场安装。',
  '--cloud 仅适用于 Codex 项目安装；--force 明确允许覆盖目标中的现有文件。',
  '--publish-dsh 先推送发行分支，成功后才更新 DSH 索引。', '',
].join('\n');

export async function main(argv = process.argv.slice(2), root = fileURLToPath(new URL('../', import.meta.url))): Promise<void> {
  const { positionals, values } = parseArgs({ args: argv, allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' }, json: { type: 'boolean' }, agent: { type: 'string' }, target: { type: 'string' }, scope: { type: 'string' }, 'skills-dir': { type: 'string' }, source: { type: 'string', multiple: true },
    cloud: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, 'publish-dsh': { type: 'boolean' }, rebuild: { type: 'boolean' }, update: { type: 'boolean' }, force: { type: 'boolean' },
  } });
  const [command, id] = positionals;
  if (values.help || !command) { console.log(help); return; }
  if (command === 'sync') {
    const report = await sync(root, { dryRun: values['dry-run'], publishDsh: values['publish-dsh'], rebuild: values.rebuild, sourceIds: values.source, onProgress: message => { if (!values.json) console.error(message); } });
    console.log(JSON.stringify(report, null, 2));
    if (report.failed.length) process.exitCode = 1;
  } else if (command === 'validate') console.log(JSON.stringify(await validateRepository(root), null, 2));
  else if (command === 'install-skills') {
    if (!id) throw new Error('Choose a package id');
    if (values.scope && !['project', 'user'].includes(values.scope)) throw new Error('--scope must be project or user');
    const agent = values.agent === 'codex-cloud' ? 'codex' : values.agent || 'codex';
    console.log(JSON.stringify(await installSkills(root, id, { agent: agent as AgentId, target: values.target, scope: values.scope as 'project' | 'user' | undefined, skillsDir: values['skills-dir'], cloud: values.cloud || values.agent === 'codex-cloud', dryRun: values['dry-run'], update: values.update, force: values.force }), null, 2));
  } else if (command === 'list' || command === 'show') {
    const catalog = await readJson<Catalog>(path.join(root, 'catalog/catalog.json'));
    if (command === 'show') {
      const pkg = catalog.packages.find(pkg => pkg.id === id || pkg.upstreamPackages?.some(group => group.id === id));
      if (!pkg) throw new Error('Unknown package: ' + String(id));
      console.log(JSON.stringify(pkg, null, 2));
      return;
    }
    const agent = values.agent as AgentId | undefined;
    if (agent && !['codex', 'claude-code', 'cursor', 'dsh', 'universal'].includes(agent)) throw new Error('Unknown agent filter');
    const packages = catalog.packages.filter(pkg => (!agent || pkg.compatibility[agent].level !== 'unsupported') && (!values.cloud || pkg.cloud !== 'unsupported' && pkg.compatibility.codex.level !== 'unsupported'));
    if (values.json) console.log(JSON.stringify(packages, null, 2));
    else for (const pkg of packages) console.log(pkg.id + '\t' + pkg.distributionVersion + '\t' + (agent ? pkg.compatibility[agent].level : pkg.repository) + '\tcloud=' + pkg.cloud);
  } else throw new Error('Unknown command: ' + command);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
