# pi-windows-notify

Pi coding agent 扩展：当 agent 停下来等待你输入时（任务完成、需要回答问题、或等待危险命令的权限确认），弹出 Windows 系统 Toast 通知。

## 安装

任选一种来源：

```bash
# 从 GitHub 安装
pi install https://github.com/Happier-X/pi-windows-notify

# 或 git: 简写
pi install git:github.com/Happier-X/pi-windows-notify

# 或本地路径
pi install /absolute/path/to/pi-windows-notify
```

默认写入用户设置（`~/.pi/agent/settings.json`）。加 `-l` 写入项目设置（`.pi/settings.json`）。

不想常驻安装、只临时试一次：

```bash
pi -e git:github.com/Happier-X/pi-windows-notify
```

## 工作原理

扩展绑定 pi 的 `agent_settled` 事件。这个事件在 pi 确认不会再自动重试、压缩上下文或继续跑排队消息时才触发，也就是 agent 真正停下来等你的那一刻。相比官方示例绑定的 `agent_end`，`agent_settled` 不会在 pi 后续自动继续时误报。

触发时通过 `powershell.exe` 调用 `Windows.UI.Notifications` 弹出系统 Toast，零第三方依赖。

通知采用 `reminder` 场景：会常驻在屏幕上直到你手动处理，不会几秒后自动淡出，同时带一个系统提示音，避免你没看屏幕时错过。通知上带一个「知道了」按钮，点一下即关。

## 平台

仅在 Windows（`process.platform === "win32"`）生效，其他平台静默无操作。不依赖 `WT_SESSION` 等终端标识符，任意 Windows 终端（Windows Terminal、VS Code 集成终端、conhost 等）都能弹出。

## 已知限制

Toast 的 AppId 使用 `Pi`。Windows 对未注册的 AppUserModelID 有时会把通知显示成来自 PowerShell，或在个别系统上不弹出。这是官方示例本身的行为。

## 验证

```bash
npm install
npm run typecheck
```

## License

MIT
