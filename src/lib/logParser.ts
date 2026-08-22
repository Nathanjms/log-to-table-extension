import { LARAVEL_LOG_REGEX_PATTERN, MAX_BYTES_TO_READ } from "../constants";
import { open, readFile, stat } from "node:fs/promises";
import safeRegex = require("safe-regex2");
import { MAX_REGEX_PATTERN_LENGTH } from "../constants";

export interface LogEntry {
  timestamp: string;
  severity: string;
  text: string;
}

export async function parseLogs(
  logData: string,
  regexPattern?: string
): Promise<{ logs: LogEntry[]; severities: string[]; regexPattern: string }> {
  const selectedPattern = regexPattern ?? LARAVEL_LOG_REGEX_PATTERN;
  const logParsingRegex = createLogRegex(selectedPattern);
  const isLaravelPattern = selectedPattern === LARAVEL_LOG_REGEX_PATTERN;
  const lines = logData.split(/\r\n?|\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  const parsedEntries: LogEntry[] = [];
  const severities = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(logParsingRegex);

    if (match) {
      const timestamp = match.groups?.timestamp;
      const capturedSeverity = match.groups?.severity || "UNKNOWN";
      const severity = isLaravelPattern ? (capturedSeverity.split(".").pop() ?? capturedSeverity) : capturedSeverity;
      const text = match.groups?.text ?? "";

      if (timestamp === undefined) {
        throw new Error("The regex timestamp group did not capture a value.");
      }

      severities.add(severity);
      parsedEntries.push({ timestamp, severity, text });
    } else if (parsedEntries.length > 0) {
      parsedEntries[parsedEntries.length - 1].text += `\n${line}`;
    }

    if (index > 0 && index % 1_000 === 0) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  }

  return {
    logs: parsedEntries.reverse(),
    severities: [...severities].sort(),
    regexPattern: logParsingRegex.source,
  };
}

export function createLogRegex(pattern: string): RegExp {
  if (!pattern.trim()) {
    throw new Error("The regex pattern cannot be empty.");
  }

  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) {
    throw new Error(`The regex pattern cannot exceed ${MAX_REGEX_PATTERN_LENGTH} characters.`);
  }

  if (!safeRegex(pattern)) {
    throw new Error("The regex pattern is potentially unsafe and cannot be used.");
  }

  try {
    const regex = new RegExp(pattern, "i");
    const namedGroups = getNamedGroups(pattern);
    const missingGroups = ["timestamp", "severity", "text"].filter((group) => !namedGroups.has(group));
    if (missingGroups.length > 0) {
      throw new Error(`The regex must include named groups for: ${missingGroups.join(", ")}.`);
    }

    return regex;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "The regex pattern is invalid.");
  }
}

function getNamedGroups(pattern: string): Set<string> {
  const groups = new Set<string>();
  let inCharacterClass = false;

  for (let index = 0; index < pattern.length; index++) {
    if (pattern[index] === "\\") {
      index++;
    } else if (pattern[index] === "[") {
      inCharacterClass = true;
    } else if (pattern[index] === "]") {
      inCharacterClass = false;
    } else if (!inCharacterClass && pattern.startsWith("(?<", index)) {
      const end = pattern.indexOf(">", index + 3);
      if (end !== -1) {
        const name = pattern.slice(index + 3, end);
        if (/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
          groups.add(name);
        }
      }
    }
  }

  return groups;
}

export interface LogContent {
  contents: string;
  fileSize: number;
}

export async function getLogContent(filePath: string): Promise<LogContent> {
  const stats = await stat(filePath);

  if (stats.size <= MAX_BYTES_TO_READ) {
    const contents = await readFile(filePath, "utf8");
    return {
      contents,
      fileSize: stats.size,
    };
  }

  const targetPosition = stats.size - MAX_BYTES_TO_READ;
  const lookbehind = Math.min(3, targetPosition);
  const position = targetPosition - lookbehind;
  const buffer = Buffer.alloc(MAX_BYTES_TO_READ + lookbehind);
  const file = await open(filePath, "r");

  try {
    const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
    let contentStart = lookbehind;
    while (contentStart < bytesRead && (buffer[contentStart] & 0xc0) === 0x80) {
      contentStart++;
    }

    return {
      contents: buffer.subarray(contentStart, bytesRead).toString("utf8"),
      fileSize: stats.size,
    };
  } finally {
    await file.close();
  }
}
