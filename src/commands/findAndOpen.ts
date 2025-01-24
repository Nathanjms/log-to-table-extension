import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { setUpPanel } from "./shared";

export default async function handle(context: vscode.ExtensionContext) {
  const filePath = await findLogFiles();
  if (!filePath) {
    return;
  }

  const fileName = path.basename(filePath);

  // Create and display the Webview
  setUpPanel(context, "Laravel Log Viewer - " + fileName, () => getLogContent(filePath));
}

export async function findLogFiles() {
  // exclude vendor folder and the node_modules folder:
  const logFiles = await vscode.workspace.findFiles("**/*.log", "**/{node_modules,vendor}/**");
  if (logFiles.length === 0) {
    vscode.window.showInformationMessage("No .log files found in the workspace.");
    return null;
  }

  const selectedFile = await vscode.window.showQuickPick(
    logFiles.map((file) => file.path).sort((a, b) => b.localeCompare(a)), // Sort desc
    { placeHolder: "Select a log file to view" }
  );

  return selectedFile;
}

function getLogContent(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}
