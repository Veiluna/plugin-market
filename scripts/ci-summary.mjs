import { appendFile, readFile } from 'node:fs/promises';
const report = JSON.parse(await readFile('.cache/sync-report.json', 'utf8').catch(() => '{"changed":[],"unchanged":[],"failed":[]}'));
const catalog = JSON.parse(await readFile('catalog/catalog.json', 'utf8'));
const lines = ['## Scientific Agent Market', '', '- Configured sources: ' + catalog.sources.length, '- Packages: ' + catalog.packages.length, '- Updated sources: ' + (report.changed.join(', ') || 'none'), '- Unchanged sources: ' + report.unchanged.length, ''];
for (const failure of report.failed) lines.push('- Retained previous version of ' + failure.id + ': ' + failure.error.replaceAll('\n', ' '));
const text = lines.join('\n') + '\n';
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text);
else process.stdout.write(text);
