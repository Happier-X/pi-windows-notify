# Windows Notify Plugin

## 背景
用户需要一个 pi 插件：当 agent 结束运行、停下来等待用户输入时（无论是因为任务完成、需要回答问题，还是等待危险命令的权限确认），弹出 Windows 系统通知提醒用户。

## 需求
1. 在 pi 的 `agent_settled` 事件触发时，弹出 Windows 系统 Toast 通知。
2. 剥离官方示例中的 `WT_SESSION` 环境变量限制。无论在什么终端（Windows Terminal, VS Code 集成终端等）运行 pi，只要是 Windows 系统，就直接使用 PowerShell 触发系统通知。
3. 插件实现为单一 TypeScript 文件，可直接部署在用户的 `.pi/agent/extensions/` 或项目 `.pi/extensions/` 下被 pi 自动发现并加载。
4. 通知标题固定或标识为 "pi" 或 "pi agent"，内容提示如 "Agent 正在等待您的输入"（或其他合适的文案）。

## 验收标准
- 编译/运行无错：插件使用标准的 pi `ExtensionAPI` 并且类型安全。
- 逻辑验证：钩子绑定 `agent_settled`。
- 实现验证：PowerShell 命令调用逻辑正确且不依赖特定的终端标识符。
