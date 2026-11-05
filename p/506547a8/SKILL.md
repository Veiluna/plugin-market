---
name: latex-arxiv-suite
description: "保留写作器与协作辅助技能的 arXiv LaTeX 综述工作流。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# latex-arxiv

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/appautomaton/latex-arxiv-SKILL/tree/b5b058350796bd6c9df7725a5d2e1607a9d45b2a
License: MIT

## Skills

- arxiv-paper-writer: [original instructions](upstream/.codex/skills/arxiv-paper-writer/SKILL.md) — Write LaTeX ML/AI review articles for arXiv using the IEEEtran template and verified BibTeX citations. Use when writing, planning, or continuing an arXiv review/survey paper, or when validating and repairing citations in an existing LaTeX project.
- collaborating-with-claude: [original instructions](upstream/.codex/skills/collaborating-with-claude/SKILL.md) — Use the Claude Code CLI to consult Claude and delegate coding tasks for prototyping, debugging, and code review. Supports multi-turn sessions via SESSION_ID. Optimized for low-token, file/line-based handoff.
- collaborating-with-gemini: [original instructions](upstream/.codex/skills/collaborating-with-gemini/SKILL.md) — Use the Gemini CLI to consult Gemini and delegate coding tasks for prototyping, debugging, and code review. Supports multi-turn sessions via SESSION_ID. Optimized for low-token, file/line-based handoff.
- latex-rhythm-refiner: [original instructions](upstream/.codex/skills/latex-rhythm-refiner/SKILL.md) — Post-process LaTeX project prose to improve readability through varied sentence and paragraph lengths. Removes filler phrases and unnecessary transitions while preserving all citations and semantic meaning. Use after drafting is complete, when sections read as monotonous or blocky.

## Requirements

- Python、pdflatex、BibTeX
- 协作功能还需要对应 agent CLI
