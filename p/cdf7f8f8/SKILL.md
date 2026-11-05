---
name: live-session-fetcher-suite
description: "复用已获授权的本地浏览器会话，串行获取学术全文。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# sciencedirect-live-session-fetcher

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Given-Dream/sciencedirect-live-session-fetcher/tree/0a24d96b0044e0be03efa2f1daafa84f81a9ebb9
License: MIT

## Skills

### sciencedirect-live-session-fetcher

- sciencedirect-live-session-fetcher: [original instructions](upstream/codex-skill/SKILL.md) — Download scholarly PDFs serially through a lawful live Chrome, Edge, or Firefox session when direct HTTP is blocked by login, institutional authentication, bot checks, attachment handling, or an internal PDF viewer. Use for ScienceDirect/Elsevier, Wiley Online Library and AGU/Wiley, Canadian Science Publishing, AIP Publishing, IEEE Xplore, and other publisher pages that expose an authorized PDF route.

### literature-live-session-pipeline

- literature-live-session-pipeline: [original instructions](upstream/literature-live-session-pipeline/SKILL.md) — Orchestrate lawful literature collection through live Microsoft Edge sessions across ScienceDirect, CNKI, and Web of Science, then create an EndNote X9 library, import RIS metadata, and group records by section_paths from a manifest CSV. Use when browser login or bot verification blocks direct fetching, when the user wants separate browser sessions per source, or when a paper batch must be downloaded into a folder and mirrored into a grouped EndNote library.


## Requirements

- 本机 Chrome、Edge 或 Firefox 的已授权登录会话
- Python 与浏览器自动化依赖
