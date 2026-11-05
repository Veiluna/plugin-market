# 来源、包与适配器接口

src/types.ts 定义 SourceDefinition、PackageDefinition、PackageRecord、AgentAdapter 与同步锁。

## 数据流

来源清单 → 默认分支及 SHA → 上游包与平台变体 → 资源复制与校验 → 平台清单 → 先发行 DSH 包、再发布索引。

- sources.json 是维护者编辑的声明。
- catalog/lock.json 保留来源分支、提交、定义摘要及最后通过的包。
- catalog/catalog.json 公开兼容范围、验证层级、环境限制、已知问题与来源。
- packages/<12 位摘要>/ 保存必要封装，内部入口目录固定为 s，避免在 Windows 路径中重复长包名；公开包 ID 与 -suite 技能名称保持不变。位置由 packagePath、genericSkillPath 和 genericSkillName 指定，原资源位于入口的 upstream/ 下。
- .agents、.claude-plugin、.cursor-plugin 包含各自原生清单。
- dsh/index.json 只引用已发行 bundle；pending.json 是构建队列，不能作为 DSH 索引导入。

ARS 与 ARS-Codex 保留独立仓库、提交和包身份。结构校验通过不表示研究结果或跨平台工作流已实测。

## 增加 agent

在 src/adapters.ts 注册 id、名称、技能路径及市场位置；同步更新 types.ts、config 校验，提供输出格式与资源检查，加入重名、路径、环境限制测试。

暂未内置的 agent 使用 install-skills --agent universal --skills-dir <relative/path>。安装器调用固定版本 skills CLI，检查完整副本后再替换目标；有本地修改时默认拒绝更新。

native 输出引用锁定的上游原生来源，skills-only 只暴露技能。每个目标的缺失组件与前置条件显示在目录中，没有适配的目标标为 unsupported。

## 可追溯性

PackageRecord 记录源提交、上游版本、分发版本、内容摘要、完整封装 artifactHash。哈希不依赖 Windows／POSIX 文件模式差异。PROVENANCE.json、入口内 UPSTREAM.json 和原许可证随包分发。

resources 与技能根组成资源边界。内部符号链接发行时复制成真实文件；绝对路径、逃逸或循环链接、无效元数据、新缺失资源阻止该来源更新。上游代码缓存是可丢弃的工作副本，不用于保存用户修改。
