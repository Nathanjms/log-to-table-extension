import * as vscode from "vscode";
import { setUpPanel } from "../lib/webviewHelper";
import path from "path";
import { getLogContent } from "../lib/logParser";

export default async function handle(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("Please open a .log file.");
    return;
  }

  const document = editor.document;

  if (document.languageId !== "log") {
    vscode.window.showErrorMessage("This extension works with log files only.");
    return;
  }

  setUpPanel(context, "Log to Table - " + document.fileName, () => getLogContent(document.fileName));
}
