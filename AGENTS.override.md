# Octop fork 协作约定

本文件是 `hey-amos/octop` 的 Codex 规则入口，只维护 fork 与上游不同的协作约定。

## 读取上游规范

开始任务前，先完整读取同目录的 [AGENTS.md](AGENTS.md)，继续遵守其中的架构、模块边界、编码、测试和沟通规范。同目录存在本文件时，Codex 不会同时自动加载 `AGENTS.md`，因此不能省略这一步。

上游 `AGENTS.md` 和 `CONTRIBUTING.md` 中的分支、标签及发布流程与下述约定冲突时，使用本文件的 fork 流程；其余工程规范继续适用。保留上游 `AGENTS.md` 原样，不向其中追加 fork 规则。

## 分支与发布

- `main` 保持上游 `TencentCloud/Octop` 的镜像，默认由用户在 GitHub 网页同步，不接收任何定制提交。
- `develop` 从 `main` 创建，长期积累定制代码，只 rebase 到 `main`，不另建 `custom` 长期分支。
- `feature/*` 从 `develop` 创建，只 rebase 到 `develop`，完成后合入 `develop`。功能、修复、技能和文档改动都在功能分支上进行。
- `release/*` 从已验证的 `develop` 创建，切出后冻结范围，不跟随 `develop` rebase；发布后将修复合回 `develop`，再清理发布分支。
- 活动发布尚未完成发布及修复回流时，暂停 `develop` 对 `main` 的 rebase；`main` 仍可同步，`develop` 仍可接收下一轮功能。
- 优先保持 `develop` 历史线性；级联 rebase 必须记录旧基点。已授权重写远端开发分支时，使用带明确预期 SHA 的 `--force-with-lease`；不重写发布快照或已发布标签。
- 原始 `v*` 标签与上游保持一致。定制版标签使用另行约定的命名空间，发布目标按本次明确要求选择。
- 不将定制分支合入 `main`，不使用上游 `.cursor/skills/publish` 或上游自动发布、merge 同步流程处理定制版。

## 操作入口

- 同步上游 `main` 或原始标签：读取 [sync-upstream](.agents/skills/sync-upstream/SKILL.md)。
- 功能开发、分支集成、级联 rebase 或发布回流：读取 [develop-fork](.agents/skills/develop-fork/SKILL.md)。
- 讨论和检查不自动修改文件或分支；提交、推送、发布按用户已授权范围执行，不重复索要已有授权。

## 二次开发记录

将 fork 专属的设计决策、功能改动、上游适配和发布说明写入 [docs/fork/](docs/fork/README.md)。开始相关工作时先查已有记录，完成有实质影响的改动时按目录约定新增或更新对应记录；不为每条命令单独建档。

本文件、技能和二改记录随开发分支维护，不进入镜像 `main`。fork 变更说明写入自己的记录目录，不向上游 `AGENTS.md` 或根 `CHANGELOG.md` 追加 fork 专属说明。
