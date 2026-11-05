# 安装、更新与云端初始化

完整原生插件从对应市场安装。install-skills 只安装 Skills 套件，不注册 hooks、MCP、命令或子代理；条件、许可证及外部依赖见 [目录](CATALOG.md)。

原生市场在客户端直接添加。下方通用 Skills 与维护命令需要 Node.js 24、Git，以及在本仓库中运行 npm ci --ignore-scripts。内置 codex、claude-code、cursor、dsh、universal，用 show <package-id> 查看条件。

## Codex

```sh
codex plugin marketplace add Veiluna/plugin-market
codex plugin list --marketplace scientific-agent-market --available --json
codex plugin add scientific-agent-skills@scientific-agent-market
codex plugin marketplace upgrade scientific-agent-market
```

桌面客户端只需添加 Veiluna/plugin-market。以上是 CLI 的添加、浏览、安装与更新示例，不要求桌面用户依次执行。

### Windows 与一步添加

在 Codex 桌面客户端的“添加市场”中输入 `Veiluna/plugin-market` 即可。默认分支只包含市场索引、来源锁与维护代码；完整插件资源保存在 `dist-dsh` 发行分支。客户端在安装所选插件时读取锁定提交和子目录。

此前把全部资源放在默认分支，导致未选择的 ARS-Codex 深层文件也会在添加市场时被检出。现在这些文件不参与市场添加。用户无需开启 Git 长路径、手动克隆、修改配置或指定特殊分支。

Windows 验证使用官方 Codex CLI、关闭的 `core.longpaths`，直接以仓库名字添加市场，再安装写作、学术工具、Orchestra 与会话获取四个仓库入口，校验完整资源和技能卡片。此检查不代替各复杂上游工作流的运行验证。

### 安装前为何没有原生技能卡片

本市场的 Git 来源按需分发完整资源。当前 Codex 的 plugin/read 对未安装 Git 插件返回空的原生 skills 数组，并提示安装后才能查看完整详情；官方商店的远程目录可以由服务端提供技能预览。

本市场在条目的 interface.shortDescription 与 longDescription 中提供来源、技能数量、逐项技能名称与说明，用户可以在安装前读取这些信息。它们属于详情说明，不能强制客户端提前创建原生技能卡片。安装后会检查实际技能发现与资源访问。

