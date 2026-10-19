---
name: develop-fork
description: >-
  在 Octop fork 中开始或集成功能开发，让 develop 和 feature 分支逐级 rebase，
  或准备 release 分支、冻结发布范围并将发布修复回流 develop。
  遵循 main 纯上游镜像、develop 长期积累定制代码的约定。
  仅同步上游 main 或原始标签时使用 sync-upstream。
---

# Fork 开发与发布流程

在 `hey-amos/octop` 中执行已约定的 fork 开发模型。上游为 `TencentCloud/Octop`；实际操作先核对 remote。此模型与上游仓库自身的发布流程不同，项目 [AGENTS.override.md](../../../AGENTS.override.md) 是 fork 规则入口，上游 `AGENTS.md` 保持原样。

## 职责与范围

- 本技能负责开发分支、定制提交的集成、级联 rebase、发布冻结和修复回流。
- [sync-upstream](../sync-upstream/SKILL.md) 负责上游 `main` 和原始 `v*` 标签同步。需要先同步镜像时才读取它；调用它不自动授权重写开发分支，反之亦然。
- 讨论或检查流程时仅查看状态；编写流程文档不执行实际分支操作。普通开发任务不自动提交或推送。明确要求合入分支时可完成必要的合入提交；远端推送、正式发布、设置变更按用户已授权范围执行，不重复索要已有授权。
- 不运行上游 `.cursor/skills/publish`，不通过上游 `release/* → main`、`hotfix/* → main` 路径发布定制版。

## 分支约定

| 分支 | 创建来源 | 接收基线更新 | 归宿 |
|---|---|---|---|
| `main` | 上游 `main` | 按 sync-upstream 同步，默认由用户在网页操作 | 纯镜像，不接收定制提交 |
| `develop` | 已核验的 `main` | 只 rebase 到 `main` | 长期保留定制代码 |
| `feature/*` | `develop` | 只 rebase 到 `develop` | 完成后合入 `develop` |
| `release/*` | `develop` | 切出后冻结，不跟随 `develop` rebase | 发布后修复回流 `develop` |

- 新功能、修复及项目专属文档、技能、配置在 `feature/*` 修改；发布准备和发布修复在 `release/*` 修改。`develop` 以集成和同步为主，不另建 `custom` 或 `develop/*` 长期分支。
- 已有其他名称的工作分支不自动重命名、删除或迁移；保留其中用户工作，只有任务涉及迁移时才处理。
- 发布窗口从创建活动 `release/*` 开始，到发布成功且修复回流完成为止。窗口内 `main` 可同步，`develop` 可接收下一轮功能，但暂停 `develop → main` 的 rebase。多个活动发布全部结束后才恢复。
- `v*` 标签保留上游原始对象。定制版标签使用独立命名空间；命名尚未约定时，完成发布准备后再确认具体标签，不能自行复用 `v1.0.2` 或创建 `v1.0.2-custom`。

## 开始工作

先读 `AGENTS.override.md` 及其要求读取的上游 `AGENTS.md`，检查适用的目录规则、当前分支和差异。涉及分支操作时补充检查：

```bash
git status --short --branch
git remote -v
git branch -vv
git worktree list --porcelain
```

确认是否有未完成的 rebase、merge 或 cherry-pick；保留用户暂存区和未提交内容。历史操作要求目标工作树干净，不能自动 stash、清空或丢弃改动；独立开发任务可从正确基点新建工作树。不要在另一工作树正在使用的分支上强制移动引用。

只在同步、集成或发布确实需要时获取远端最新状态，不为了普通文件修改重复联网。只向已核实的 `origin` 推送；上游只读。仅执行本次指定分支，不把“同步 develop”扩展成重写所有人的功能分支。

### 初始化与功能开发

1. 若本地没有 `develop`，先检查 `origin/develop`。远端已有时获取并跟踪它，不从 `main` 覆盖已有定制历史；两端都没有时才从已核验的 `main` 创建并记录上游基点 SHA。初始化不迁移已有工作分支，也不隐含推送。
2. 新任务从 `develop` 创建 `feature/<任务名>`，记录准确的基点 SHA；保存方式见 [级联 rebase 的历史记录](references/rebase.md#记录更新前的历史)。分支名先用 `git check-ref-format --branch` 校验，外部输入作为独立参数处理。
3. 遵守项目模块边界、i18n 和测试规则；优先现有扩展点，减少对上游核心逻辑的改动。先查看 `develop` 中已有定制，避免重复实现。
4. 功能需要跟进时，读取 [级联 rebase](references/rebase.md)。如果 `develop` 仅向前增加提交，普通 rebase 即可；它被重写过时按记录的旧基点迁移功能提交。
5. 用户要求合入功能后，先同步该功能到当前 `develop`，验证后优先快进合入。需要整理为单个提交时可 squash；默认不增加 merge commit，以便 `develop` 后续 rebase。PR 的 base 为 fork 的 `develop`，不是上游仓库，也不是 `main`。
6. 合入后核实功能和原有定制均保留，再清理完成的分支。存在依赖它的未完成工作、未保存提交或未获授权的远端删除时，保留并说明。

### 跟进上游

只有收到更新开发基线的请求才执行；`main` 在网页同步不会自动改动 `develop`。

1. 核实目标 `main` 基线和本次分支范围；有活动发布时保留上游同步结果，延后 `develop` rebase，不擅自破坏发布冻结。
2. 按 [级联 rebase](references/rebase.md) 保存旧引用与各功能基点，再更新 `develop`。
3. 验证 `develop` 后，按授权范围逐个更新功能分支；未处理的分支保留旧基点记录，明确列为待更新，不能直接合入新历史。

### 准备发布与修复回流

执行前读取 [发布生命周期](references/release.md)。从验证过的 `develop` 切出 `release/*`；只在其中做版本、说明、打包和发布修复。发布使用冻结分支的准确提交，完成后回流修复，再解除 rebase 暂停。

“准备发布”不等于发布包、推送标签或创建 GitHub Release。上游现有发布工作流不直接适用于定制版；发布目标、标签名及触发器必须与已获授权的操作相符。

## 二次开发记录

有实质影响的定制功能、修复、流程决策或上游适配，按 [docs/fork/ 的记录约定](../../../docs/fork/README.md) 新增或更新对应记录，包含上游基线、原因、改动范围、验证结果和同步注意事项。相关工作先查已有记录；同一事项持续更新，不为纯状态检查或每条命令单独建档。

共享记录随实现维护在开发分支；Git common-dir 中的基点和恢复 JSON 仍保留作本地操作记录，两者不能互相替代。fork 变更和发布说明写入 `docs/fork/`，不向上游 `AGENTS.md` 或根 `CHANGELOG.md` 追加 fork 专属说明。

## 验证与交付

- 分支创建和纯引用检查：验证来源 SHA、祖先关系及用户工作区状态，不运行格式化。
- 实际代码集成、冲突解决和发布：遵守项目质量门槛 `make all`，按变更增加前端、API 或 i18n 检查；提交前确认 hooks 已安装。检查格式化副作用，不顺手暂存无关文件，也不绕过失败检查。
- 纯技能或文档变更：检查内容、链接、格式及适用的技能校验，说明未运行应用测试的原因。
- rebase 后不能只以“无冲突”判定成功；比较前后提交和最终差异，确认原有功能、上游修复及发布标签均保留。
- 交付区分本地完成、已推送、已发布；列出基线 SHA、改动分支、验证结果、待迁移分支、活动发布及可恢复记录位置。不自动提交、发布或修改 GitHub 设置来收尾。
