import {fileURLToPath} from 'node:url';
import {normalize} from 'node:path';
import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';
export const name = 'dsh-sam-ai-research-skills-post-training';
export const inject = ['skills'];
const roots = ["./upstream/06-post-training"];
const published = ["./upstream/06-post-training/grpo-rl-training/SKILL.md","./upstream/06-post-training/miles/SKILL.md","./upstream/06-post-training/openrlhf/SKILL.md","./upstream/06-post-training/simpo/SKILL.md","./upstream/06-post-training/slime/SKILL.md","./upstream/06-post-training/torchforge/SKILL.md","./upstream/06-post-training/trl-fine-tuning/SKILL.md","./upstream/06-post-training/verl/SKILL.md"];
const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));
export function apply(ctx) {
  for (let i = 0; i < roots.length; i++) {
    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));
    ctx.skills.registerProvider(control => {
      const provider = new FileSystemSkillProvider(ctx, control, {providerName: 'dsh-sam-ai-research-skills-post-training-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});
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
