# 目录结构

> 本项目是一个可通过 `pi install` 安装的 Pi 扩展包，采用「包根单入口」布局。

---

## 概览

本项目不是传统的 `src/` 多模块后端，而是一个 Pi 扩展包。核心逻辑集中在包根 `index.ts`，通过 `package.json` 的 `pi.extensions` manifest 被 Pi 发现并加载。

---

## 目录布局

```
pi-windows-notify/
├── index.ts          # 扩展入口，导出 default (pi: ExtensionAPI) => void
├── package.json      # 含 pi.extensions manifest + pi-package keyword
├── tsconfig.json     # NodeNext / strict，仅 typecheck（noEmit）
├── .gitignore        # 忽略 node_modules/、dist/、*.tsbuildinfo 等
├── .npmignore        # 发布 npm 时排除 .git/、.github/、tsconfig.json 等
├── LICENSE           # MIT
├── README.md         # 安装方式 + 工作原理 + 已知限制
└── .trellis/ .pi/    # Trellis / Pi 开发期配置，不影响包加载
```

---

## 模块组织

- 逻辑小（单文件几十行）时，直接放包根 `index.ts`，不拆 `src/`。
- 逻辑复杂时参照 pi-lark-hub：包根 `index.ts` 仅 `export { default } from "./src/index.js"`，实际实现放 `src/`。
- 入口文件命名为 `index.ts`：Pi 的扩展列表对入口名为 `index.ts/index.js` 的包会显示包名（如 `pi-windows-notify`），而非带 `.ts` 后缀的文件名。

---

## 命名约定

- 包名以 `pi-` 前缀开头（如 `pi-windows-notify`），与生态一致。
- 扩展入口固定 `index.ts`。

---

## 示例

- 单文件扩展：本仓库 `index.ts`。
- 多模块扩展参考：`pi-lark-hub`（包根 re-export + `src/` 实现）。
