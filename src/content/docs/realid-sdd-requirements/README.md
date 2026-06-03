# RealID 需求规格输出

本目录现在按两次生成流程拆分为两个路径，方便对比“反向代码梳理版”和“正向 spec-driven 优化版”的写法差异。

## 路径 1：第一次生成结果

[01-code-to-sdd-reverse](01-code-to-sdd-reverse)

用途：从现有代码反向梳理系统需求现状。

参考方法：

- `存量代码转spec的skill`

核心文件：

- [code-graph.md](01-code-to-sdd-reverse/code-graph.md)
- [analysis/insights.md](01-code-to-sdd-reverse/analysis/insights.md)
- [docs/requirements.md](01-code-to-sdd-reverse/docs/requirements.md)

## 路径 2：第二次生成结果

[02-forward-spec-driven](02-forward-spec-driven)

用途：把第一次需求文档优化成正向 spec-driven 可验证需求规格。

参考方法：

- `requirements-gen`
- `requirements-verify`

核心文件：

- [docs/orient-notes.md](02-forward-spec-driven/docs/orient-notes.md)
- [docs/requirements.md](02-forward-spec-driven/docs/requirements.md)
- [docs/requirements-verification-report.md](02-forward-spec-driven/docs/requirements-verification-report.md)

## 对比摘要

| 路径 | 目标 | 写法 |
|---|---|---|
| `01-code-to-sdd-reverse` | 从代码还原系统现状 | 章节叙述型，重点是源码证据和 `[[ REQ-* ]]` 引用 |
| `02-forward-spec-driven` | 形成可设计、可测试的需求规格 | EARS 结构化，包含 User Stories、AC、NFR、Traceability Matrix 和校验报告 |

