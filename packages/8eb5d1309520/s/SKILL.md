---
name: codex-autoresearch-suite
description: "Codex 原生、以可测指标驱动的自动实验与回退工作流。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# codex-autoresearch

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/leo-lilinxiao/codex-autoresearch/tree/0f54c571707487f59486ba7c50d405edfc746c19
License: MIT

## Skills

- codex-autoresearch: [original instructions](upstream/SKILL.md) — Run repeated, measured Git experiments toward a numeric target; keep improvements and revert failures. Use for autonomous optimization or managing an autoresearch run, not one-shot edits.

## Requirements

- Codex CLI、干净的 Git 分支与上游要求的运行能力
