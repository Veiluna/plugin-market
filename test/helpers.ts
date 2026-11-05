import { mkdtemp, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJson, writeText } from '../src/fs.ts';
import type { Checkout, MarketConfig, SourceDefinition } from '../src/types.ts';

export const sha = (n: number): string => n.toString(16).padStart(40, '0');
export const mit = 'MIT License\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software.\n';
export async function fixture(count = 1): Promise<{ root: string; upstream: string[]; sources: SourceDefinition[]; heads: number[]; checkout: (root: string, source: SourceDefinition) => Promise<Checkout>; config: MarketConfig }> {
  const root = await mkdtemp(path.join(tmpdir(), 'scientific-market-test-'));
  await symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), path.join(root, 'node_modules'), 'junction');
  const sources: SourceDefinition[] = [];
  const upstream: string[] = [];
  const heads: number[] = [];
  const config: MarketConfig = { name: 'test-market', title: 'Test market', repository: 'test/market', publisher: 'Test', distributionBranch: 'dist-dsh', skillsCliVersion: '1.7.6' };
  await writeJson(path.join(root, 'market.config.json'), config);
  for (let i = 0; i < count; i++) {
    const id = 'source-' + i;
    const source: SourceDefinition = { id, repository: 'test/' + id, description: 'Fixture suite ' + i, license: 'MIT', discovery: { kind: 'skills', packages: [{ name: 'suite-' + i, roots: ['skills/example'] }] }, resources: ['shared', 'LICENSE'], requirements: [], cloud: 'supported' };
    const directory = path.join(root, '.cache', 'fixtures', id);
    await mkdir(directory, { recursive: true });
    await writeText(path.join(directory, 'LICENSE'), mit);
    await writeText(path.join(directory, 'skills/example/SKILL.md'), '---\nname: example-' + i + '\ndescription: A test workflow\n---\n# Original workflow\nRead [the shared guide](../../shared/guide.md).\n');
    await writeText(path.join(directory, 'shared/guide.md'), '# Shared resource\nOriginal content.\n');
    sources.push(source); upstream.push(directory); heads.push(i + 1);
  }
  await writeJson(path.join(root, 'sources.json'), { version: 1, sources });
  return { root, upstream, sources, heads, config, checkout: async (_root, source) => { const index = sources.findIndex(item => item.id === source.id); return { directory: upstream[index], branch: 'trunk', sha: sha(heads[index]) }; } };
}
