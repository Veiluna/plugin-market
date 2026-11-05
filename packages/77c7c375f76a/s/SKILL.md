---
name: academic-toolkit-scientific-toolkit-skill-suite
description: "中文学术写作、Office 文档与科研计算技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# scientific-toolkit-skill

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/zLanqing/codex-claude-academic-skills/tree/7ed6377f0efb6a38951b48ef03b19d996e454b1f
License: MIT

## Skills

- scientific-toolkit-skill: [original instructions](upstream/scientific-toolkit-skill/SKILL.md) — Research computing toolkit for optoelectronic information science and engineering, MATLAB/Octave, Python scientific analysis, signal processing, image processing, statistics, simulation, optimization, publication figures, sensor/time-series data, citation lookup, and common scientific libraries. Use when the user asks for MATLAB code, scientific Python, data analysis, plots, simulations, formulas, statistics, machine learning, optical/physical/materials computation, or reproducible research workflows.

## Requirements

- 文档或科学计算功能需要相应本地工具、Python 包或 MATLAB/Octave
