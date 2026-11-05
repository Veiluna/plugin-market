export type AgentId = 'codex' | 'claude-code' | 'cursor' | 'dsh' | 'universal';
export type CloudSupport = 'supported' | 'conditional' | 'unsupported';
export type JsonObject = Record<string, unknown>;

export interface SkillGroup {
  name: string;
  roots?: string[];
  containers?: string[];
}
export interface SourceDefinition {
  id: string;
  repository: string;
  family?: string;
  license: string;
  description: string;
  discovery: { kind: 'plugin'; root: string } | { kind: 'marketplace'; manifest: string } | { kind: 'skills'; packages: SkillGroup[] };
  resources: string[];
  requirements: string[];
  cloud: CloudSupport;
  operatingSystems?: string[];
  restrictedAgents?: Partial<Record<AgentId, string>>;
  resourceExceptions?: { path: string; reason: string }[];
}
export interface MarketConfig {
  name: string;
  title: string;
  repository: string;
  publisher: string;
  distributionBranch: string;
  skillsCliVersion: string;
}
export interface SkillRecord { name: string; description: string; path: string }
export interface NativeSource {
  root: string;
  manifest?: JsonObject;
  entry?: JsonObject;
}
export interface PackageDefinition {
  id: string;
  name: string;
  description: string;
  sourceId: string;
  sourceRoot: string;
  skills: SkillRecord[];
  native: Partial<Record<AgentId, NativeSource>>;
  agentSkills: Partial<Record<AgentId, SkillRecord[]>>;
  upstreamVersion?: string;
}
export interface Compatibility {
  level: 'native' | 'skills-only' | 'unsupported';
  reason: string;
  verification: 'structure-validated' | 'client-loaded';
  missingCapabilities: string[];
}
export interface PackageRecord extends PackageDefinition {
  repository: string;
  family?: string;
  license: string;
  sha: string;
  digest: string;
  artifactHash: string;
  distributionVersion: string;
  packagePath: string;
  genericSkillPath: string;
  genericSkillName?: string;
  cloud: CloudSupport;
  operatingSystems: string[];
  requirements: string[];
  compatibility: Record<AgentId, Compatibility>;
  nativeCapabilities: string[];
  knownIssues: string[];
}
export interface LockedSource {
  repository: string;
  branch: string;
  sha: string;
  definitionDigest: string;
  packages: PackageRecord[];
}
export interface CatalogLock {
  version: 1;
  sources: Record<string, LockedSource>;
}
export interface Catalog {
  version: 1;
  name: string;
  description: string;
  sources: { id: string; repository: string; family?: string; license: string; sha?: string; status: 'ready' | 'unavailable'; error?: string }[];
  packages: PackageRecord[];
}
export interface SyncReport {
  changed: string[];
  unchanged: string[];
  failed: { id: string; error: string }[];
}
export interface Checkout { directory: string; branch: string; sha: string }
export interface AgentAdapter {
  id: AgentId;
  label: string;
  marketplacePath?: string;
  projectSkills: string;
  userSkills?: string;
}
