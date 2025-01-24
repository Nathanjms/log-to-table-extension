import * as vscode from "vscode";
import { parseLogs } from "../lib/laravelLogParser";
import { setUpPanel } from "./shared";

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
  const panel = setUpPanel(context, "Laravel Log Viewer - " + document.fileName);

  // Parse the log file:

  // If the log file is huge, should we only get only get the most recent logs?
  const { logs, severities } = await parseLogs(document.getText());

  panel.webview.postMessage({ command: "loadLogs", logs, severities });
}
