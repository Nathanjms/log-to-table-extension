import * as vscode from "vscode";
export interface LogEntry {
  timestamp: string;
  severity: string;
  text: string;
}

function getLogRegex() {
  const config = vscode.workspace.getConfiguration("logViewer").get("regexPatterns") as {
    name: string;
    pattern: string;
  }[];

  console.log(config);

  if (config.length === 0) {
    throw new Error("No regex patterns configured");
  }

  return config[0].pattern;

  // return config.get("customOptions");
  const regex =
    "^\\[(?<timestamp>\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2})(.*?)\\](.*?(\\w+)\\.|.*?)((?<severity>\\w+)?: )(?<text>.*?)$";
  return RegExp(regex, "i");
}

export async function parseLogs(logData: string): Promise<{ logs: LogEntry[]; severities: string[] }> {
  return new Promise((resolve, reject) => {
    try {
      // First split by new lines. A lot of logs are on one line, but some are not.
      const logEntries = logData.split(/[\r\n]+/).filter((line) => line.trim() !== "");
      const logParsingRegex = getLogRegex();
      const parsedEntries: LogEntry[] = [];
      const severitiesInLogFile: Map<string, boolean> = new Map();

      let entryIndex = 0; // Track this outside of the loop - we have split by line, but below we are splitting by date (ie. by log).

      for (let i = 0; i < logEntries.length; i++) {
        const entry = logEntries[i];
        let match = entry.match(logParsingRegex);
        if (match) {
          const { timestamp, severity = "UNKNOWN", text = "" } = match.groups ?? {};

          if (!severitiesInLogFile.has(severity)) {
            severitiesInLogFile.set(severity, true);
          }

          parsedEntries[entryIndex] = { timestamp, severity, text };
          entryIndex++;
        } else if (entryIndex > 0) {
          // Otherwise, it is part of the message, so add it to the message of the previous entry
          parsedEntries[entryIndex - 1].text += "\n" + entry;
        }
      }

      resolve({ logs: parsedEntries.reverse(), severities: Array.from(severitiesInLogFile.keys()).sort() });
    } catch (error: any) {
      reject(error?.message ?? "An Error has Occurred");
    }
  });
}
