import {fileURLToPath} from 'node:url';
import {normalize} from 'node:path';
import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';
export const name = 'dsh-sam-ai-research-skills-optimization';
export const inject = ['skills'];
const roots = ["s/upstream/10-optimization"];
const published = ["s/upstream/10-optimization/awq/SKILL.md","s/upstream/10-optimization/bitsandbytes/SKILL.md","s/upstream/10-optimization/flash-attention/SKILL.md","s/upstream/10-optimization/gguf/SKILL.md","s/upstream/10-optimization/gptq/SKILL.md","s/upstream/10-optimization/hqq/SKILL.md","s/upstream/10-optimization/ml-training-recipes/SKILL.md"];
const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));
export function apply(ctx) {
  for (let i = 0; i < roots.length; i++) {
    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));
    ctx.skills.registerProvider(control => {
      const provider = new FileSystemSkillProvider(ctx, control, {providerName: 'dsh-sam-ai-research-skills-optimization-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});
      const discover = provider.list.bind(provider);
      provider.list = async options => {
        const result = await discover(options);
        const accept = candidate => allowed.has(normalize(candidate.locator.path));
        return Array.isArray(result) ? result.filter(accept) : {...result, candidates: result.candidates.filter(accept)};
      };
      return provider;
    });
  }
}
