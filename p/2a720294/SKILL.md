---
name: ars-codex-ars-codex-suite
description: "ARS 的独立 Codex 原生发行版，保留自己的版本与运行适配。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# ars-codex

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Imbad0202/academic-research-skills-codex/tree/a1556557887f345aac99bdc6027e008e91fef236
License: CC-BY-NC-4.0

## Skills

- academic-research-suite: [original instructions](upstream/plugins/ars-codex/skills/academic-research-suite/SKILL.md) — ARS-Codex research, writing, manuscript review, study screening, and experiments. Use for deep research, literature or systematic reviews, meta-analysis, research questions, drafts, revisions, roadmaps, abstracts, citations, integrity checks, peer review, research-to-paper. Screen records: sr-screener. Citation triggers: check citations, look over the refs, 檢查引用, 檢查參考文獻, 인용 확인, 인용 형식 검사. Korean: 논문 심사, 논문 수정, 초록 작성, 체계적 문헌고찰, 연구부터 논문까지. Español: revisión de literatura, revisar artículo, enmendar mi artículo, escribir resumen, investigación a artículo. Also use for ARS aliases: /ars-plan, /ars-outline, /ars-abstract, /ars-lit-review, /ars-citation-check, /ars-disclosure, /ars-format-convert, /ars-3w, /ars-revision-coach, /ars-revision, /ars-reviewer, /ars-mark-read, /ars-unmark-read, /ars-cache-invalidate, /ars-rebuttal-audit, /ars-full. Prompts, references, templates, and contracts live under ars/.

## Requirements

- 完整运行依赖 Codex 原生代理、脚本与上游配置
