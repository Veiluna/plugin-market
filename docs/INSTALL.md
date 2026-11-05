# 安装、更新与云端初始化

完整原生插件从对应市场安装。install-skills 只安装 Skills 套件，不注册 hooks、MCP、命令或子代理；条件、许可证及外部依赖见 [目录](CATALOG.md)。

先运行 npm ci --ignore-scripts，再运行 npm run market -- list --agent <agent>。内置 codex、claude-code、cursor、dsh、universal，用 show <package-id> 查看条件。

## Codex

```sh
codex plugin marketplace add Veiluna/plugin-market
codex plugin list --marketplace scientific-agent-market --available --json
codex plugin add scientific-agent-skills@scientific-agent-market
codex plugin marketplace upgrade scientific-agent-market
```

语法依据本次可用的 Codex CLI 帮助。客户端也可在插件来源中选择本市场。本地仓库可使用 codex plugin marketplace add /absolute/path/to/plugin-market。

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
