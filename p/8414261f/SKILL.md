---
name: ai-research-skills-post-training-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# post-training

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- grpo-rl-training: [original instructions](upstream/06-post-training/grpo-rl-training/SKILL.md) — Expert guidance for GRPO/RL fine-tuning with TRL for reasoning and task-specific model training
- miles-rl-training: [original instructions](upstream/06-post-training/miles/SKILL.md) — Provides guidance for enterprise-grade RL training using miles, a production-ready fork of slime. Use when training large MoE models with FP8/INT4, needing train-inference alignment, or requiring speculative RL for maximum throughput.
- openrlhf-training: [original instructions](upstream/06-post-training/openrlhf/SKILL.md) — High-performance RLHF framework with Ray+vLLM acceleration. Use for PPO, GRPO, RLOO, DPO training of large models (7B-70B+). Built on Ray, vLLM, ZeRO-3. 2× faster than DeepSpeedChat with distributed architecture and GPU resource sharing.
- simpo-training: [original instructions](upstream/06-post-training/simpo/SKILL.md) — Simple Preference Optimization for LLM alignment. Reference-free alternative to DPO with better performance (+6.4 points on AlpacaEval 2.0). No reference model needed, more efficient than DPO. Use for preference alignment when want simpler, faster training than DPO/PPO.
- slime-rl-training: [original instructions](upstream/06-post-training/slime/SKILL.md) — Provides guidance for LLM post-training with RL using slime, a Megatron+SGLang framework. Use when training GLM models, implementing custom data generation workflows, or needing tight Megatron-LM integration for RL scaling.
- torchforge-rl-training: [original instructions](upstream/06-post-training/torchforge/SKILL.md) — Provides guidance for PyTorch-native agentic RL using torchforge, Meta's library separating infra from algorithms. Use when you want clean RL abstractions, easy algorithm experimentation, or scalable training with Monarch and TorchTitan.
- fine-tuning-with-trl: [original instructions](upstream/06-post-training/trl-fine-tuning/SKILL.md) — Fine-tune LLMs using reinforcement learning with TRL - SFT for instruction tuning, DPO for preference alignment, PPO/GRPO for reward optimization, and reward model training. Use when need RLHF, align model with preferences, or train from human feedback. Works with HuggingFace Transformers.
- verl-rl-training: [original instructions](upstream/06-post-training/verl/SKILL.md) — Provides guidance for training LLMs with reinforcement learning using verl (Volcano Engine RL). Use when implementing RLHF, GRPO, PPO, or other RL algorithms for LLM post-training at scale with flexible infrastructure backends.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源

## Known upstream limitations

- 06-post-training/verl/references/multi-turn.md — 初始收录审查：上游 Advanced Topics 引用的可选多轮扩展文档未提供。
