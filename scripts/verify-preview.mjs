import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { entryName } from '../src/adapters.ts';
import { withCodexServer } from './codex-rpc.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(await readFile(path.join(root, 'catalog/catalog.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, '.agents/plugins/marketplace.json'), 'utf8'));
await mkdir(path.join(root, '.cache/verification'), { recursive: true });
const profile = await mkdtemp(path.join(root, '.cache/verification/preview-profile-'));
const environment = { ...process.env, CODEX_HOME: profile };
const summary = await withCodexServer({ executable: process.env.MARKET_CODEX_BINARY || 'codex', cwd: root, env: environment }, async request => {
  let skillsListed = 0;
  for (const entry of manifest.plugins) {
    const pkg = catalog.packages.find(pkg => entryName(pkg, 'codex') === entry.name);
    const skills = pkg.agentSkills.codex || pkg.skills;
    const { plugin } = await request('plugin/read', { marketplacePath: path.join(root, '.agents/plugins/marketplace.json'), pluginName: entry.name });
    assert.equal(plugin.summary.installed, false, entry.name);
    const preview = plugin.summary.interface;
    assert.ok(preview?.shortDescription?.startsWith(skills.length + ' 项技能'), entry.name + ': visible skill count');
    assert.ok(preview.longDescription.includes('来源：' + pkg.repository), entry.name + ': visible source');
    for (const skill of skills) assert.ok(preview.longDescription.includes('- ' + skill.name + '：'), entry.name + ': ' + skill.name);
    assert.equal(plugin.skills.length, 0, 'Codex Git sources defer native skill cards until installation');
    skillsListed += skills.length;
  }
  return { entriesPreviewedBeforeInstall: manifest.plugins.length, originalSkillDescriptionsListed: skillsListed, nativeSkillCardsBeforeInstall: 0, modelRequests: 0 };
});
await writeFile(path.join(root, '.cache/verification/preview.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
