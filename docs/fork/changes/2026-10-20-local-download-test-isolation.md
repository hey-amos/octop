# 修复下载测试打开系统文件管理器

- 日期：2026-10-20（Asia/Shanghai）。
- 状态：测试隔离已修复，相关测试已通过。
- 上游基线：`v1.0.2`，提交 `dd9dce470844c25d59effb50615bb3c667ea25cd`。
- 关联：`feature/fork-workflow`，随开发环境和流程建设提交维护。

## 原因与修复

`test_save_local_download_writes_downloads` 上传内容为 `hello` 的 `note.txt`，验证本地下载接口是否正确保存文件。文件写入 pytest 的临时目录属于预期行为。

测试原本替换 `octop.infra.utils.user_downloads.reveal_download`，但路由模块通过 `from ... import reveal_download` 提前保存了原函数引用，替换定义位置未影响路由实际调用。因此测试仍会启动系统文件管理器；在 macOS 上表现为执行 `open -R` 并弹出 Finder。

仅修改 [test_local_download.py](../../../tests/unit/api/test_local_download.py)：

- 两个下载接口测试都改为替换 `octop.api.routers.settings.reveal_download`，拦截实际使用位置。
- 成功下载测试检查 mock 收到一次调用，参数为临时目录中保存的文件路径，防止 mock 未生效却仍通过测试。
- 非本机请求测试检查返回 403 且未调用展示函数。
- 保留真实的临时文件写入和内容校验；应用本身的下载与文件展示行为不变。

## 验证结果

- `uv run --locked ruff check tests/unit/api/test_local_download.py` 及对应的 Ruff 格式检查通过。
- `uv run --locked pytest tests/unit/api/test_local_download.py tests/unit/utils/test_user_downloads.py -q`：7 项通过。保留依赖弃用和旧 pytest 临时目录清理警告，未影响用例通过。
- 正式提交继续执行项目既有 pre-commit 检查及前端构建；此前 443 端口相关测试的临时隔离按[流程建设记录](2026-10-20-fork-workflow.md)处理，不在本次修复范围内。

## 上游同步注意事项

这是对上游测试隔离的修复。后续同步时检查上游是否已采用同类修复；若路由调整函数导入或调用位置，需同步核对 mock 目标及调用断言。
