---
name: sync-upstream
description: >-
  同步 Octop fork 的上游 main 和原始 v* 版本标签，或核对同步差异。
  main 默认由用户在 GitHub 网页同步，标签直接从上游获取并按授权推送到 fork。
  用于补齐上游标签、同步指定版本、检查同名标签是否一致；不用于定制版发版或部署。
---

# 同步上游版本

本项目采用纯上游镜像策略：`main` 不包含定制提交，每次同步后与上游 `main` 的提交 SHA 一致；`v*` 标签保留上游原始引用和对象。定制代码在其他分支维护。只 fork `main` 不妨碍后续获取上游标签，也不需要维护上游的其他分支。

开发分支的创建、`develop → main` 与 `feature/* → develop` 的 rebase、发布冻结及修复回流，使用 [develop-fork](../develop-fork/SKILL.md)。本技能只更新上游镜像和标签；同步 `main` 不自动触发开发分支 rebase。

## 范围与授权

- 先说明本次是检查、获取到本地，还是同步到 fork。仅询问方案或检查状态时保持只读；用户要求同步到 fork 时，允许在下述核验通过后推送目标标签，无需重复询问已有授权。
- 用户指定版本时只处理这些版本；要求补齐上游标签时处理全部上游 `v*`。仅说“同步上游标签”时，按补齐当前上游 `v*` 执行并在开始说明。
- 同步 `main` 默认采用用户选择的 GitHub 网页方式。只有明确要求代为同步 `main` 时才操作远程分支。
- 停用工作流、修改默认分支、创建定时任务不包含在标签同步授权中。已有明确授权可复用；否则先完成引用核对，再就具体设置变化确认。
- 本技能不创建 GitHub Release、不复制发布附件、不发布包或镜像，不调用仓库的 `publish` 技能。不要修改版本文件或 CHANGELOG，也不要把定制分支合入 `main`。

## 1. 核实仓库和差异

在仓库根目录读取：

```bash
git status --short --branch
git remote -v
git for-each-ref --format='%(refname) %(objectname)' 'refs/tags/v*'
```

默认仓库对应关系如下，实际执行必须核对，SSH 和 HTTPS URL 均可：

| Remote | 仓库 | 用途 |
|---|---|---|
| `origin` | `hey-amos/octop` | 用户的 fork，唯一推送目标 |
| `upstream` | `TencentCloud/Octop` | 上游，只读取 |

已请求执行同步且缺少 `upstream` 时，可在确认来源后添加；检查模式使用上游 URL 查询，不改配置。若同名 remote 指向其他仓库，先说明差异，不覆盖配置。

```bash
git remote add upstream https://github.com/TencentCloud/Octop.git
```

通过可用的 GitHub 连接器、REST API 或 `gh` 核对 fork 的 `parent.full_name`。不要求安装 `gh`，不输出访问凭据。仓库关系无法确认时报告证据缺口，不猜测其他推送目标。

```bash
git ls-remote upstream refs/heads/main
git ls-remote origin refs/heads/main
git ls-remote --tags upstream 'refs/tags/v*'
git ls-remote --tags origin 'refs/tags/v*'
```

按本次范围生成对照：标签名、上游对象 ID、本地对象 ID、fork 对象 ID、拟执行动作。`refs/tags/名称^{}` 是附注标签剥离后的目标，不是另一个标签；比较引用原始对象 ID，不能只比较最终提交。

- 本地或 fork 缺失：列为待获取或待推送。
- 对象 ID 一致：保留并跳过；手动创建的轻量标签若与上游相同，也无需重建。
- 任一同名引用不同：停止该批次修改，报告三个对象 ID 和差异；不删除、不强制覆盖，不把“指向同一提交”误当作附注标签完全一致。
- 上游不存在的本地标签：不推送、不删除。用户指定的版本在上游不存在时，不自行创建。

只操作引用时无需切换分支，也不要求用户提交或 stash 无关改动。不要执行 `reset --hard`、`git clean` 或自动 stash。

## 2. 保持 main 为纯镜像

网页操作位置：用户 fork 的 **main 分支 → Sync fork → Update branch**。网页同步后重新查询两端 `refs/heads/main`，以实际 SHA 核验结果；不要依赖本地可能过期的 `origin/main`。

只有用户要求代为同步 `main` 时，才获取两端最新分支，验证 `origin/main` 是 `upstream/main` 的祖先，然后执行普通快进推送：

```bash
git fetch --no-tags upstream main
git fetch --no-tags origin main
git merge-base --is-ancestor refs/remotes/origin/main refs/remotes/upstream/main
```

只有祖先检查成功才继续，不能整段无条件执行：

```bash
git push origin refs/remotes/upstream/main:refs/heads/main
```

