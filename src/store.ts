import * as vscode from "vscode";
import { MAX_REGEX_NAME_LENGTH, MAX_REGEX_PATTERN_LENGTH } from "./constants";

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

async function getStore(context: vscode.ExtensionContext): Promise<Store> {
  const storedPatterns = context.globalState.get<Store>("store")?.regexPatterns;
  if (!storedPatterns) {
    return { regexPatterns: { ...initialStore.regexPatterns } };
  }

  const validStoredPatterns = Object.entries(storedPatterns ?? {}).filter(
    ([pattern, name]) =>
      pattern.length <= MAX_REGEX_PATTERN_LENGTH &&
      typeof name === "string" &&
      name.length <= MAX_REGEX_NAME_LENGTH
  );

  return {
    regexPatterns: Object.fromEntries(validStoredPatterns),
  };
}

async function updateStore(context: vscode.ExtensionContext, newData: Partial<Store>) {
  const currentStore = await getStore(context);
  const updatedStore = { ...currentStore, ...newData }; // Merge new data with existing store
  await context.globalState.update("store", updatedStore);
}

export { getStore, updateStore };
