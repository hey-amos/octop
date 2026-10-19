# 级联 rebase

仅在更新 `develop` 或 `feature/*` 时读取。以下命令是分步骤示例：先核实分支、基点和前置条件，再执行对应一步；变量使用本次实际值，不整段盲跑。

## 记录更新前的历史

1. 读取本地和远端 `release/*`、相关 PR 及发布记录，区分活动发布与已结束但未清理的分支。不能只凭本地不存在发布分支就重写 `develop`；发布状态不明时先核实。功能分支仍可跟进未重写的 `develop`。
2. 本次包含 `develop` 时，先核实 fork 的远端 `main` 与上游一致，再把本地 `main` 快进到同一 SHA；已有分叉停止处理，不 reset 或合并修补。只更新功能分支时无需重新同步 `main`。
3. 确认待处理分支的本地、远端差异；存在他人新提交时先整合。记录实时远端旧 SHA，不能拿可能过期的 tracking ref 当推送预期值。
4. 保存本次目标 `main`、旧 `develop` 及它上次使用的 main 基点、各功能旧 tip 和其**上次建立或更新时的 develop 基点**。已有准确基点优先使用；无记录时在重写 `develop` **之前**核对分叉点及提交列表：

```bash
fork_old_develop=$(git rev-parse refs/heads/develop)
fork_target_main=$(git rev-parse refs/heads/main)
fork_old_main=$(git merge-base "$fork_target_main" "$fork_old_develop")
fork_feature=feature/example
fork_feature_base=$(git merge-base "$fork_old_develop" "$fork_feature")
git log --oneline "$fork_feature_base..$fork_feature"
```

`feature/example` 要替换为实际分支。上述 main 分叉点推导以已确认的上游快进历史为前提；有旧 main 基点记录时使用记录值，不能用重新计算的公共祖先掩盖上游历史重写。只有功能分支基于这代旧 `develop`、且范围只包含本功能提交时，才采用功能基点推导结果。若功能分支滞后多个重写周期、存在合并提交或来源不明，使用之前的记录、备份引用、reflog 和差异恢复准确边界；证据不足只暂停该分支，不猜测。

不要在重写后直接对新 `develop` 和旧功能分支求 merge-base 来代替旧基点：那可能退回上游公共祖先，把旧定制提交一起重新带入。

执行前创建唯一的本地备份引用，例如 `refs/backup/develop-fork/<本次编号>/develop`、`.../feature/<名称>`，用 `git update-ref` 的旧值为空形式保证不会覆盖已有备份。它们是备份引用，不是额外长期工作分支；不随普通 push 推送。

把基点、备份引用、远端预期 SHA、处理状态保存在 `git rev-parse --git-common-dir` 对应目录下的 `develop-fork/<本次编号>.json`，用绝对路径定位。创建功能分支、完成 rebase 或 squash 集成后更新相应记录。记录留在本地，跨克隆协作需在已获授权的交接中传递准确 SHA；不能假定其他克隆有这些记录。不依赖易变的 `develop@{1}`，也不立即删除尚有分支依赖的备份。

## 更新 develop

确认没有活动发布，目标 `main` 是旧上游基线的后继；若上游重写历史，停止常规流程并评估。检查 `fork_old_main..fork_old_develop` 的提交，存在 merge commit 时先处理其语义，不能默认丢弃其中的冲突解决。

```bash
git rebase --no-update-refs --no-autostash --no-fork-point \
  --onto "$fork_target_main" "$fork_old_main" develop
```

显式关闭 `--update-refs`，防止用户 Git 配置顺带移动其他功能或发布分支。按项目约定解决冲突；不能整批选 ours/theirs。遇到需要业务判断的冲突，保留现场并说明具体选择。失败不会撤销之前成功处理的其他分支，应如实记录进度。

完成后记录新 `develop` SHA，检查：

```bash
git merge-base --is-ancestor "$fork_target_main" develop
git range-diff "$fork_old_main..$fork_old_develop" "$fork_target_main..develop"
git diff --stat "$fork_target_main" develop
```

检查被丢弃或改变的提交，区分上游已吸收的补丁与误丢失；完成相关测试后才处理依赖分支或推送。

## 更新 feature

- `develop` 仅新增提交、功能基点和历史没有被重写时，可执行 `git rebase --no-update-refs --no-autostash develop`（当前必须为目标功能分支）。
- `develop` 被重写过时，用记录的旧边界只重放功能自己的提交：

```bash
fork_new_develop=$(git rev-parse refs/heads/develop)
git rebase --no-update-refs --no-autostash --no-fork-point \
  --onto "$fork_new_develop" "$fork_feature_base" "$fork_feature"
```

检查 `fork_new_develop` 是新功能 tip 的祖先，对比旧 `fork_feature_base..旧功能tip` 和新 `fork_new_develop..新功能tip` 的 range-diff，并验证内容。更新该功能的基点记录为 `fork_new_develop`。多分支分别记录，不假定所有分支从同一个旧 tip 分出。

功能在 `develop` 中被 squash 后，不再把原功能分支直接作为未合入功能同步。先核实已吸收的改动，已完成分支清理；仍有后续工作时只迁移未集成的那一段，不能复活已 squash 的旧提交。

## 推送与中断

本地 rebase 不隐含远端推送。已经授权更新远端分支时，先检查结果，再针对每个确切分支使用明确的预期旧 SHA：

```bash
git push origin \
  --force-with-lease="refs/heads/$fork_branch:$fork_remote_before" \
  "refs/heads/$fork_branch:refs/heads/$fork_branch"
```

这里 `fork_branch` 仅可为本次获授权的 `develop` 或 `feature/*`，`fork_remote_before` 为操作前实时核实并记录的远端 SHA。新分支用普通推送。不强推 `main`、`release/*` 或任何标签；分支保护拒绝时不绕过、不自动更改设置。

lease 失败说明远端可能有新工作，重新读取并评估，不能只刷新预期 SHA 后再次覆盖。超时先查实际引用。多人共用 `develop` 时协调重写窗口，并通过已获授权的渠道交接新旧基点，不能自行发送通知。

未完成的 rebase 可用 `git rebase --abort` 回到该次操作前；它不会撤销已成功完成的其他分支。已完成后需要恢复时，先核对工作区和备份，恢复仅限本次改动且未出现后续工作；若已推送，不自动重写远端回滚。报告已完成部分、冲突分支和仍依赖旧基点的分支。

## 依据

- [Git：基底被 rebase 后恢复下游分支](https://git-scm.com/docs/git-rebase#_recovering_from_upstream_rebase)
- [Git：range-diff 比较补丁序列](https://git-scm.com/docs/git-range-diff)
- [Git：明确预期值的 force-with-lease](https://git-scm.com/docs/git-push)
