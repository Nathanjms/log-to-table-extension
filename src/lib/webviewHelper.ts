import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { parseLogs } from "./laravelLogParser";
import { getStore, updateStore } from "../store";

function generateWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  let htmlContent = fs.readFileSync(path.join(context.extensionPath, "media", "index.html"), "utf8");

  const replacements = [
    {
      placeholder: "${styleUri}",
      value: webview
        .asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "media", "assets", "styles.css")))
        .toString(),
    },
    {
      placeholder: "${alpineUri}",
      value: webview
        .asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "media", "assets", "alpine.min.js")))
        .toString(),
    },
    {
      placeholder: "${logViewerUri}",
      value: webview
        .asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "media", "assets", "logViewer.js")))
        .toString(),
    },
  ];

  replacements.forEach(({ placeholder, value }) => {
    htmlContent = htmlContent.replace(placeholder, value);
  });

  return htmlContent;
}

export function setUpPanel(context: vscode.ExtensionContext, title: string, fetchLogs: () => string) {
  const panel = vscode.window.createWebviewPanel("logViewer", title, vscode.ViewColumn.One, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
    retainContextWhenHidden: true,
  });

  panel.webview.html = generateWebviewContent(panel.webview, context);

  // On receive message, show it as info or error:
  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === "command") {
      if (message.command === "refresh") {
        sendLogsToWebview(panel, fetchLogs(), message.parameters.pattern);
      } else if (message.command === "addToStore") {
        getStore(context).then((store) => {
          console.log({ message, store });

          store.regexPatterns[message.parameters.regex.pattern] = message.parameters.regex.name;
          updateStore(context, { regexPatterns: store.regexPatterns });
          sendStoreToWebview(context, panel);
        });
      } else if (message.command === "deleteFromStore") {
        getStore(context).then((store) => {
          delete store.regexPatterns[message.parameters.pattern];
          updateStore(context, { regexPatterns: store.regexPatterns });
          sendStoreToWebview(context, panel);
        });
      }
    } else if (message.type === "info") {
      vscode.window.showInformationMessage(message.message);
    } else if (message.type === "error") {
      vscode.window.showErrorMessage(message.message);
    } else if (message.type === "warning") {
      vscode.window.showWarningMessage(message.message);
    }
  });

  sendLogsToWebview(panel, fetchLogs());
  sendStoreToWebview(context, panel);

  return panel;
}

export async function sendLogsToWebview(panel: vscode.WebviewPanel, content: string, regexPattern?: string) {
  try {
    const { logs, severities, regexPattern: parsedRegexPattern } = await parseLogs(content, regexPattern);

    panel.webview.postMessage({ command: "loadLogs", logs, severities, regexPattern: parsedRegexPattern });
  } catch (error: any) {
    panel.webview.postMessage({ command: "loadLogs", error: true, message: error?.message || "Failed to parse logs" });
  }
}

export async function sendStoreToWebview(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
  const store = await getStore(context);
  panel.webview.postMessage({ command: "loadStore", store });
}
