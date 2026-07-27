# Pi 扩展开发约定

> 沉淀自 pi-windows-notify：如何写一个可 `pi install` 安装、类型安全的 Pi 扩展包。

---

## 1. 包结构契约（可安装的前提）

要让 `pi install https://github.com/<user>/<repo>` 生效，`package.json` 必须满足：

```json
{
  "name": "pi-windows-notify",
  "type": "module",
  "keywords": ["pi-package", "..."],
  "pi": { "extensions": ["./index.ts"] },
  "peerDependencies": { "@earendil-works/pi-coding-agent": "*" },
  "peerDependenciesMeta": {
    "@earendil-works/pi-coding-agent": { "optional": true }
  }
}
```

- **`pi.extensions`**：Pi 靠这个 manifest 定位扩展文件；缺了它安装后不加载。
- **`pi-package` keyword**：包被 Pi 识别 / gallery 收录的标记。
- **`@earendil-works/pi-coding-agent` 放 peerDependencies（`"*"`）**：Pi 运行时会 bundle 这些核心包，扩展不能重复打包。属于 Pi 核心的还有 `@earendil-works/pi-ai`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-tui`、`typebox`。
- **第三方运行时依赖**放 `dependencies`：Pi 从 npm/git 安装时会自动 `npm install`。

### 安装来源（README 应列出）

```bash
pi install https://github.com/<user>/<repo>   # 原始 URL
pi install git:github.com/<user>/<repo>        # git: 简写
pi install /absolute/path/to/pkg               # 本地路径
pi -e git:github.com/<user>/<repo>             # 临时试用，不写入 settings
```

---

## 2. 扩展入口签名

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("agent_settled", async () => { /* ... */ });
}
```

- default 导出一个接收 `ExtensionAPI` 的函数。
- 用 `import type` 引入 `ExtensionAPI`：类型在编译期擦除，运行时零依赖。
- 用 ESM `import { execFile } from "node:child_process"`，不用 CommonJS `require`（配合 `"type": "module"`）。

---

## 3. 设计决策：`agent_settled` vs `agent_end`

**Context**：想在「agent 停下等用户输入」时通知。

**Options**：
1. `agent_end` — 官方 notify.ts 示例用它。
2. `agent_settled` — 本项目选它。

**Decision**：选 `agent_settled`。`agent_end` 会在 Pi 自动重试 / 压缩上下文 / 继续跑排队消息之前触发，导致「其实还会继续干活」时误报。`agent_settled` 才是 Pi 确认不再自动继续、真正把控制权交回用户的信号。

---

## 4. 平台守卫

```typescript
if (process.platform !== "win32") return;  // 非 Windows 静默无操作
```

- 用 `process.platform === "win32"` 判断，**不要**依赖 `WT_SESSION` 等终端标识符——那会漏掉 VS Code 集成终端、conhost 等场景。

---

## 5. Windows Toast（PowerShell）契约

通过 `execFile("powershell.exe", [...])` 调 `Windows.UI.Notifications` 弹 Toast：

- 参数用 `["-NoProfile", "-NonInteractive", "-Command", script]`。
- 拼进 PowerShell 单引号字符串的文本必须转义单引号：`value.replace(/'/g, "''")`，否则文案里的引号会破坏脚本。
- `execFile` 回调里处理 `error`，失败写 `process.stderr`，不要静默吞掉。

### 已知限制（Gotcha）

> `CreateToastNotifier('Pi')` 的 AppId 用任意字符串时，Windows 对未注册的 AppUserModelID 有时会把通知显示成来自 PowerShell，或在个别系统不弹。这是官方示例本身的行为，需要正式注册 AppId 才能根治。

---

## 6. 验证

```bash
npm install        # 装 devDependencies（含 pi-coding-agent 类型）
npm run typecheck  # tsc --noEmit，零错误
```

- tsconfig 用 `module: NodeNext` / `moduleResolution: NodeNext` / `strict: true` / `noEmit: true`。
- GUI toast 无法在 headless 环境自动验证，需在真实 Windows 桌面手动确认弹窗。
