# 验证记录

首次实现验证于 2026-11-05，使用 Node.js 24.22.1。锁定的上游提交以 [lock.json](../catalog/lock.json) 为准；验证不运行上游安装脚本或科研工作流。

## 收录与资源

- 12 个去重来源、12 个仓库入口，内部保留 37 个上游插件分组和 402 条主要发行版原始 Skill 记录。
- Codex 展示全部 12 个来源，11 个可安装，Claude 专用 ARS 标为 NOT_AVAILABLE；Claude Code、Cursor、DSH 各提供 10 个兼容仓库入口。ARS 与 ARS-Codex 独立保留。
- 目录与市场索引保持原始来源顺序；三处多插件仓库分别合并为 23、3、2 个子分类的集合，安装入口注册全部适用技能。
- 资源摘要、原始目录关系、平台技能变体、许可证、原生组件声明均校验；ARS 根目录模式注册表随封装保留。
- Orchestra 上游已有 17 处可选参考文档缺失，精确路径与原因公开在目录中。新缺失仍阻止来源升级。

## 客户端与 SDK

| 对象 | 验证环境 | 已执行 | 尚未执行 |
| --- | --- | --- | --- |
| Codex | CLI 0.166.0-alpha.1，当前 Linux 云环境 | 发现全部 12 个仓库入口；实际安装写作插件；app-server 的 skills/list 发现原生插件技能；原始指令可读；不兼容条目禁止安装 | 每个复杂研究插件的端到端运行、桌面客户端 UI |
| Codex 项目 Skills | 同上，固定 skills CLI 1.7.6 | 复制到含中文及空格的项目路径；新启动的 Codex 发现 research-paper-writing-suite；读取内部原始 SKILL.md 与 references 文件 | 用户账户中重新发布云环境后的新任务 |
| Claude Code | 官方 CLI 2.1.318 | 官方 manifest 校验；发现全部 10 个兼容仓库入口；实际安装写作、学术工具、Orchestra、会话获取；plugin details 核对全部技能组件 | 模型执行、桌面 UI、复杂插件的完整工作流 |
| Cursor | 官方 cursor/plugins 的 JSON schemas，提交 2776ddd2355d6d6c8747d3964600f28daf62f049 | 市场及全部 10 个集合 manifest 通过官方 schema | Cursor 客户端发现、安装与模型加载 |
| DeepSeek Harness | 官方 index 与 filesystem Skills SDK 0.2.1-rc.5 | 原生索引解析与 Git 安装目标解析；10 个 bundle 精确注册并加载全部 400 个兼容原始技能 | 完整 DSH 客户端的 Discover、安装和会话运行 |

安装前预览另以真实 plugin/read 检查全部 12 个 Codex 条目：详情元数据按原有子分类列出 402 条技能名称与说明，其中 397 条适用于 Codex，5 条属于标为不可安装的 Claude 专用 ARS。当前 Codex 对未安装 Git 来源返回空的原生 skills 数组；安装前使用详情说明提供技能清单，不能强制客户端创建原生技能卡片。Windows 验证还在四个仓库集合安装后读取实际技能卡片。

以上检查未发出模型 API 请求。Cursor 与 DSH 完整客户端验收仍需在安装了对应客户端的环境中完成，不能把 schema／SDK 校验当成 GUI 实测。

Codex、Claude 的验证使用缓存中的独立配置目录，未修改当前用户的实际插件配置。递归发现的客户端可能同时列出原始技能与独立命名的套件入口；入口禁止自动模型调用，DSH 则只注册上游明确发布的原始技能。DSH 的普通 README 等 Markdown 被官方 provider 忽略时会产生提示，不影响技能集合。

## 自动化回归

`npm run check` 执行类型检查、29 项回归测试以及真实产物校验。覆盖仓库集合的完整安装与资源访问、原有子分类与平台技能变体、源顺序、内部重名回退、不可安装条目、旧子包 ID 解析，以及默认分支解析、重复同步、提交变化但上游版本不变、资源缺失、无效元数据和清单、来源不可访问、重名、许可证变化、保留旧版、摘要篡改、跨系统文件模式、完整复制、已有目录与本地改动保护、安装失败回滚、路径逃逸及 DSH 历史提交可达性。

Windows 一步添加采用索引与资源分离。默认分支没有任何 p/ 或 packages/ 资源目录；Codex 通过 git-subdir 只检出所选插件的固定发行提交。资源在发行分支完整保留，原始路径与许可证不丢失。归档恢复和摘要不匹配另有回归检查。

原生 Windows 作业关闭全局 core.longpaths，使用固定官方 Codex CLI 0.166.0-alpha.1，在与报告中用户配置前缀相同长度的独立测试配置下，仅传入 Veiluna/plugin-market 添加公开市场；确认没有检出插件资源，发现全部 12 个仓库入口并阻止不兼容条目安装，再安装写作、学术工具、Orchestra 与会话获取四个集合，校验完整资源和全部原始技能卡片。未使用本地市场、稀疏参数、特殊分支或长路径开关。命令见 [安装说明](INSTALL.md#windows-与一步添加)。

复现可选的官方客户端／SDK 验证：

```sh
npm run verify:codex
npm run verify:preview
npm run verify:claude
npm run verify:adapters
```

前两项需要对应官方 CLI，可分别通过 MARKET_CODEX_BINARY、MARKET_CLAUDE_BINARY 指定可执行文件。安装和 schema 获取可能需要网络。详细机器结果写入被忽略的 .cache/verification/；这些脚本不属于普通 CI 的必备客户端依赖。

## 发布检查

按仓库分组的共享发行提交为 [f49bca36c12d7b9a72100547e18bee2e5f7f55c5](https://github.com/Veiluna/plugin-market/commit/f49bca36c12d7b9a72100547e18bee2e5f7f55c5)，完整保存 12 个仓库集合；其中 10 个适用于 DSH。先推送 dist-dsh 的实际提交，再写入主分支索引。仓库 CI 会从发行提交恢复资源后重新校验摘要；旧子插件和旧分发版本继续存在于不可变的历史提交中。GitHub 每小时调度可能延迟，本机已安装版本不会被市场提交自动替换。

灰色技能引用的渲染原因仍未确认。本实现验证的是环境中的实际发现、安装与资源加载，不声称改变客户端标签颜色。
