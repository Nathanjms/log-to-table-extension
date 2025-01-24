import * as vscode from "vscode";

export interface Store {
  regexPatterns: {
    [key: string]: string;
  };
}

const initialStore: Store = {
  regexPatterns: {
    "^(?<timestamp>.*?),(?<severity>.*?),(?<text>.*?)$": "CSV Pattern: Timestamp,Severity,Content",
  },
};

export function init(context: vscode.ExtensionContext) {
  context.globalState.setKeysForSync(["store"]);
}

async function getStore(context: vscode.ExtensionContext): Promise<Store> {
  return context.globalState.get<Store>("store") ?? initialStore;
}

async function updateStore(context: vscode.ExtensionContext, newData: Partial<Store>) {
  const currentStore = await getStore(context);
  const updatedStore = { ...currentStore, ...newData }; // Merge new data with existing store
  await context.globalState.update("store", updatedStore);
}

export { getStore, updateStore };
