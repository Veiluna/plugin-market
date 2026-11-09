# 科研插件目录

按最初的来源仓库顺序组织，每个仓库一个入口，内部保留原有子分类与技能。结构校验不等于工作流功能实测；原生插件仍需上游要求的工具、登录或服务。

| 仓库入口 ID | 上游仓库 | Skills | Codex | Claude Code | Cursor | DSH | 云端 | 授权 |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| scientific-agent-skills | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills/tree/2d2065fb4520fa3f3f2bcf61cff26ec8b7eba4b5) | 177 | native | skills-only | skills-only | skills-only | conditional | MIT |
| nature-skills | [Yuan1z0825/nature-skills](https://github.com/Yuan1z0825/nature-skills/tree/b6ae2cac022f4aac094d50f2938a3474ba315fbc) | 24 | native | skills-only | skills-only | skills-only | conditional | Apache-2.0 |
| ars-claude | [Imbad0202/academic-research-skills](https://github.com/Imbad0202/academic-research-skills/tree/6d9388674de1ad0437ad95db3d52f92b92204d84) | 5 | unsupported | native | skills-only | skills-only | conditional | CC-BY-NC-4.0 |
| codex-autoresearch | [leo-lilinxiao/codex-autoresearch](https://github.com/leo-lilinxiao/codex-autoresearch/tree/0f54c571707487f59486ba7c50d405edfc746c19) | 1 | skills-only | unsupported | unsupported | unsupported | unsupported | MIT |
| academic-toolkit | [zLanqing/codex-claude-academic-skills](https://github.com/zLanqing/codex-claude-academic-skills/tree/7ed6377f0efb6a38951b48ef03b19d996e454b1f) | 3 | skills-only | skills-only | skills-only | skills-only | conditional | MIT |
| ars-codex | [Imbad0202/academic-research-skills-codex](https://github.com/Imbad0202/academic-research-skills-codex/tree/82725acb393c4410ac6f47634a7f51b40a162fa4) | 1 | native | unsupported | unsupported | unsupported | conditional | CC-BY-NC-4.0 |
| live-session-fetcher | [Given-Dream/sciencedirect-live-session-fetcher](https://github.com/Given-Dream/sciencedirect-live-session-fetcher/tree/0a24d96b0044e0be03efa2f1daafa84f81a9ebb9) | 2 | skills-only | skills-only | skills-only | skills-only | unsupported | MIT |
| literature-downloader | [Lucaswangzcx/literature-downloader-skill](https://github.com/Lucaswangzcx/literature-downloader-skill/tree/0e8f306fc5205fc90657fbd916a952fa9c9d773a) | 1 | skills-only | skills-only | skills-only | skills-only | conditional | MIT |
| aris | [wanshuiyin/Auto-claude-code-research-in-sleep](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep/tree/8f3110718259d9b804e2a71e8edc0e7887ddeac4) | 87 | native | native | skills-only | skills-only | conditional | MIT |
| ai-research-skills | [Orchestra-Research/AI-Research-SKILLs](https://github.com/Orchestra-Research/AI-Research-SKILLs/tree/773a52944ba4747a18bd4ae9ade53fff041adcbc) | 96 | skills-only | skills-only | skills-only | skills-only | conditional | MIT |
| research-paper-writing | [Master-cai/Research-Paper-Writing-Skills](https://github.com/Master-cai/Research-Paper-Writing-Skills/tree/77e7c2c1ba06f7d71844873147665437a03aac1b) | 1 | skills-only | skills-only | skills-only | skills-only | supported | MIT |
| latex-arxiv | [appautomaton/latex-arxiv-SKILL](https://github.com/appautomaton/latex-arxiv-SKILL/tree/b5b058350796bd6c9df7725a5d2e1607a9d45b2a) | 4 | skills-only | skills-only | skills-only | skills-only | conditional | MIT |

## 安装与前置条件

### scientific-agent-skills

生物、化学、医学、数据分析与科学写作技能库。

- 上游版本：2.72.0；分发版本：0.1.8
- 原始技能数：177；通用安装提供一个保持原资源布局的套件入口。
- 提交：2d2065fb4520fa3f3f2bcf61cff26ec8b7eba4b5
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：scientific-agent-skills-suite；递归发现技能的客户端也可能列出原始子技能。
- 按具体技能安装 Python 依赖或配置外部服务

    npm run market -- install-skills scientific-agent-skills --agent codex --target /path/to/project

### nature-skills

文献阅读、学术写作、审稿、引用与科研绘图工作流。

- 上游版本：0.1.0；分发版本：0.1.8
- 原始技能数：24；通用安装提供一个保持原资源布局的套件入口。
- 提交：b6ae2cac022f4aac094d50f2938a3474ba315fbc
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：nature-skills-suite；递归发现技能的客户端也可能列出原始子技能。
- 共享 nature-shared 资源随套件分发
- 部分功能需要外部 API 或文档处理工具

    npm run market -- install-skills nature-skills --agent codex --target /path/to/project

### ars-claude

ARS 的 Claude Code 原生科研、写作、评审与修订流水线。

- 上游版本：3.24.2；分发版本：0.1.10
- 原始技能数：5；通用安装提供一个保持原资源布局的套件入口。
- 提交：6d9388674de1ad0437ad95db3d52f92b92204d84
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：ars-claude-suite；递归发现技能的客户端也可能列出原始子技能。
- 发行家族：academic-research-skills，各发行版独立同步。
- 完整流水线需要 Claude Code 的原生组件与上游配置
- codex：请优先安装同家族的 ARS-Codex 发行版 缺失：native-runtime
- cursor：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands, hooks
- dsh：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands, hooks
- universal：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands, hooks

    npm run market -- install-skills ars-claude --agent codex --target /path/to/project

以上 Codex 降级安装受限，请按兼容表选择该发行版的原生平台。

### codex-autoresearch

Codex 原生、以可测指标驱动的自动实验与回退工作流。

- 上游版本：未声明；分发版本：0.1.7
- 原始技能数：1；通用安装提供一个保持原资源布局的套件入口。
- 提交：0f54c571707487f59486ba7c50d405edfc746c19
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：codex-autoresearch-suite；递归发现技能的客户端也可能列出原始子技能。
- Codex CLI、干净的 Git 分支与上游要求的运行能力
- claude-code：依赖 Codex Goal 或 codex exec 控制器 缺失：native-runtime
- cursor：依赖 Codex Goal 或 codex exec 控制器 缺失：native-runtime
- dsh：依赖 Codex Goal 或 codex exec 控制器 缺失：native-runtime
- universal：依赖 Codex 原生运行时 缺失：native-runtime

    npm run market -- install-skills codex-autoresearch --agent codex --target /path/to/project

### academic-toolkit

中文学术写作、Office 文档与科研计算技能。

- 上游版本：未声明；分发版本：0.1.0
- 原始技能数：3；通用安装提供一个保持原资源布局的套件入口。
- 提交：7ed6377f0efb6a38951b48ef03b19d996e454b1f
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：academic-toolkit-suite；递归发现技能的客户端也可能列出原始子技能。
- 原有子分类：3；统一安装此仓库入口即可获得全部适用技能。
  - research-writing-skill：1 项技能（原包 ID：academic-toolkit-research-writing-skill）
  - office-academic-skill：1 项技能（原包 ID：academic-toolkit-office-academic-skill）
  - scientific-toolkit-skill：1 项技能（原包 ID：academic-toolkit-scientific-toolkit-skill）
- 文档或科学计算功能需要相应本地工具、Python 包或 MATLAB/Octave

    npm run market -- install-skills academic-toolkit --agent codex --target /path/to/project

### ars-codex

ARS 的独立 Codex 原生发行版，保留自己的版本与运行适配。

- 上游版本：3.24.2；分发版本：0.1.1
- 原始技能数：1；通用安装提供一个保持原资源布局的套件入口。
- 提交：82725acb393c4410ac6f47634a7f51b40a162fa4
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：ars-codex-suite；递归发现技能的客户端也可能列出原始子技能。
- 发行家族：academic-research-skills，各发行版独立同步。
- 完整运行依赖 Codex 原生代理、脚本与上游配置
- claude-code：请安装同家族的 Claude Code 原生 ARS 缺失：native-runtime
- cursor：此发行版依赖 Codex 运行适配 缺失：native-runtime
- dsh：此发行版依赖 Codex 运行适配 缺失：native-runtime
- universal：此发行版依赖 Codex 运行适配 缺失：native-runtime

    npm run market -- install-skills ars-codex --agent codex --target /path/to/project

### live-session-fetcher

复用已获授权的本地浏览器会话，串行获取学术全文。

- 上游版本：未声明；分发版本：0.1.0
- 原始技能数：2；通用安装提供一个保持原资源布局的套件入口。
- 提交：0a24d96b0044e0be03efa2f1daafa84f81a9ebb9
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：live-session-fetcher-suite；递归发现技能的客户端也可能列出原始子技能。
- 原有子分类：2；统一安装此仓库入口即可获得全部适用技能。
  - sciencedirect-live-session-fetcher：1 项技能（原包 ID：live-session-fetcher-sciencedirect-live-session-fetcher）
  - literature-live-session-pipeline：1 项技能（原包 ID：live-session-fetcher-literature-live-session-pipeline）
- 本机 Chrome、Edge 或 Firefox 的已授权登录会话
- Python 与浏览器自动化依赖

    npm run market -- install-skills live-session-fetcher --agent codex --target /path/to/project

### literature-downloader

中文文献检索、候选筛选、合法全文获取与下载报告。

- 上游版本：未声明；分发版本：0.1.7
- 原始技能数：1；通用安装提供一个保持原资源布局的套件入口。
- 提交：0e8f306fc5205fc90657fbd916a952fa9c9d773a
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：literature-downloader-suite；递归发现技能的客户端也可能列出原始子技能。
- Python 与可访问的文献服务；机构登录资源需要另行授权

    npm run market -- install-skills literature-downloader --agent codex --target /path/to/project

### aris

ARIS 文献、实验、论文写作与跨模型评审套件。

- 上游版本：未声明；分发版本：0.1.9
- 原始技能数：87；通用安装提供一个保持原资源布局的套件入口。
- 提交：8f3110718259d9b804e2a71e8edc0e7887ddeac4
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：aris-suite；递归发现技能的客户端也可能列出原始子技能。
- 完整工作流需执行上游 setup 并配置评审器或跨模型集成
- Codex 与 Claude Code 使用各自原生技能目录
- cursor：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands
- dsh：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands
- universal：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 缺失：agents, commands

    npm run market -- install-skills aris --agent codex --target /path/to/project

### ai-research-skills

按上游分类插件组织的 AI 研究与工程技能。（上游有 17 项可选参考缺失，详见目录）

- 上游版本：未声明；分发版本：0.1.0
- 原始技能数：96；通用安装提供一个保持原资源布局的套件入口。
- 提交：773a52944ba4747a18bd4ae9ade53fff041adcbc
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：ai-research-skills-suite；递归发现技能的客户端也可能列出原始子技能。
- 原有子分类：23；统一安装此仓库入口即可获得全部适用技能。
  - model-architecture：5 项技能（原包 ID：ai-research-skills-model-architecture）
  - tokenization：2 项技能（原包 ID：ai-research-skills-tokenization）
  - fine-tuning：4 项技能（原包 ID：ai-research-skills-fine-tuning）
  - mechanistic-interpretability：4 项技能（原包 ID：ai-research-skills-mechanistic-interpretability）
  - data-processing：2 项技能（原包 ID：ai-research-skills-data-processing）
  - post-training：8 项技能（原包 ID：ai-research-skills-post-training）
  - safety-alignment：4 项技能（原包 ID：ai-research-skills-safety-alignment）
  - distributed-training：6 项技能（原包 ID：ai-research-skills-distributed-training）
  - infrastructure：3 项技能（原包 ID：ai-research-skills-infrastructure）
  - optimization：7 项技能（原包 ID：ai-research-skills-optimization）
  - evaluation：3 项技能（原包 ID：ai-research-skills-evaluation）
  - inference-serving：4 项技能（原包 ID：ai-research-skills-inference-serving）
  - mlops：3 项技能（原包 ID：ai-research-skills-mlops）
  - agents：4 项技能（原包 ID：ai-research-skills-agents）
  - rag：5 项技能（原包 ID：ai-research-skills-rag）
  - prompt-engineering：4 项技能（原包 ID：ai-research-skills-prompt-engineering）
  - observability：2 项技能（原包 ID：ai-research-skills-observability）
  - multimodal：10 项技能（原包 ID：ai-research-skills-multimodal）
  - emerging-techniques：6 项技能（原包 ID：ai-research-skills-emerging-techniques）
  - autoresearch：1 项技能（原包 ID：ai-research-skills-autoresearch）
  - ml-paper-writing：4 项技能（原包 ID：ai-research-skills-ml-paper-writing）
  - ideation：2 项技能（原包 ID：ai-research-skills-ideation）
  - agent-native-research-artifact：3 项技能（原包 ID：ai-research-skills-agent-native-research-artifact）
- 具体训练、推理或实验技能需要各自框架及计算资源
- 已知上游缺陷：01-model-architecture/mamba/references/mamba2-details.md — 初始收录审查：上游 Advanced topics 引用的可选架构扩展文档未提供。
- 已知上游缺陷：01-model-architecture/mamba/references/performance.md — 初始收录审查：上游 Advanced topics 引用的可选性能扩展文档未提供。
- 已知上游缺陷：01-model-architecture/mamba/references/selective-ssm.md — 初始收录审查：上游 Advanced topics 引用的可选数学扩展文档未提供。
- 已知上游缺陷：06-post-training/verl/references/multi-turn.md — 初始收录审查：上游 Advanced Topics 引用的可选多轮扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/constitutional-ai/references/constitution-design.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/constitutional-ai/references/cot-critique.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/constitutional-ai/references/rlaif-comparison.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/llamaguard/references/benchmarks.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/llamaguard/references/custom-categories.md — 初始收录审查：上游 Advanced topics 引用的可选扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/llamaguard/references/deployment.md — 初始收录审查：上游 Advanced topics 引用的可选部署扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/nemo-guardrails/references/colang-guide.md — 初始收录审查：上游 Advanced topics 引用的可选 DSL 扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/nemo-guardrails/references/integrations.md — 初始收录审查：上游 Advanced topics 引用的可选集成扩展文档未提供。
- 已知上游缺陷：07-safety-alignment/nemo-guardrails/references/performance.md — 初始收录审查：上游 Advanced topics 引用的可选性能扩展文档未提供。
- 已知上游缺陷：08-distributed-training/ray-train/references/custom-loops.md — 初始收录审查：上游 Advanced topics 引用的可选训练扩展文档未提供。
- 已知上游缺陷：08-distributed-training/ray-train/references/hyperparameter-tuning.md — 初始收录审查：上游 Advanced topics 引用的可选调参扩展文档未提供。
- 已知上游缺陷：10-optimization/flash-attention/references/advanced-features.md — 初始收录审查：上游 Advanced topics 引用的可选高级功能文档未提供。
- 已知上游缺陷：10-optimization/flash-attention/references/algorithm.md — 初始收录审查：上游 Advanced topics 引用的可选算法扩展文档未提供。
- codex：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 已登记上游可选参考文档缺失。 缺失：optional-upstream-references
- claude-code：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 已登记上游可选参考文档缺失。 缺失：optional-upstream-references
- cursor：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 已登记上游可选参考文档缺失。 缺失：optional-upstream-references
- dsh：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 已登记上游可选参考文档缺失。 缺失：optional-upstream-references
- universal：分发原始 Skills 与资源；封装不注册上游 hooks、MCP、命令或子代理。 已登记上游可选参考文档缺失。 缺失：optional-upstream-references

    npm run market -- install-skills ai-research-skills --agent codex --target /path/to/project

### research-paper-writing

论文各章节写作、论证检查和投稿前自查。

- 上游版本：未声明；分发版本：0.1.7
- 原始技能数：1；通用安装提供一个保持原资源布局的套件入口。
- 提交：77e7c2c1ba06f7d71844873147665437a03aac1b
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：research-paper-writing-suite；递归发现技能的客户端也可能列出原始子技能。

    npm run market -- install-skills research-paper-writing --agent codex --target /path/to/project

### latex-arxiv

保留写作器与协作辅助技能的 arXiv LaTeX 综述工作流。

- 上游版本：未声明；分发版本：0.1.7
- 原始技能数：4；通用安装提供一个保持原资源布局的套件入口。
- 提交：b5b058350796bd6c9df7725a5d2e1607a9d45b2a
- 验证：structure-validated（实际客户端验证记录见 docs/VERIFICATION.md）
- 通用入口名：latex-arxiv-suite；递归发现技能的客户端也可能列出原始子技能。
- Python、pdflatex、BibTeX
- 协作功能还需要对应 agent CLI

    npm run market -- install-skills latex-arxiv --agent codex --target /path/to/project

DSH 索引：https://raw.githubusercontent.com/Veiluna/plugin-market/HEAD/dsh/index.json
