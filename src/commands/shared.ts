import * as vscode from "vscode";
import fs from "fs";
import path from "path";

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

export function setUpPanel(context: vscode.ExtensionContext, title: string) {
  const panel = vscode.window.createWebviewPanel("logViewer", title, vscode.ViewColumn.One, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
    retainContextWhenHidden: true,
  });

  panel.webview.html = generateWebviewContent(panel.webview, context);

  // On receive message, show it as info or error:
  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === "info") {
      vscode.window.showInformationMessage(message.message);
    } else if (message.type === "error") {
      vscode.window.showErrorMessage(message.message);
    } else if (message.type === "warning") {
      vscode.window.showWarningMessage(message.message);
    }
  });

  return panel;
}