若 fork 的 `main` 已含定制提交、与上游分叉或被分支保护拒绝，停止对应分支更新；不以合并提交、强推或绕过保护来“同步”。远程同步不等于本地 `main` 已更新，交付时分别说明。标签同步独立于 `main` 是否已同步，不把标签重建到最新 `main` 上。

## 3. 获取上游原始标签

以下 `v1.0.2` 只是命令示例，替换为本次已核对的准确名称。用户输入的标签须校验为有效 `refs/tags/` 引用，作为独立参数传递，不插入待执行的任意 shell 文本。

指定版本：

```bash
git fetch --atomic --no-tags upstream refs/tags/v1.0.2:refs/tags/v1.0.2
```

补齐全部上游版本：

```bash
git fetch --atomic --no-tags upstream 'refs/tags/v*:refs/tags/v*'
```

`--no-tags` 禁止隐式附带其他标签，显式 refspec 仍会获取所选标签。`--atomic` 避免引用冲突时只更新一部分本地引用。不要加 `+`、`--force` 或 `--prune-tags`；不要用 `git tag` 重建标签。直接获取会保留附注、签名及原始标签对象；保留签名不代表已经验证签名。

获取后重新查询上游并核对本地引用对象 ID；若上游在操作期间变化，重新评估差异，不继续使用旧清单。可用以下命令检查单个标签的对象和提交：

```bash
git rev-parse refs/tags/v1.0.2
git rev-parse 'refs/tags/v1.0.2^{commit}'
```

## 4. 推送前检查发布触发器

只有需要更新 fork 的标签时才执行这一步；本地获取或纯状态检查不受工作流状态阻塞。

Octop 的上游发布工作流会响应 `v*`，同步标签可能触发包、镜像、桌面包或发布资产上传。检查本次目标标签对应提交中的 `.github/workflows/` 及其级联触发器，不只检查当前工作分支。已知入口包括 `release.yml`、`docker-publish.yml` 和 `octop-desktop.yml`，以实际版本为准。

通过 GitHub API、连接器或网页核实 fork 中相关工作流的启停状态。例如在 `gh` 可用时：

```bash
gh api repos/hey-amos/octop/actions/workflows --paginate --jq '.workflows[] | {id, path, state}'
```

- 已核实相关发布工作流停用，或配置明确不会对本次同步产生发布副作用：继续。
- 存在会被触发的发布工作流：列明名称、触发方式和拟停用项；未获停用授权时，在已完成本地获取和核验后请求确认。
- 状态不可读取、目标标签引入尚未核实的新发布工作流，或检查结果不完整：保留本地结果，说明还缺什么证据，暂不推送。不能因缺少发布密钥就推断工作流不会执行。

获授权后可在 GitHub 上停用对应工作流并复查状态；不为此修改镜像 `main` 的工作流文件，不停用无关 CI，也不自动重新启用已停用的工作流。

## 5. 推送与复核

用户已经授权同步到 fork 且发布触发器检查通过后，重新查询 fork，跳过已一致的标签。只推送本次从上游核验过且 fork 缺少的精确引用；不使用 `git push --tags`、通配符推送或 `--mirror`，避免夹带本地其他标签。

```bash
git push --atomic origin refs/tags/v1.0.2:refs/tags/v1.0.2
```

多个标签可以在一次原子推送中列出多个精确 refspec。若服务端不支持原子推送，先确认实际状态，再逐项普通推送并记录成功项；不强制覆盖冲突。推送失败或超时后先查远端状态，只重试仍缺失的目标。

完成后重新读取上游和 fork 的目标引用，确认原始对象 ID 一致，附注标签还可比较剥离后的提交。若存在分支同步，另行核对两端 `main`。用 `git status --short --branch` 确认当前分支和用户工作区未被改动。

交付列明：同步范围、main 的实际状态、本地新增和远程新增标签、已一致而跳过的标签、冲突或待办，以及任何获授权的工作流设置变化。只有本地获取成功时不能声称“fork 已同步”；标签同步不能声称“Release 已发布”。纯引用操作不运行会修改文件的 `make all`，通过对象 ID、远端引用和工作区状态验证。

## 定时同步与维护位置

仅在用户要求时设计或创建定时同步。同步脚本和本技能的项目改动维护在定制分支；若 `main` 必须逐提交等于上游，不往其中加入自己的工作流或文档。定时任务可放独立自动化仓库或外部调度中，另行落实授权与验证。

## 参考

- [GitHub：同步 fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)
- [Git：fetch 与显式标签 refspec](https://git-scm.com/docs/git-fetch)
- [Git：标签对象及重新打标签](https://git-scm.com/docs/git-tag)
- [GitHub：启停工作流](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)
