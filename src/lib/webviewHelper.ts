import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createLogRegex, LogContent, parseLogs } from "./logParser";
import { getStore, updateStore } from "../store";
import { MAX_BYTES_TO_READ, MAX_REGEX_NAME_LENGTH, MAX_REGEX_PATTERN_LENGTH } from "../constants";

async function generateWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): Promise<string> {
  const [htmlTemplate, styles] = await Promise.all([
    readFile(vscode.Uri.joinPath(context.extensionUri, "media", "index.html").fsPath, "utf8"),
    readFile(vscode.Uri.joinPath(context.extensionUri, "media", "assets", "styles.css").fsPath, "utf8"),
  ]);
  let htmlContent = htmlTemplate;
  const nonce = randomBytes(16).toString("base64");

  const replacements = [
    { placeholder: "${nonce}", value: nonce },
    { placeholder: "${styles}", value: styles },
    {
      placeholder: "${alpineUri}",
      value: webview
        .asWebviewUri(
          vscode.Uri.joinPath(context.extensionUri, "node_modules", "@alpinejs", "csp", "dist", "cdn.min.js")
        )
        .toString(),
    },
    {
      placeholder: "${logViewerUri}",
      value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "assets", "logViewer.js")).toString(),
    },
  ];

  replacements.forEach(({ placeholder, value }) => {
    htmlContent = htmlContent.replaceAll(placeholder, value);
  });

  return htmlContent;
}

export async function setUpPanel(
  context: vscode.ExtensionContext,
  title: string,
  fetchLogs: () => Promise<LogContent>
): Promise<vscode.WebviewPanel> {
  const panel = vscode.window.createWebviewPanel("logViewer", title, vscode.ViewColumn.One, {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(context.extensionUri, "media", "assets"),
      vscode.Uri.joinPath(context.extensionUri, "node_modules", "@alpinejs", "csp", "dist"),
    ],
  });

  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    try {
      if (!isRecord(message) || typeof message.type !== "string") {
        throw new Error("Received an invalid webview message.");
      }

      if (message.type === "command") {
        await handleCommand(context, panel, fetchLogs, message);
        return;
      }

      if (typeof message.message !== "string" || message.message.length > 500) {
        throw new Error("Received an invalid notification message.");
      }

      if (message.type === "info") {
        await vscode.window.showInformationMessage(message.message);
      } else if (message.type === "error") {
        await vscode.window.showErrorMessage(message.message);
      } else if (message.type === "warning") {
        await vscode.window.showWarningMessage(message.message);
      } else {
        throw new Error(`Unknown webview message type: ${message.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process the webview request.";
      await vscode.window.showErrorMessage(errorMessage);
    }
  });

  panel.webview.html = await generateWebviewContent(panel.webview, context);

  return panel;
}

async function handleCommand(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  fetchLogs: () => Promise<LogContent>,
  message: Record<string, unknown>
): Promise<void> {
  if (typeof message.command !== "string") {
    throw new Error("Received an invalid webview command.");
  }

  const parameters = isRecord(message.parameters) ? message.parameters : {};
  const requestId =
    typeof parameters.requestId === "number" && Number.isSafeInteger(parameters.requestId) && parameters.requestId >= 0
      ? parameters.requestId
      : 0;

  if (message.command === "ready" || message.command === "refresh") {
    const pattern = parameters.pattern;
    try {
      if (pattern !== undefined && (typeof pattern !== "string" || pattern.length > MAX_REGEX_PATTERN_LENGTH)) {
        throw new Error("Received an invalid regex pattern.");
      }

      const logs = await fetchLogs();
      await sendLogsToWebview(panel, logs.contents, pattern, logs.fileSize, requestId);
      await sendStoreToWebview(context, panel);
    } catch (error) {
      await panel.webview.postMessage({
        command: "loadLogs",
        error: true,
        message: error instanceof Error ? error.message : "Failed to load logs.",
        requestId,
      });
    }
    return;
  }

  if (message.command === "addToStore") {
    const regex = isRecord(parameters.regex) ? parameters.regex : undefined;
    const pattern = regex?.pattern;
    const name = regex?.name;
    if (
      typeof pattern !== "string" ||
      typeof name !== "string" ||
      !name.trim() ||
      name.length > MAX_REGEX_NAME_LENGTH
    ) {
      throw new Error("Received an invalid saved format.");
    }

    createLogRegex(pattern);
    const store = await getStore(context);
    await updateStore(context, {
      regexPatterns: { ...store.regexPatterns, [pattern]: name.trim() },
    });
    await sendStoreToWebview(context, panel);
    return;
  }

  if (message.command === "deleteFromStore") {
    const pattern = parameters.pattern;
    if (typeof pattern !== "string" || pattern.length > MAX_REGEX_PATTERN_LENGTH) {
      throw new Error("Received an invalid saved format.");
    }

    const store = await getStore(context);
    const regexPatterns = { ...store.regexPatterns };
    delete regexPatterns[pattern];
    await updateStore(context, { regexPatterns });
    await sendStoreToWebview(context, panel);
    return;
  }

  throw new Error(`Unknown webview command: ${message.command}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function sendLogsToWebview(
  panel: vscode.WebviewPanel,
  content: string,
  regexPattern: string | undefined = undefined,
  fileSize = 0,
  requestId = 0
): Promise<void> {
  try {
    const { logs, severities, regexPattern: parsedRegexPattern } = await parseLogs(content, regexPattern);

    panel.webview.postMessage({
      command: "loadLogs",
      logs,
      severities,
      regexPattern: parsedRegexPattern,
      fileSize,
      limitInBytes: MAX_BYTES_TO_READ,
      requestId,
    });
  } catch (error) {
    await panel.webview.postMessage({
      command: "loadLogs",
      error: true,
      message: error instanceof Error ? error.message : "Failed to parse logs.",
      requestId,
    });
  }
}

export async function sendStoreToWebview(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
): Promise<void> {
  const store = await getStore(context);
  await panel.webview.postMessage({ command: "loadStore", store });
}
