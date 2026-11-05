import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { probeDshBundle } from '../src/dsh.ts';
import { marketInstallTarget, parseMarketIndex } from '@deepseek-ai/dsh-plugin-market-index';
import { buildDshIndex } from '../src/adapters.ts';
import { checkoutSource, git } from '../src/git.ts';
import { ensurePackage } from '../src/bundles.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const config = await read(path.join(root, 'market.config.json'));
const catalog = await read(path.join(root, 'catalog/catalog.json'));
for (const pkg of catalog.packages) await ensurePackage(root, pkg);
const schemaSource = { id: 'cursor-spec', repository: 'cursor/plugins', description: 'Official Cursor schemas', license: 'MIT', discovery: { kind: 'skills', packages: [{ name: 'schemas', roots: ['schemas'] }] }, resources: ['schemas', 'scripts'], requirements: [], cloud: 'supported' };
const cursor = await checkoutSource(root, schemaSource);
const ajv = new Ajv({ allErrors: true }); addFormats(ajv);
const validateMarket = ajv.compile(await read(path.join(cursor.directory, 'schemas/marketplace.schema.json')));
const validatePlugin = ajv.compile(await read(path.join(cursor.directory, 'schemas/plugin.schema.json')));
const marketplace = await read(path.join(root, '.cursor-plugin/marketplace.json'));
assert.ok(validateMarket(marketplace), JSON.stringify(validateMarket.errors));
for (const entry of marketplace.plugins) {
  const pkg = catalog.packages.find(pkg => pkg.id === entry.name);
  const manifest = await read(path.join(root, pkg.packagePath, '.cursor-plugin/plugin.json'));
  assert.ok(validatePlugin(manifest), entry.name + ': ' + JSON.stringify(validatePlugin.errors));
  assert.equal(manifest.name, entry.name);
}

const warnings = [];
let bundles = 0;
let skillsLoaded = 0;
for (const pkg of catalog.packages.filter(pkg => pkg.compatibility.dsh.level !== 'unsupported')) {
  const result = await probeDshBundle(path.join(root, pkg.packagePath), pkg.skills.map(skill => skill.name));
  warnings.push(...result.warnings.map(warning => warning.replaceAll(root, '<market>')));
  skillsLoaded += result.names.length;
  bundles++;
}

// Schema verification only: the head commit is a local parser fixture, never written to the installable index.
const candidateCommit = (await git(['rev-parse', 'HEAD'], root)).trim();
const candidate = buildDshIndex(config, catalog.packages, undefined, candidateCommit).index;
const parsed = parseMarketIndex(candidate, 'https://raw.githubusercontent.com/' + config.repository + '/HEAD/dsh/index.json');
for (const plugin of parsed.plugins) assert.match(marketInstallTarget(plugin.name, plugin.versions[0]).spec, /^git\+https:\/\/github\.com\/.+#[a-f0-9]{40}&path:\/(?:p|packages)\//);
const sdk = await read(path.join(root, 'node_modules/@deepseek-ai/dsh-plugin-market-index/package.json'));
const report = { cursor: { officialSchemasCommit: cursor.sha, marketplaceValidated: true, pluginsValidated: marketplace.plugins.length, guiTested: false }, dsh: { sdkVersion: sdk.version, indexSchemaValidated: true, bundlesLoaded: bundles, originalSkillsLoaded: skillsLoaded, warnings, fullApplicationTested: false }, modelRequests: 0 };
await mkdir(path.join(root, '.cache/verification'), { recursive: true });
await writeFile(path.join(root, '.cache/verification/adapters.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
