import assert from 'node:assert/strict';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

interface Candidate { name: string; locator: { path: string } }
interface Provider {
  list(options: { cwd: string; signal: AbortSignal }): Promise<Candidate[] | { candidates: Candidate[] }>;
  get(candidate: Candidate, options: { cwd: string; signal: AbortSignal }): Promise<{ name: string; content?: string; body?: string; instructions?: string } | undefined>;
  dispose(): Promise<void>;
}
export async function probeDshBundle(directory: string, expectedNames: string[]): Promise<{ names: string[]; warnings: string[] }> {
  const module = await import(pathToFileURL(path.join(directory, 'dsh/index.mjs')).href);
  assert.deepEqual(module.inject, ['skills'], 'Bundle may only register Skills');
  const providers: { provider: Provider; controller: AbortController }[] = [];
  const warnings: string[] = [];
  const context = {
    get: () => undefined,
    logger: { warn: (message: unknown) => warnings.push(String(message)) },
    skills: { registerProvider(factory: (control: { signal: AbortSignal; invalidate: () => void }) => Provider) {
      const controller = new AbortController();
      providers.push({ provider: factory({ signal: controller.signal, invalidate() {} }), controller });
    } },
  };
  const names: string[] = [];
  const boundary = await realpath(directory);
  try {
    await module.apply(context);
    for (const { provider, controller } of providers) {
      const options = { cwd: directory, signal: controller.signal };
      const result = await provider.list(options);
      const candidates = Array.isArray(result) ? result : result.candidates;
      for (const candidate of candidates) {
        const location = await realpath(candidate.locator.path);
        assert.ok(location.startsWith(boundary + path.sep), 'DSH candidate escaped bundle');
        const loaded = await provider.get(candidate, options);
        assert.ok(loaded && typeof (loaded.content ?? loaded.body ?? loaded.instructions) === 'string', 'DSH must load original skill instructions');
        names.push(loaded.name);
      }
    }
    assert.deepEqual([...names].sort(), [...expectedNames].sort(), 'DSH must register exactly the upstream published skill set');
    return { names, warnings };
  } finally { for (const { provider, controller } of providers) { controller.abort(); await provider.dispose(); } }
}
