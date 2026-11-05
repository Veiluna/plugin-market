import {fileURLToPath} from 'node:url';
import {normalize} from 'node:path';
import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';
export const name = 'dsh-sam-ai-research-skills-model-architecture';
export const inject = ['skills'];
const roots = ["skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture"];
const published = ["skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture/litgpt/SKILL.md","skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture/mamba/SKILL.md","skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture/nanogpt/SKILL.md","skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture/rwkv/SKILL.md","skills/ai-research-skills-model-architecture-suite/upstream/01-model-architecture/torchtitan/SKILL.md"];
const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));
export function apply(ctx) {
  for (let i = 0; i < roots.length; i++) {
    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));
    ctx.skills.registerProvider(control => {
      const provider = new FileSystemSkillProvider(ctx, control, {providerName: 'dsh-sam-ai-research-skills-model-architecture-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});
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
