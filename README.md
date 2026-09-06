<div align="center">

# Simplify Codebase

**先证明，再删除。让代码库少维护一些事实、状态与契约。**

[![Agent Skill](https://img.shields.io/badge/Agent-Skill-22c55e?style=flat-square)](./SKILL.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f172a?style=flat-square)](./LICENSE)
[![中文](https://img.shields.io/badge/README-中文-06b6d4?style=flat-square)](./README.md)
[![English](https://img.shields.io/badge/README-English-64748b?style=flat-square)](./README.en.md)

<img src="./assets/hero.png" alt="复杂的软件结构经过证据验证后，收敛为更小、更清晰的系统" width="100%" />

</div>

`simplify-codebase` 是一个面向现有代码库的 Agent Skill。它帮助编码智能体识别并安全移除偶然复杂度，同时保护仍然有效的行为、边界与兼容性。

它不追求“删得多”。它关心的是：一次改动能否减少团队今后必须持续保持一致的概念和义务。

## 为什么需要它

代码库里的冗余很少只是“某个函数没人调用”。它也可能是重复状态、失去所有者的抽象、只剩测试消费的接口、早已无效的兼容路径，或者被保留在共享文件中的半截功能。

静态检查可以提供线索，但不能单独证明一项删除是安全的。这个 Skill 会继续追踪运行时消费者、动态注册、持久化格式、公共接口、历史决策与验证边界，再决定应该删除、合并、保留，还是标记为暂时无法判断。

它也会识别“实现形态守卫”：只约束目录结构、源文本、私有默认值、固定组件数量或历史实现身份，却不再保护可观察行为的测试、静态扫描、清单和构建/CI 检查。AI 是否生成过这些代码不是删除证据；业务、API、安全、持久化、并发、真实部署、集成行为和仍生效的工程策略守卫仍按普通契约保留。

> **核心原则：** 删除代码行只是结果。真正的收益是删除一个需要长期维护的事实、状态、契约或概念。

## 工作方式

| | 聚焦范围 `Focused` | 全库范围 `Broad` |
| --- | --- | --- |
| **只读审计 `Survey`** | 深挖一个子系统、状态机或疑似重复点 | 分区覆盖整个仓库，给出候选、反证与盲区 |
| **授权修改 `Change`** | 证明并完成一个明确的简化边界 | 按所有权边界分批修改，每批独立验证 |

每个候选都要形成一份证明记录：

- 它位于哪个所有权边界、符号、文件，以及能够验证时的行号；
- 它增加了什么维护负担；
- 生产、测试、动态和外部消费者分别是谁；
- 完整删除边界在哪里，包括共享文件内部的成员；
- 会放弃什么可观察行为或兼容性；
- 哪个最小验证可以揭示错误删除；
- 减少的复杂度是否大于新引入的迁移或替代机制。

## 它会谨慎对待

- 公共 API、动态加载和插件注册；
- 数据格式、迁移、回放与向后兼容；
- 授权、隔离、输入校验和数据丢失防护；
- 并发、取消、清理和生命周期所有权；
- 生成文件、共享资源和仓库外消费者；
- 仍然有效的 ADR、RFC 与架构约束。

发现真实消费者、边界尚未查清，或者简化只是把复杂度搬到别处时，它会建议保留，而不是为了输出结果强行删除。

## 安装

让 Codex 安装：

```text
Install the simplify-codebase skill from https://github.com/tt-a1i/simplify-codebase
```

也可以手动安装到 Codex 的用户级 Skill 目录：

```bash
git clone https://github.com/tt-a1i/simplify-codebase.git \
  ~/.codex/skills/simplify-codebase
```

安装后请新建一个任务，让 Skill 目录重新加载。其他支持 `SKILL.md` 的 Agent 环境可将本仓库放入各自的 Skill 目录。

可交互 Cleanup Map 已内置在本 Skill 中，不需要另外安装 Archify。它直接内置精简后的 Architecture 渲染与桌面交互核心，再叠加清理专用编译和 Survey/Change 交互。renderer 需要 Node.js 18 或更高版本，不依赖额外 npm 包；交付的 HTML 不会请求外部字体。

## 使用

### 审计整个仓库，不改文件

```text
使用 $simplify-codebase 审计这个仓库，列出最安全、收益最高的简化候选。不要修改文件。
```

### 调查一个具体问题

```text
使用 $simplify-codebase 判断这些 readiness 标志是在表达不同的生命周期保证，还是重复状态。
```

### 实施一个已经证明安全的简化

```text
使用 $simplify-codebase 删除一个高置信度的偶然复杂度来源。保留仍然有效的契约，完成验证，并给出操作回执和撤销路径。
```

### 合并其他分支或 Agent 的发现

```text
使用 $simplify-codebase 复核并整合这个 PR 中的简化建议。保留证据，不保留候选数量。
```

### 调查实现形态守卫

```text
使用 $simplify-codebase 审计测试、构建/CI 和静态检查里只保护旧实现形态的守卫。不要修改文件，并保留仍然保护业务、安全、部署、集成行为或仍生效工程策略的检查。
```

### 生成可视化伴随报告

```text
使用 $simplify-codebase 审计这个仓库，并生成带 Finding 深链接的 Cleanup Map。文字证明记录作为权威结果；只画已确认的组件和关系，不要把图上可达关系称为运行时影响范围。
```

## 输出是什么样的

只读审计会交付覆盖范围、排序后的证明记录、重要反例、未决问题和下一条所需证据。

修改任务会额外交付实际变更、分层验证结果、剩余风险、操作回执与可执行的撤销路径。一次小范围测试通过，不会被包装成完整的运行时或用户验收。

默认交付完整的文字报告。用户明确要求可视化时，Skill 可直接使用内置 renderer 生成经过校验的桌面端交互 HTML；用户未要求时，即使问题横跨多个组件、状态或消费者，也会先说明图能帮助看清什么，得到确认后才生成。未确认不会自动出图，也不影响文字审计完成。

Survey 按“定位、路径、删除边界、判断”组织，Change 按“变更前、删除边界、变更后、验证”组织。它是 proof record 的视觉伴随物，不替代消费者证明、Change 操作回执或撤销路径。拓扑尚未证明或图没有额外解释价值时，保留带精确文件定位的完整文字报告。

## 仓库结构

```text
.
├── SKILL.md                    # 主工作流与判断标准
├── PRODUCT.md                  # 可视化产品定位与渐进披露原则
├── agents/openai.yaml          # Agent 展示与调用元数据
├── references/
│   ├── investigation.md        # 全库调查与候选发现
│   ├── boundaries-and-lifecycle.md
│   ├── execution-and-recovery.md
│   ├── decision-records.md
│   ├── integrating-findings.md
│   └── visual-reporting.md     # 可选视觉伴随层的真实性与交付契约
├── visualization/
│   ├── cleanup-map.schema.json # 清理专用语义契约
│   ├── render-cleanup-map.mjs  # Cleanup Map → Archify Architecture 编译与交付
│   ├── archify-core/           # 内置的 Architecture renderer 与桌面 viewer 核心
│   ├── cleanup-extension.*     # Survey / Change 专用交互与视觉扩展
│   ├── examples/               # Survey 与 Change 输入示例
│   └── test/                   # 契约、路径与产物测试
├── docs/validation.md          # 行为验证与质量证据
├── docs/fixtures/implementation-shape-guardrail/
│                                # 实现形态守卫的可复现 fixture、补丁与回执
├── docs/visual-report-example.md
└── assets/hero.png             # 原创 Hero 视觉
```

## 质量与边界

这个版本经过 Change、Broad、Integration 和 Decision-record 场景验证，也在一个 973 文件的 Python + TypeScript 项目上完成过全库审计。测试方法与已知边界记录在 [docs/validation.md](./docs/validation.md)。

视觉伴随层直接内置 Archify 的 Architecture renderer、Signal Flow 视觉系统和桌面 viewer 运行时，并在其上增加 Finding、Survey/Change 阶段、删除边界和按需证据抽屉。默认界面先用一两句话说清问题，再让源码、路径和决策证据随阶段展开；图始终占据主要视觉空间。其他通用图种、仓库 CLI、发布与图库流程没有搬入。来源、修改边界和 MIT 许可保留在 [`visualization/`](./visualization/)；报告格式示例见 [docs/visual-report-example.md](./docs/visual-report-example.md)。

Skill 不能替代产品决策。删除仍然可达的能力、已支持接口、持久化表示或兼容路径时，仍需由使用者明确授权。

## 贡献

欢迎提交 Issue 和 PR。请优先提供失败案例、遗漏的消费者、错误删除风险或可以复现的验证缺口；这比单纯增加更多规则更有价值。

## License

[MIT](./LICENSE)
