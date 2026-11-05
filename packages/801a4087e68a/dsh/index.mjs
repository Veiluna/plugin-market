import {fileURLToPath} from 'node:url';
import {normalize} from 'node:path';
import {FileSystemSkillProvider} from '@deepseek-ai/dsh-skill-filesystem';
export const name = 'dsh-sam-nature-skills';
export const inject = ['skills'];
const roots = ["s/upstream/skills"];
const published = ["s/upstream/skills/nature-academic-search/SKILL.md","s/upstream/skills/nature-citation/SKILL.md","s/upstream/skills/nature-data/SKILL.md","s/upstream/skills/nature-downloader/SKILL.md","s/upstream/skills/nature-experiment-log/SKILL.md","s/upstream/skills/nature-figure/SKILL.md","s/upstream/skills/nature-image2ppt/SKILL.md","s/upstream/skills/nature-literature-pipeline/SKILL.md","s/upstream/skills/nature-paper-card/SKILL.md","s/upstream/skills/nature-paper-to-patent/SKILL.md","s/upstream/skills/nature-paper-trans/SKILL.md","s/upstream/skills/nature-paper-xray/SKILL.md","s/upstream/skills/nature-paper2ppt/SKILL.md","s/upstream/skills/nature-paper2word/SKILL.md","s/upstream/skills/nature-polishing/SKILL.md","s/upstream/skills/nature-proposal-writer/SKILL.md","s/upstream/skills/nature-reader/SKILL.md","s/upstream/skills/nature-ref-verifier/SKILL.md","s/upstream/skills/nature-response/SKILL.md","s/upstream/skills/nature-reviewer/SKILL.md","s/upstream/skills/nature-shared/SKILL.md","s/upstream/skills/nature-social-science/SKILL.md","s/upstream/skills/nature-statistics/SKILL.md","s/upstream/skills/nature-writing/SKILL.md"];
const allowed = new Set(published.map(file => normalize(fileURLToPath(new URL('../' + file, import.meta.url)))));
export function apply(ctx) {
  for (let i = 0; i < roots.length; i++) {
    const directory = fileURLToPath(new URL('../' + roots[i] + '/', import.meta.url));
    ctx.skills.registerProvider(control => {
      const provider = new FileSystemSkillProvider(ctx, control, {providerName: 'dsh-sam-nature-skills-' + i, includeDefaultRoots: false, bundledSkillDir: directory, watch: false});
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
