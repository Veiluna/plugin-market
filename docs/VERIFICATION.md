# 验证记录

首次实现验证于 2026-11-05，使用 Node.js 24.22.1。锁定的上游提交以 [lock.json](../catalog/lock.json) 为准；验证不运行上游安装脚本或科研工作流。

## 收录与资源

- 12 个去重来源，37 个上游划分的插件包，402 条主要发行版原始 Skill 记录。
- Codex 市场 36 项；Claude Code、Cursor、DSH 各 35 项。差异来自明确的平台限制，ARS 与 ARS-Codex 独立保留。
- 资源摘要、原始目录关系、平台技能变体、许可证、原生组件声明均校验；ARS 根目录模式注册表随封装保留。
- Orchestra 上游已有 17 处可选参考文档缺失，精确路径与原因公开在目录中。新缺失仍阻止来源升级。

## 客户端与 SDK

| 对象 | 验证环境 | 已执行 | 尚未执行 |
| --- | --- | --- | --- |
| Codex | CLI 0.166.0-alpha.1，当前 Linux 云环境 | 发现全部 36 项；实际安装写作插件；app-server 的 skills/list 发现原生插件技能；原始指令可读 | 每个复杂研究插件的端到端运行、桌面客户端 UI |
| Codex 项目 Skills | 同上，固定 skills CLI 1.7.6 | 复制到含中文及空格的项目路径；新启动的 Codex 发现 research-paper-writing-suite；读取内部原始 SKILL.md 与 references 文件 | 用户账户中重新发布云环境后的新任务 |
| Claude Code | 官方 CLI 2.1.318 | 官方 manifest 校验；发现本市场全部 35 项；实际安装写作插件；plugin details 加载技能组件清单 | 模型执行、桌面 UI、其他复杂插件的完整工作流 |
| Cursor | 官方 cursor/plugins 的 JSON schemas，提交 2776ddd2355d6d6c8747d3964600f28daf62f049 | 市场及全部 35 个插件 manifest 通过官方 schema | Cursor 客户端发现、安装与模型加载 |
| DeepSeek Harness | 官方 index 与 filesystem Skills SDK 0.2.1-rc.5 | 原生索引解析与 Git 安装目标解析；35 个 bundle 精确注册并加载全部 400 个兼容原始技能 | 完整 DSH 客户端的 Discover、安装和会话运行 |

以上检查未发出模型 API 请求。Cursor 与 DSH 完整客户端验收仍需在安装了对应客户端的环境中完成，不能把 schema／SDK 校验当成 GUI 实测。

Codex、Claude 的验证使用缓存中的独立配置目录，未修改当前用户的实际插件配置。递归发现的客户端可能同时列出原始技能与独立命名的套件入口；入口禁止自动模型调用，DSH 则只注册上游明确发布的原始技能。DSH 的普通 README 等 Markdown 被官方 provider 忽略时会产生提示，不影响技能集合。

## 自动化回归

`npm run check` 执行类型检查、23 项回归测试以及真实产物校验。覆盖默认分支解析、重复同步、提交变化但上游版本不变、资源缺失、无效元数据和清单、来源不可访问、重名、许可证变化、保留旧版、摘要篡改、跨系统文件模式、完整复制、已有目录与本地改动保护、安装失败回滚、路径逃逸及 DSH 历史提交可达性。

Windows 用户报告的 Codex 暂存目录触发了 Filename too long。封装已改用 packages/<12 位摘要>/s/upstream，去掉重复长包名，公开插件 ID 与技能名不变。新增回归检查该目录前缀下的长资源路径，以及旧目录迁移与资源保留。缩短路径后，ARS-Codex 仍含深层上游资源，因此直接通过 GitHub 来源添加市场时，core.longpaths=false 仍可能失败。

无需开启长路径的入口是短目录中的本地市场。原生 Codex 已确认本地来源原地注册，不再次克隆进 .staging。关闭长路径的 Windows 作业将全局 core.longpaths 保持为 false，以 false 配置在短目录执行真实 clone／checkout、核对全部 37 个包摘要；再使用固定的官方 Codex CLI 0.166.0-alpha.1 注册来源、发现条目并实际安装写作、Office 与科研工具三个封装，逐个验证完整资源。独立作业仍保留显式 true 的深层目录校验。命令及无 CLI 时的桌面配置见 [安装排错](INSTALL.md#windows-出现-filename-too-long)。

复现可选的官方客户端／SDK 验证：

```sh
npm run verify:codex
npm run verify:claude
npm run verify:adapters
```

前两项需要对应官方 CLI，可分别通过 MARKET_CODEX_BINARY、MARKET_CLAUDE_BINARY 指定可执行文件。安装和 schema 获取可能需要网络。详细机器结果写入被忽略的 .cache/verification/；这些脚本不属于普通 CI 的必备客户端依赖。

## 发布检查

DSH 首次发行包含 35 个 bundle，提交为 [aaaf79a89b30e803f310942fab8e907e74db6c84](https://github.com/Veiluna/plugin-market/commit/aaaf79a89b30e803f310942fab8e907e74db6c84)。先推送 dist-dsh 的实际提交，再写入主分支索引。发行后从该 Git 提交重新检出并校验资源摘要。仓库 CI 也会从 Git 检出后重新执行完整校验；旧分发版本继续指向各自的不可变提交。GitHub 每小时调度可能延迟，本机已安装版本不会被市场提交自动替换。

灰色技能引用的渲染原因仍未确认。本实现验证的是环境中的实际发现、安装与资源加载，不声称改变客户端标签颜色。
