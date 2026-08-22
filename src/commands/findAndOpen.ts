import * as vscode from "vscode";
import { setUpPanel } from "../lib/webviewHelper";
import { getLogContent } from "../lib/logParser";

export default async function handle(context: vscode.ExtensionContext) {
  const fileUri = await findLogFiles();
  if (!fileUri) {
    return;
  }

  const fileName = fileUri.path.split("/").pop() ?? fileUri.path;
  await setUpPanel(context, `Log to Table - ${fileName}`, () => getLogContent(fileUri.fsPath));
}

export async function findLogFiles(): Promise<vscode.Uri | undefined> {
  const logFiles = await vscode.workspace.findFiles("**/*.log", "**/{node_modules,vendor}/**");
  if (logFiles.length === 0) {
    vscode.window.showInformationMessage("No .log files found in the workspace.");
    return undefined;
  }

  const selectedFile = await vscode.window.showQuickPick(
    logFiles
      .map((uri) => ({
        label: uri.path.split("/").pop() ?? uri.path,
        description: vscode.workspace.asRelativePath(uri),
        uri,
      }))
      .sort((a, b) => b.description.localeCompare(a.description)),
    { placeHolder: "Select a log file to view" }
  );

  return selectedFile?.uri;
}