该行为有 [Codex 官方回归测试](https://github.com/openai/codex/blob/86ac0916597244a2e67a197822a5483924660ff1/codex-rs/app-server/tests/suite/v2/plugin_read.rs#L2290) 覆盖，本市场也使用 app-server 的实际返回值验证安装前的清单和安装后的技能卡片。

### 按最初的 12 个仓库浏览

市场现在每个仓库提供一个入口，标题使用完整的 owner/repo，索引沿用最初提供的顺序。Codex 索引包含全部 12 个来源，详情按上游子分类列出技能；其中 11 个可安装，Claude 专用 ARS 标明不可安装，并指向独立的 ARS-Codex 发行版。CLI/API 已验证可枚举全部 12 项；桌面端如何展示不可安装项尚未验证，不能保证其列表一定显示 12 项。

| 来源 | 市场入口 | 入口内的原有分类 |
| --- | ---: | ---: |
| Orchestra AI-Research-SKILLs | 1 | 23 |
| codex-claude-academic-skills | 1 | 3 |
| sciencedirect-live-session-fetcher | 1 | 2 |
| 其他 9 个仓库 | 9 | 各 1 |
| 合计 | 12 | 37 |

安装一个仓库入口会注册其中全部适用技能，原始资源仍保留。Claude Code、Cursor、DSH 各列出 10 个适用入口，平台不兼容的发行版见完整目录。

此前按上游子插件分别发行，Codex 旧索引有 36 项。已添加市场的用户更新市场快照即可取得新分组，无需改变添加方式。已单独安装的旧子插件保留原状；安装对应仓库入口后，可通过客户端移除不再需要的旧子插件，避免重复技能。通用 install-skills 命令仍接受旧子包 ID，并解析到新的仓库套件。

### 仍显示旧子插件或找不到 academic-research-skills

GitHub 上的市场更新与客户端保存的市场快照是两次操作。Codex 对已经添加的同一 Git 来源返回 alreadyAdded，复用现有快照；再次输入 Veiluna/plugin-market 不会强制取得最新索引。请真正更新市场快照，然后重新打开市场页面：

```sh
codex plugin marketplace upgrade scientific-agent-market
```

已用独立配置复现：旧快照有 36 项，重复 add 后仍为 36 项；执行上述 upgrade 后变为 12 项。此检查不代表已经读取或修复某位用户电脑上的缓存。若更新没有生效，使用 `codex plugin marketplace list --json` 检查来源是否仍是早期的本地目录或固定旧提交；本地目录来源不会由 Git upgrade 拉取。更新市场快照也不会自动卸载已安装的旧子插件。

原仓库 Imbad0202/academic-research-skills 是 Claude Code 发行版，在旧 Codex 索引中未列出；最新版以内部名称 ars-claude 收录，Codex 安装策略为 NOT_AVAILABLE。不能用它验证 Codex 的完整流水线。Codex 对应独立发行版为 Imbad0202/academic-research-skills-codex，安装名称是：

```sh
codex plugin add ars-codex@scientific-agent-market
```

Claude Code 中原版的安装名称仍为 academic-research-skills，两个发行版没有合并。完整 12 仓库列表始终可在 [目录](CATALOG.md) 中查阅。

## Claude Code

```sh
claude plugin marketplace add Veiluna/plugin-market
claude plugin install scientific-agent-skills@scientific-agent-market
claude plugin marketplace update scientific-agent-market
```

原生插件保留 manifest 名称，封装使用目录中的包 ID。请通过 .claude-plugin/marketplace.json 或客户端列表确认安装名。

## Cursor

在 Customize 中导入本 GitHub 仓库，或由团队管理员 Import from Repo。没有仓库导入入口时使用：

```sh
npm run market -- install-skills research-paper-writing --agent cursor --target /path/to/project
```

封装使用显式技能路径，原始脚本和共享资源保持原来的相对目录关系。

## DSH

将 README 中的 HTTPS JSON 地址加入 Discover 的索引来源，刷新后选择符合运行版本的 bundle。索引只引用已推送的发行提交，Versions 中保留历史版本。

也可仅安装项目内套件入口：

```sh
npm run market -- install-skills research-paper-writing --agent dsh --target /path/to/project
```

DSH 封装使用 dsh-skill-filesystem 的 bundledSkillDir 接口。索引格式校验与运行兼容性是不同检查，客户端实测状态见 [验证记录](VERIFICATION.md)。

## Codex Cloud

在初始化阶段把市场克隆到环境中，安装工具依赖，再把选定套件安装到已存在的实际项目：

```sh
npm run market -- install-skills research-paper-writing --agent codex --cloud --target /workspace/my-research
```

该命令生成项目内 .agents/skills/research-paper-writing-suite/SKILL.md、完整 upstream/ 资源及来源记录。明确请求使用 research-paper-writing-suite，再确认能读取内部原始指令和参考文件。Codex 可能递归列出原始子技能；套件入口使用独立名称，避免与原始技能重名。

按环境配置流程发布或重新发布，在新任务中验证。现有任务保留自己的状态，不会随市场目录自动升级。市场不读取或复制电脑上的个人技能目录。

## 更新与目录保护

更新市场代码后，在相同安装命令中添加 --update；该选项检查安装收据与内容，有本地改动时保留目录并失败。显式 --force 才允许替换。首次安装也不会默默覆盖同名技能。

项目安装默认使用对应 agent 的目录。--scope user 使用用户目录；--skills-dir 是相对于目标项目或用户目录的自定义技能根。Codex Cloud 必须使用项目安装。

部分原生客户端按上游版本号缓存内容；上游只改提交而未加版本时，可能需要重新安装才能取得锁定的新提交。本市场封装另行增加分发版本。
