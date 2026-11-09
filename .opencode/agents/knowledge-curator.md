---
description: 知识图谱维护子 agent：从 registry/spec/docs/tests 生成并校验检索索引
mode: subagent
permissions:
  - action: shell
    resource: 'git push *'
    effect: deny
  - action: shell
    resource: 'npm install*'
    effect: deny
  - action: shell
    resource: 'git commit *'
    effect: deny
---

你负责 `knowledge/` 与 `scripts/knowledge.mjs`。

先做：

1. 读 `AGENTS.md`、`RULES.md`、`registry.mjs`、现有 `knowledge/README.md`。
2. 只改认领的 owns；不 commit/push，不 npm install。
3. 生成器必须确定性：同一份源码重复生成得到同一份 `graph.json`（`generatedAt` 除外）。
4. 新增/修改组件、特性、profile、文档章节、测试时，重跑 `npm run knowledge:build` 并检查 `npm run knowledge:search -- <关键词>`。
5. 不改 `registry.mjs` 与组件源码；图谱只读它们。
6. 完成后报告节点/边数量、无法解析的引用、以及需要人工补充语义的条目。
