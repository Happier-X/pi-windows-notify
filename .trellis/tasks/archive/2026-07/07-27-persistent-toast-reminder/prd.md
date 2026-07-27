# 优化 Windows 通知为常驻+提示音

## 背景

当前扩展用 `ToastText02` 内置模板弹通知，Windows 默认几秒就淡出到通知中心。用户若此刻没在看屏幕就会错过，体验上「弹一下就消失了」。

## Goal

将 Toast 改为常驻不淡出，并加提示音兜住「没看屏幕」的场景，让 agent 等待输入时不被错过。

## Requirements

- 通知常驻屏幕，不自动淡出，直到用户手动处理。
- 触发系统提示音，覆盖没看屏幕的情况。
- 提供关闭入口（按钮），用户处理完后能干净关掉。
- 保持零第三方依赖，仍走 `powershell.exe` + `Windows.UI.Notifications`。
- 不影响现有事件绑定（`agent_settled`）和跨平台静默行为。
- title / body 进 XML 时需正确转义，防止破坏 Toast 结构。

## Acceptance Criteria

- [ ] `index.ts` 用手写 ToastGeneric XML 替换内置模板，挂 `scenario="reminder"`。
- [ ] XML 包含 `<audio>` 提示音和系统级关闭按钮（`activationType="system"`）。
- [ ] 新增 XML 转义函数，title / body 注入前完成转义。
- [ ] `npm run typecheck` 通过。
- [ ] PowerShell 脚本实测能弹出常驻且带音的 Toast。
- [ ] `README.md` 「工作原理」段落同步说明常驻 + 提示音行为。

## Notes

- 实现已在上一轮对话完成并实测通过，本任务为事后补建沉淀。
- `scenario="reminder"` 要求至少一个 action，故加系统级「知道了」按钮（无需后台程序响应）。
