/**
 * Pi Windows Notify Extension
 *
 * 当 pi agent 停下来等待用户输入时（任务完成、需要回答问题、
 * 或等待危险命令的权限确认），弹出 Windows 系统 Toast 通知。
 *
 * 与官方 notify.ts 示例的差异：
 * 1. 绑定 `agent_settled` 而非 `agent_end`：`agent_end` 会在 pi
 *    自动重试 / 压缩上下文 / 继续跑排队消息前误触发；`agent_settled`
 *    才是 pi 确认不会再自动干活的真正信号。
 * 2. 去掉 `WT_SESSION` 判断：只要是 Windows 平台就直接走 PowerShell
 *    Toast 路径，不再依赖特定终端标识符。
 * 3. 非 Windows 平台静默无操作。
 */

import { execFile } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * 转义传入 PowerShell 单引号字符串的文本，防止引号破坏脚本。
 */
function escapePowerShell(value: string): string {
	return value.replace(/'/g, "''");
}

/**
 * 生成通过 Windows.UI.Notifications 弹 Toast 的 PowerShell 脚本。
 */
function windowsToastScript(title: string, body: string): string {
	const type = "Windows.UI.Notifications";
	const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
	const template = `[${type}.ToastTemplateType]::ToastText02`;
	const toast = `[${type}.ToastNotification]::new($xml)`;
	const safeTitle = escapePowerShell(title);
	const safeBody = escapePowerShell(body);
	return [
		`${mgr} > $null`,
		`$xml = [${type}.ToastNotificationManager]::GetTemplateContent(${template})`,
		`$texts = $xml.GetElementsByTagName('text')`,
		`$texts[0].AppendChild($xml.CreateTextNode('${safeTitle}')) > $null`,
		`$texts[1].AppendChild($xml.CreateTextNode('${safeBody}')) > $null`,
		`[${type}.ToastNotificationManager]::CreateToastNotifier('${safeTitle}').Show(${toast})`,
	].join("; ");
}

/**
 * 通过 PowerShell 触发一次 Windows Toast 通知。
 */
function notifyWindows(title: string, body: string): void {
	execFile(
		"powershell.exe",
		["-NoProfile", "-NonInteractive", "-Command", windowsToastScript(title, body)],
		(error) => {
			if (error) {
				process.stderr.write(`[pi-windows-notify] Toast 通知失败: ${error.message}\n`);
			}
		},
	);
}

export default function (pi: ExtensionAPI) {
	// 非 Windows 平台静默无操作。
	if (process.platform !== "win32") {
		return;
	}

	pi.on("agent_settled", async () => {
		notifyWindows("Pi", "Agent 正在等待你的输入");
	});
}
