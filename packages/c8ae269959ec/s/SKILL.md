---
name: ai-research-skills-model-architecture-suite
description: "按上游分类插件组织的 AI 研究与工程技能。 使用原始技能与配套资源的套件入口。"
disable-model-invocation: true
---

# model-architecture

This is a distribution router for an upstream skill package. Use it when the user explicitly selects this suite.
Read the relevant original SKILL.md below before doing the task. Keep its invocation policies, workflow, and attribution.
Resolve resources relative to that original skill file. The upstream directory layout is preserved under upstream/.
Host-specific hooks, commands, MCP servers, subagents, and local browser sessions are prerequisites, not capabilities installed by this router.
Use absolute paths to packaged helper scripts. Do not confuse the upstream resource directory with the user project or output directory.

Source: https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc
License: MIT

## Skills

- implementing-llms-litgpt: [original instructions](upstream/01-model-architecture/litgpt/SKILL.md) — Implements and trains LLMs using Lightning AI's LitGPT with 20+ pretrained architectures (Llama, Gemma, Phi, Qwen, Mistral). Use when need clean model implementations, educational understanding of architectures, or production fine-tuning with LoRA/QLoRA. Single-file implementations, no abstraction layers.
- mamba-architecture: [original instructions](upstream/01-model-architecture/mamba/SKILL.md) — State-space model with O(n) complexity vs Transformers' O(n²). 5× faster inference, million-token sequences, no KV cache. Selective SSM with hardware-aware design. Mamba-1 (d_state=16) and Mamba-2 (d_state=128, multi-head). Models 130M-2.8B on HuggingFace.
- nanogpt: [original instructions](upstream/01-model-architecture/nanogpt/SKILL.md) — Educational GPT implementation in ~300 lines. Reproduces GPT-2 (124M) on OpenWebText. Clean, hackable code for learning transformers. By Andrej Karpathy. Perfect for understanding GPT architecture from scratch. Train on Shakespeare (CPU) or OpenWebText (multi-GPU).
- rwkv-architecture: [original instructions](upstream/01-model-architecture/rwkv/SKILL.md) — RNN+Transformer hybrid with O(n) inference. Linear time, infinite context, no KV cache. Train like GPT (parallel), infer like RNN (sequential). Linux Foundation AI project. Production at Windows, Office, NeMo. RWKV-7 (March 2025). Models up to 14B parameters.
- distributed-llm-pretraining-torchtitan: [original instructions](upstream/01-model-architecture/torchtitan/SKILL.md) — Provides PyTorch-native distributed LLM pretraining using torchtitan with 4D parallelism (FSDP2, TP, PP, CP). Use when pretraining Llama 3.1, DeepSeek V3, or custom models at scale from 8 to 512+ GPUs with Float8, torch.compile, and distributed checkpointing.

## Requirements

- 具体训练、推理或实验技能需要各自框架及计算资源

## Known upstream limitations

- 01-model-architecture/mamba/references/mamba2-details.md — 初始收录审查：上游 Advanced topics 引用的可选架构扩展文档未提供。
- 01-model-architecture/mamba/references/performance.md — 初始收录审查：上游 Advanced topics 引用的可选性能扩展文档未提供。
- 01-model-architecture/mamba/references/selective-ssm.md — 初始收录审查：上游 Advanced topics 引用的可选数学扩展文档未提供。
