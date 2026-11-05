---
name: ai-research-skills-safety-alignment-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# safety-alignment

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- constitutional-ai: [original instructions](upstream/07-safety-alignment/constitutional-ai/SKILL.md) — Anthropic's method for training harmless AI through self-improvement. Two-phase approach - supervised learning with self-critique/revision, then RLAIF (RL from AI Feedback). Use for safety alignment, reducing harmful outputs without human labels. Powers Claude's safety system.
- llamaguard: [original instructions](upstream/07-safety-alignment/llamaguard/SKILL.md) — Meta's 7-8B specialized moderation model for LLM input/output filtering. 6 safety categories - violence/hate, sexual content, weapons, substances, self-harm, criminal planning. 94-95% accuracy. Deploy with vLLM, HuggingFace, Sagemaker. Integrates with NeMo Guardrails.
- nemo-guardrails: [original instructions](upstream/07-safety-alignment/nemo-guardrails/SKILL.md) — NVIDIA's runtime safety framework for LLM applications. Features jailbreak detection, input/output validation, fact-checking, hallucination detection, PII filtering, toxicity detection. Uses Colang 2.0 DSL for programmable rails. Production-ready, runs on T4 GPU.
- prompt-guard: [original instructions](upstream/07-safety-alignment/prompt-guard/SKILL.md) — Meta's 86M prompt injection and jailbreak detector. Filters malicious prompts and third-party data for LLM apps. 99%+ TPR, <1% FPR. Fast (<2ms GPU). Multilingual (8 languages). Deploy with HuggingFace or batch processing for RAG security.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源

## Known upstream limitations

- 07-safety-alignment/constitutional-ai/references/constitution-design.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 07-safety-alignment/constitutional-ai/references/cot-critique.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 07-safety-alignment/constitutional-ai/references/rlaif-comparison.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 07-safety-alignment/llamaguard/references/benchmarks.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 07-safety-alignment/llamaguard/references/custom-categories.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 07-safety-alignment/llamaguard/references/deployment.md — 初始收录审查：上游 Advanced topics 引用的可选部署扩展文档未提供。
- 07-safety-alignment/nemo-guardrails/references/colang-guide.md — 初始收录审查：上游 Advanced topics 引用的可选 DSL 扩展文档未提供。
- 07-safety-alignment/nemo-guardrails/references/integrations.md — 初始收录审查：上游 Advanced topics 引用的可选集成扩展文档未提供。
- 07-safety-alignment/nemo-guardrails/references/performance.md — 初始收录审查：上游 Advanced topics 引用的可选性能扩展文档未提供。
