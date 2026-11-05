---
name: ai-research-skills-ml-paper-writing-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# ml-paper-writing

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- ml-paper-writing: [original instructions](upstream/20-ml-paper-writing/ml-paper-writing/SKILL.md) — Write publication-ready ML/AI papers for NeurIPS, ICML, ICLR, ACL, AAAI, COLM. Use when drafting papers from research repos, structuring arguments, verifying citations, or preparing camera-ready submissions. For systems venues (OSDI, NSDI, ASPLOS, SOSP), use systems-paper-writing instead.
- academic-plotting: [original instructions](upstream/20-ml-paper-writing/academic-plotting/SKILL.md) — Generates publication-quality figures for ML papers from research context. Given a paper section or description, extracts system components and relationships to generate architecture diagrams via Gemini. Given experiment results or data, auto-selects chart type and generates data-driven figures via matplotlib/seaborn. Use when creating any figure for a conference paper.
- systems-paper-writing: [original instructions](upstream/20-ml-paper-writing/systems-paper-writing/SKILL.md) — Comprehensive guide for writing systems papers targeting OSDI, SOSP, ASPLOS, NSDI, and EuroSys. Provides paragraph-level structural blueprints, writing patterns, venue-specific checklists, reviewer guidelines, LaTeX templates, and conference deadlines. Use this skill for all systems conference paper writing.
- presenting-conference-talks: [original instructions](upstream/20-ml-paper-writing/presenting-conference-talks/SKILL.md) — Generates conference presentation slides (Beamer LaTeX PDF and editable PPTX) from a compiled paper with speaker notes and talk script. Use when preparing oral talks, spotlight presentations, or invited talks for ML and systems conferences.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源
