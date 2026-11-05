# 科研精选插件市场

为 Codex、Claude Code、DeepSeek Harness（DSH）、Cursor 和其他支持 Agent Skills 的工具，提供可追溯到上游提交的科研插件目录。

市场沿用上游插件划分，优先引用原生发行版；需要封装时保留原始技能和资源布局。每小时检查上游默认分支，通过校验后更新市场。安装到电脑或云环境中的版本由用户或客户端另行更新。

首批收录 12 个来源、37 个插件包、402 条主要发行版原始 Skill 记录。不同 agent 的可安装条目取决于兼容性限制。

**[浏览插件与兼容性目录](docs/CATALOG.md)** · [安装与云端使用](docs/INSTALL.md) · [维护与贡献](CONTRIBUTING.md) · [适配器接口](docs/ADAPTERS.md) · [验证记录](docs/VERIFICATION.md)

## 开始使用

在 Codex 桌面客户端的“添加市场”中只需输入：

```text
Veiluna/plugin-market
```

默认分支只保存索引与元数据，添加市场时不展开插件资源。安装插件时，客户端按锁定的提交检出所选插件的完整资源。Windows 的市场添加无需开启长路径或手动准备本地仓库。

### 原生市场

Codex CLI：

```sh
codex plugin marketplace add Veiluna/plugin-market
codex plugin list --marketplace scientific-agent-market --available --json
codex plugin add scientific-agent-skills@scientific-agent-market
```

Claude Code：

```sh
claude plugin marketplace add Veiluna/plugin-market
claude plugin install scientific-agent-skills@scientific-agent-market
```

原生发行版与封装版可能使用不同的安装名称，以对应 marketplace.json 中的 name 为准。完整列表和 CLI 差异见 [安装说明](docs/INSTALL.md)。

Windows 的一步添加与验证边界见 [安装说明](docs/INSTALL.md#windows-与一步添加)。

Cursor：在 Customize 中通过 From GitHub Repository 导入本仓库；团队用户可使用 Import from Repo。仓库包含 .cursor-plugin/marketplace.json。入口取决于客户端与账户支持范围，未提供该入口时使用下方 Skills 安装。

DSH：启用 Experimental plugins 中的 Custom plugin indexes，在 Discover 添加以下索引：

```text
https://raw.githubusercontent.com/Veiluna/plugin-market/HEAD/dsh/index.json
```

生成包先发布到 dist-dsh 发行分支，三种原生市场及 DSH 索引随后引用已存在的不可变提交。DSH 封装只注册 Skills，不设置模型或注册其他平台的 hooks、MCP。

### 通用 Skills 与 Codex 云端

以下命令复用固定版本的 skills CLI，并复制完整套件资源。通用安装以每个上游插件为一个套件入口，明确选择后读取内部原始技能；原生市场使用相应平台的技能划分。

```sh
npm run market -- install-skills research-paper-writing --agent codex --target /path/to/research-project
npm run market -- install-skills research-paper-writing --agent codex --target /workspace/research-project --cloud
```

云端目标必须是项目目录；安装写入真实文件，不产生指向本机的链接。请在初始化阶段安装，重新发布环境并在新任务中验证发现与资源读取。依赖本机浏览器会话的包会拒绝云端安装。

其他 agent 可以使用 universal 及其技能目录：

```sh
npm run market -- install-skills research-paper-writing --agent universal --target /path/to/project --skills-dir .your-agent/skills
```

## 维护工具与同步

维护和通用 Skills 安装需要 Node.js 24 与 Git：

```sh
git clone https://github.com/Veiluna/plugin-market.git
cd plugin-market
npm ci --ignore-scripts
npm run market -- list
```

资源只在维护或通用安装需要时恢复到忽略的 p/ 缓存，恢复后检查锁定摘要。


```sh
npm run sync -- --dry-run
npm run sync
npm run sync -- --source nature-skills
npm run validate
```

本地 sync 构建与校验目录；sync --publish-dsh 先推送共享发行分支、再生成远程索引。GitHub Actions 每小时第 17 分钟检查，也可手动运行 Synchronize upstream plugins。需要允许工作流写入内容，并允许机器人按现有分支策略提交生成产物。GitHub 调度可能延迟。

上游分支不变时不重新抓取源码，也不改写生成文件。单个来源失败时保留上一可用版本并报告，其余来源继续更新。原生上游版本号不变时仍记录新 SHA；封装使用独立分发版本。

更新已安装的通用套件：

```sh
git pull --ff-only
npm ci --ignore-scripts
npm run market -- install-skills research-paper-writing --agent codex --target /path/to/research-project --update
```

--update 只更新本市场管理且未经本地修改的目录。--force 明确替换现有目录，仅在确实要丢弃其中改动时使用。原生插件通过各客户端刷新、升级或重新安装。

## 兼容性与授权

- native：引用上游原生插件；运行仍需满足前置条件。
- skills-only：加载原始 Skills 与资源，缺失组件另行列出。
- unsupported：不提供该 agent 或云环境的安装入口。
- structure-validated：检查了格式、资源与来源；功能实测另见验证记录。

已确认的上游可选参考缺失，以 sources.json 的精确路径例外登记并显示在目录及套件入口。不会补造缺失原文；新缺失仍阻止更新。未声明的上游操作系统支持记为 unspecified。

市场实现采用 MIT；第三方插件保留自己的许可证。ARS 与 ARS-Codex 使用 CC-BY-NC-4.0，不会因由本市场分发而变成 MIT。PROVENANCE.json、UPSTREAM.json 和原始 LICENSE／NOTICE 保留来源与授权。

## 本地技能在云端变灰

OpenAI 文档说明：仓库内 Skills 可以用于云端任务，本地个人 Skills 不会自动同步。请以当前环境的发现与加载结果判断可用性。灰色标签不足以证明禁用，也不能据此确定引用渲染的具体原因。[官方云环境说明](https://learn.chatgpt.com/docs/environments/cloud-environments#current-limitations)
