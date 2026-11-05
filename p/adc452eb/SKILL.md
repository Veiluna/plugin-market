---
name: literature-downloader-suite
description: "中文文献检索、候选筛选、合法全文获取与下载报告。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# literature-downloader-skill

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Lucaswangzcx/literature-downloader-skill/tree/0e8f306fc5205fc90657fbd916a952fa9c9d773a
License: MIT

## Skills

- literature-downloader: [original instructions](upstream/SKILL.md) — 中文文献检索、筛选、批量采集和合法全文获取助手。用于用户需要查找论文、下载可合法获取的 PDF/HTML/XML 全文、生成关键词和检索式、查询 DOI/PMID、筛选高影响因子或高分区期刊、检查开放获取、做引用链扩展、批量文献候选表、下载日志、去重清单、Zotero/BibTeX 整理，或解决文献难下载问题；禁止绕过付费墙、盗版下载、共享账号或规避版权限制。


## Requirements

- Python 与可访问的文献服务；机构登录资源需要另行授权
