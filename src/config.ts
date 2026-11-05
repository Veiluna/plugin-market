import path from 'node:path';
import { AGENTS, nonempty, object, readJson, safeRelative } from './fs.ts';
import type { MarketConfig, SourceDefinition } from './types.ts';

export async function loadConfig(root: string): Promise<{ config: MarketConfig; sources: SourceDefinition[] }> {
  const config = await readJson<MarketConfig>(path.join(root, 'market.config.json'));
  for (const key of ['name', 'title', 'repository', 'publisher', 'distributionBranch', 'skillsCliVersion'] as const) nonempty(config[key], key);
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw new Error('market repository must be owner/repo');
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(config.skillsCliVersion)) throw new Error('Pin an exact skills CLI version');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.name)) throw new Error('Invalid marketplace name');
  if (!/^[a-zA-Z0-9][\w/-]*$/.test(config.distributionBranch) || config.distributionBranch.includes('..')) throw new Error('Invalid distribution branch');
  const data = await readJson<{ version: number; sources: SourceDefinition[] }>(path.join(root, 'sources.json'));
  if (data.version !== 1 || !Array.isArray(data.sources)) throw new Error('Unsupported sources format');
  const ids = new Set<string>();
  const repos = new Set<string>();
  for (const source of data.sources) {
    object(source, 'source');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id) || ids.has(source.id)) throw new Error('Invalid or duplicate source id: ' + source.id);
    if (!/^[\w.-]+\/[\w.-]+$/.test(source.repository) || repos.has(source.repository.toLowerCase())) throw new Error('Invalid or duplicate repository: ' + source.repository);
    ids.add(source.id); repos.add(source.repository.toLowerCase());
    nonempty(source.license, 'license'); nonempty(source.description, 'description');
    if (!['supported', 'conditional', 'unsupported'].includes(source.cloud)) throw new Error('Invalid cloud support: ' + source.id);
    if (!Array.isArray(source.resources) || !Array.isArray(source.requirements)) throw new Error('resources and requirements must be arrays');
    for (const entry of source.resources) safeRelative(nonempty(entry, 'resource path'));
    for (const entry of source.requirements) nonempty(entry, 'requirement');
    const discovery = source.discovery;
    object(discovery, 'discovery');
    if (discovery.kind === 'plugin') safeRelative(discovery.root);
    else if (discovery.kind === 'marketplace') safeRelative(discovery.manifest);
    else if (discovery.kind === 'skills' && Array.isArray(discovery.packages) && discovery.packages.length) {
      for (const item of discovery.packages) {
        nonempty(item.name, 'package name');
        if (!(item.roots?.length || item.containers?.length)) throw new Error('A skill package needs roots or containers');
        for (const entry of [...item.roots || [], ...item.containers || []]) safeRelative(entry);
      }
    } else throw new Error('Invalid discovery: ' + source.id);
    for (const agent of Object.keys(source.restrictedAgents || {})) if (!(AGENTS as readonly string[]).includes(agent)) throw new Error('Unknown agent: ' + agent);
    for (const exception of source.resourceExceptions || []) {
      safeRelative(exception.path);
      if (!exception.path.includes('/references/') || !exception.path.endsWith('.md')) throw new Error('Only explicitly reviewed optional reference documents can be excepted');
      nonempty(exception.reason, 'resource exception reason');
    }
  }
  return { config, sources: data.sources };
}
