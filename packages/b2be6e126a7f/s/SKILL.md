---
name: ai-research-skills-infrastructure-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# infrastructure

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- lambda-labs-gpu-cloud: [original instructions](upstream/09-infrastructure/lambda-labs/SKILL.md) — Reserved and on-demand GPU cloud instances for ML training and inference. Use when you need dedicated GPU instances with simple SSH access, persistent filesystems, or high-performance multi-node clusters for large-scale training.
- modal-serverless-gpu: [original instructions](upstream/09-infrastructure/modal/SKILL.md) — Serverless GPU cloud platform for running ML workloads. Use when you need on-demand GPU access without infrastructure management, deploying ML models as APIs, or running batch jobs with automatic scaling.
- skypilot-multi-cloud-orchestration: [original instructions](upstream/09-infrastructure/skypilot/SKILL.md) — Multi-cloud orchestration for ML workloads with automatic cost optimization. Use when you need to run training or batch jobs across multiple clouds, leverage spot instances with auto-recovery, or optimize GPU costs across providers.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源
