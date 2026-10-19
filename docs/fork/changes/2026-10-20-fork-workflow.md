# 建立 fork 开发流程与记录入口

- 日期：2026-10-20（Asia/Shanghai）。
- 状态：分支、文档及技能已实现，作为功能分支交付；尚未集成到 develop 或发布定制版。
- 上游：`TencentCloud/Octop`。
- 上游基线：`v1.0.2`，提交 `dd9dce470844c25d59effb50615bb3c667ea25cd`。
- 功能分支：`feature/fork-workflow`。

## 背景与决定

本仓库为上游项目的 fork，目标是在尽量减少核心逻辑改动的前提下持续二次开发，并跟随上游更新。

`main` 保留上游原始历史，`develop` 长期积累定制代码；功能和发布分支都从 `develop` 创建。上游更新沿 `main → develop → feature/*` 逐级 rebase。发布分支切出后冻结，直到发布与修复回流完成前，暂停 develop 对 main 的 rebase。

上游原始 `v*` 标签保留原始引用和对象，定制发布使用独立标识。具体操作维护在两个技能中，本记录不重复其命令步骤。

为减少 rebase 时与上游规范文件的冲突，保留上游 `AGENTS.md` 原样，使用 `AGENTS.override.md` 作为 Codex 的 fork 入口，显式要求先读取原文件的工程规范。该自动加载机制针对 Codex；其他工具需核实其入口，不能假定都会读取 override。

## 实现范围

- 建立本地 `develop` 和 `feature/fork-workflow`，初始基点均为上述上游提交。保留已有 `chore/upstream-sync-skill` 引用，相关技能和规范改动维护在功能分支中。
- 新增 [sync-upstream](../../../.agents/skills/sync-upstream/SKILL.md)，负责上游 main 和原始标签同步。
- 新增 [develop-fork](../../../.agents/skills/develop-fork/SKILL.md)，负责开发集成、级联 rebase、发布冻结和修复回流。
- 新增 [AGENTS.override.md](../../../AGENTS.override.md)，恢复上游 `AGENTS.md` 原文。
- 新增 [二改记录目录](../README.md)，并将记录要求接入开发技能和规则入口。
- 未改动应用代码、依赖、发布工作流或 GitHub 设置，未创建活动发布分支。

## 验证结果

- 分支初始化时已查询两端远程引用：本地 main、fork main、上游 main 与上游 `v1.0.2` 对应上述基线；初始化未改变 main、标签和已有暂存内容。
- 前序技能建设已通过官方 `quick_validate.py` 校验。在隔离的临时 Git 仓库中验证了四组流程：冲突后的级联 rebase、功能快进集成、发布修复 squash 回流并保留后续功能和发布标签、明确预期 SHA 的 lease 拒绝覆盖远端新增提交。
- 本次 override 与记录目录调整已通过 Markdown 链接、锚点、格式和技能校验；恢复后的 `AGENTS.md` 与当前上游基线中的原文逐字节一致。
- 本次改动仅涉及流程文档、技能和 Git 引用；技能校验与上述隔离 Git 验证不等同于应用测试或定制发布。正式提交仍执行项目既有 pre-commit 检查。
- 本机 Nginx 监听 443，导致上游 `test_probe_tencent_mirror_unreachable` 的“本机不可达”假设不成立。仅限制检查进程访问 `localhost:443` 后，该用例复核通过；未停止本机服务、修改测试或跳过检查。此隔离仅用于本次本地验证，不作为项目全局配置。

## 上游同步注意事项

- fork 专属文件只维护在开发分支；main 保持纯镜像，不合入这些文件。
- 上游 `AGENTS.md` 的内容会继续更新，override 通过读取原文件继承工程规范。即使没有文本冲突，也需检查新增规范是否与 fork 流程产生语义冲突。
- 如果上游未来新增同名 `AGENTS.override.md`、技能或 `docs/fork/` 文件，需要明确各自职责并处理冲突；独立文件只能减少冲突，不能保证永远无冲突。

## 未完成事项

- 功能分支中的技能与规范改动尚待按授权集成到 develop。
- 定制版标签命名及实际发布目标尚未约定，待准备首次定制发布时落实。
