# 使用 uv 管理项目开发环境

- 日期：2026-10-20（Asia/Shanghai）。
- 状态：本地开发环境已初始化并验证；应用首次运行配置尚未执行。
- 上游基线：`v1.0.2`，提交 `dd9dce470844c25d59effb50615bb3c667ea25cd`。
- 关联：`feature/fork-workflow`，补齐流程建设期间的开发环境。

## 背景与决定

前次提交检查使用的 Python 位于临时目录，项目 `.venv` 指向该解释器，临时目录清理后环境会失效。改用 uv 的默认持久安装目录管理 Python，项目依赖继续隔离在 `.venv` 中。

- 新增项目根目录 `.python-version`，固定开发使用 Python `3.12`；本次安装的是 `3.12.15`。该文件不改变上游 `requires-python = ">=3.12"` 的兼容范围。
- 按现有 `pyproject.toml` 和 `uv.lock` 执行 `uv sync --locked`，包含默认的 `dev` 依赖组；不升级依赖或重新生成锁文件。
- Python 安装位置由 `uv python dir` 查看，缓存位置由 `uv cache dir` 查看；不再把临时目录作为解释器位置，不改变系统 Python 或全局默认版本。
- 本次使用默认依赖组，未启用 `local-embedding` 等可选 extras。旧环境额外存在的 11 个 embedding 相关包未迁入新环境；需要相应功能时，应明确选择项目已有的 extra，并按锁文件安装。
- 前端继续使用已有的 npm 锁文件和 `dashboard/node_modules`；Git hooks 保持 `core.hooksPath=.githooks`。

## 初始化与日常使用

在项目根目录执行；新克隆中的 `.venv` 由 uv 自动创建：

```bash
uv python install 3.12 --no-bin
uv sync --locked
(cd dashboard && npm ci)
make install-hooks
```

日常使用 `uv run` 进入项目环境，无需手动激活 `.venv`：

```bash
uv sync --locked
uv run --locked octop version
uv run --locked pytest tests/unit/cli/test_version_cmd.py -q
```

`.python-version` 和现有锁文件随 Git 维护；`.venv`、`node_modules`、解释器和缓存属于本机环境，不提交到仓库。`octop init` 涉及应用数据库和管理员初始化，应在需要启动应用时另行配置。

## 验证结果

- 确认新 `.venv` 的解释器和基础运行库均位于 uv 持久目录，不再引用临时 Python。
- `uv sync --locked --check`：环境与锁文件一致，无需修改；`uv pip check`：依赖兼容。
- 默认开发环境的 221 个包与旧环境中的对应包版本一致；`pyproject.toml`、`uv.lock` 和前端锁文件未改变。
- `uv run --locked octop version`：输出 `octop v1.0.2`。
- `uv run --locked pytest tests/unit/cli/test_version_cmd.py tests/unit/cli/test_registry.py tests/unit/cli/test_cli_db.py -q`：11 项通过。测试报告了旧 pytest 临时目录清理警告，未影响用例通过。
- 环境重建阶段没有改动应用代码，使用上述检查和相关测试验证；正式提交继续执行项目既有 pre-commit 检查及前端构建。此前本机 443 端口导致的测试环境问题仍见[流程建设记录](2026-10-20-fork-workflow.md)，本次没有修复该用例。

## 上游同步注意事项

上游提高 Python 最低版本时，需同时检查 `.python-version` 是否仍满足要求。若上游新增同名文件，核对双方约束后再处理；本地虚拟环境不随 rebase 迁移，需要时用 uv 重新同步。
