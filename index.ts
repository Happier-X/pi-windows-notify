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
 * 转义 XML 文本节点/属性值中的特殊字符，防止破坏 Toast XML 结构。
 */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * 生成通过 Windows.UI.Notifications 弹 Toast 的 PowerShell 脚本。
 *
 * 采用手写 Toast XML 而非内置模板，以便挂上以下属性，避免通知一闪而过：
 * - scenario="reminder"：通知常驻屏幕，直到用户手动处理，不会自动淡出。
 * - <audio>：默认提示音，用声音兜住「没看屏幕」的场景。
 * - 一个系统级关闭按钮（activationType=system，无需后台程序响应）。
 */
function windowsToastScript(title: string, body: string): string {
	const type = "Windows.UI.Notifications";
	const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
	const xmlType =
		"[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]";
	const toast = `[${type}.ToastNotification]::new($xml)`;
	const appId = "Pi";
	const toastXml = [
		'<toast scenario="reminder">',
		"<visual>",
		'<binding template="ToastGeneric">',
		`<text>${escapeXml(title)}</text>`,
		`<text>${escapeXml(body)}</text>`,
		"</binding>",
		"</visual>",
		'<audio src="ms-winsoundevent:Notification.Reminder" />',
		"<actions>",
		'<action content="知道了" arguments="dismiss" activationType="system" />',
		"</actions>",
		"</toast>",
	].join("");
	const safeXml = escapePowerShell(toastXml);
	return [
		`${mgr} > $null`,
		`$xml = ${xmlType}::new()`,
		`$xml.LoadXml('${safeXml}')`,
		`[${type}.ToastNotificationManager]::CreateToastNotifier('${appId}').Show(${toast})`,
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
