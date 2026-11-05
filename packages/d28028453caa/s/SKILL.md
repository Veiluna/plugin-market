---
name: ai-research-skills-distributed-training-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# distributed-training

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- huggingface-accelerate: [original instructions](upstream/08-distributed-training/accelerate/SKILL.md) — Simplest distributed training API. 4 lines to add distributed support to any PyTorch script. Unified API for DeepSpeed/FSDP/Megatron/DDP. Automatic device placement, mixed precision (FP16/BF16/FP8). Interactive config, single launch command. HuggingFace ecosystem standard.
- deepspeed: [original instructions](upstream/08-distributed-training/deepspeed/SKILL.md) — Expert guidance for distributed training with DeepSpeed - ZeRO optimization stages, pipeline parallelism, FP16/BF16/FP8, 1-bit Adam, sparse attention
- training-llms-megatron: [original instructions](upstream/08-distributed-training/megatron-core/SKILL.md) — Trains large language models (2B-462B parameters) using NVIDIA Megatron-Core with advanced parallelism strategies. Use when training models >1B parameters, need maximum GPU efficiency (47% MFU on H100), or require tensor/pipeline/sequence/context/expert parallelism. Production-ready framework used for Nemotron, LLaMA, DeepSeek.
- pytorch-fsdp2: [original instructions](upstream/08-distributed-training/pytorch-fsdp2/SKILL.md) — Adds PyTorch FSDP2 (fully_shard) to training scripts with correct init, sharding, mixed precision/offload config, and distributed checkpointing. Use when models exceed single-GPU memory or when you need DTensor-based sharding with DeviceMesh.
- pytorch-lightning: [original instructions](upstream/08-distributed-training/pytorch-lightning/SKILL.md) — High-level PyTorch framework with Trainer class, automatic distributed training (DDP/FSDP/DeepSpeed), callbacks system, and minimal boilerplate. Scales from laptop to supercomputer with same code. Use when you want clean training loops with built-in best practices.
- ray-train: [original instructions](upstream/08-distributed-training/ray-train/SKILL.md) — Distributed training orchestration across clusters. Scales PyTorch/TensorFlow/HuggingFace from laptop to 1000s of nodes. Built-in hyperparameter tuning with Ray Tune, fault tolerance, elastic scaling. Use when training massive models across multiple machines or running distributed hyperparameter sweeps.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源

## Known upstream limitations

- 08-distributed-training/ray-train/references/custom-loops.md — 初始收录审查：上游 Advanced topics 引用的可选训练扩展文档未提供。
- 08-distributed-training/ray-train/references/hyperparameter-tuning.md — 初始收录审查：上游 Advanced topics 引用的可选调参扩展文档未提供。
