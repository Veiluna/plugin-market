import {fileURLToPath} from 'node:url';
import {normalize} from 'node:path';
import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';
export const name = 'dsh-sam-ai-research-skills-multimodal';
export const inject = ['skills'];
const roots = ["./upstream/18-multimodal"];
const published = ["./upstream/18-multimodal/audiocraft/SKILL.md","./upstream/18-multimodal/blip-2/SKILL.md","./upstream/18-multimodal/clip/SKILL.md","./upstream/18-multimodal/cosmos-policy/SKILL.md","./upstream/18-multimodal/llava/SKILL.md","./upstream/18-multimodal/openpi/SKILL.md","./upstream/18-multimodal/openvla-oft/SKILL.md","./upstream/18-multimodal/segment-anything/SKILL.md","./upstream/18-multimodal/stable-diffusion/SKILL.md","./upstream/18-multimodal/whisper/SKILL.md"];
const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));
export function apply(ctx) {
  for (let i = 0; i < roots.length; i++) {
    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));
    ctx.skills.registerProvider(control => {
      const provider = new FileSystemSkillProvider(ctx, control, {providerName: 'dsh-sam-ai-research-skills-multimodal-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});
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
