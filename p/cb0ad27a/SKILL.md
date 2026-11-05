---
name: academic-toolkit-suite
description: "中文学术写作、Office 文档与科研计算技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# codex-claude-academic-skills

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/zLanqing/codex-claude-academic-skills/tree/7ed6377f0efb6a38951b48ef03b19d996e454b1f
License: MIT

## Skills

### research-writing-skill

- research-writing-skill: [original instructions](upstream/research-writing-skill/SKILL.md) — Chinese-first research paper writing, revision, polishing, section drafting, rebuttal, peer-review response, thesis prose improvement, and manuscript argument planning. Use when the user asks to write or revise论文正文, abstracts, introductions, methods, results, discussion, conclusions, related work, responses to reviewers, LaTeX/Overleaf text, or academic prose. Preserve formulas, English paper titles, terms, citations, and measured results.

### office-academic-skill

- office-academic-skill: [original instructions](upstream/office-academic-skill/SKILL.md) — Chinese-first academic Word and PowerPoint workflow for paper reading reports, thesis or group-meeting PPTs, editable DOCX/PPTX generation, Office file inspection, template matching, speaker notes, and layout quality checks. Use when the user asks to read papers into Word reports, create or polish PPT/PPTX, convert paper/thesis materials into slides, edit DOCX/PPTX, inspect Office files, or produce Chinese academic presentation/report deliverables. Preserve English paper titles, formulas, variable names, software commands, and references.

### scientific-toolkit-skill

- scientific-toolkit-skill: [original instructions](upstream/scientific-toolkit-skill/SKILL.md) — Research computing toolkit for optoelectronic information science and engineering, MATLAB/Octave, Python scientific analysis, signal processing, image processing, statistics, simulation, optimization, publication figures, sensor/time-series data, citation lookup, and common scientific libraries. Use when the user asks for MATLAB code, scientific Python, data analysis, plots, simulations, formulas, statistics, machine learning, optical/physical/materials computation, or reproducible research workflows.


## Requirements

- 文档或科学计算功能需要相应本地工具、Python 包或 MATLAB/Octave
