import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { parseLogs } from "../lib/laravelLogParser";

export default async function handle(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("Please open a Laravel log file.");
    return;
  }

  const document = editor.document;

  if (document.languageId !== "log") {
    vscode.window.showErrorMessage("This extension works with log files only.");
    return;
  }
  const panel = vscode.window.createWebviewPanel("laravelLogViewer", "Laravel Log Viewer", vscode.ViewColumn.One, {
    enableScripts: true,
    // Only allow the webview to access resources in our extension's media directory
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
  });

  panel.webview.html = generateWebviewContent(panel.webview, context);

  // Parse the log file:

  // If the log file is huge, only get the most recent logs:
  const logs = await parseLogs(document.getText());

  panel.webview.postMessage({ command: "loadLogs", logs });
}

function generateWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  const htmlFilePath = path.join(context.extensionPath, "media", "index.html");
  let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

  const alpineUri = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "media", "alpine.min.js")));

  // Inject the Alpine.js script dynamically
  htmlContent = htmlContent.replace("</head>", `<script src="${alpineUri}" defer></script></head>`);

  return htmlContent;
}
