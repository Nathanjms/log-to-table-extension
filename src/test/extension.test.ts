import * as assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as vscode from "vscode";
import { LARAVEL_LOG_REGEX_PATTERN, MAX_BYTES_TO_READ } from "../constants";
import { createLogRegex, getLogContent, parseLogs } from "../lib/logParser";

suite("Log parser", () => {
  test("parses Laravel logs newest first", async () => {
    const content = [
      "[2026-08-22 10:00:00] local.INFO: Started",
      "[2026-08-22 10:01:00] production.ERROR: Failed",
    ].join("\n");

    const result = await parseLogs(content);

    assert.deepEqual(result.logs, [
      { timestamp: "2026-08-22 10:01:00", severity: "ERROR", text: "Failed" },
      { timestamp: "2026-08-22 10:00:00", severity: "INFO", text: "Started" },
    ]);
    assert.deepEqual(result.severities, ["ERROR", "INFO"]);
    assert.equal(result.regexPattern, LARAVEL_LOG_REGEX_PATTERN);
  });

  test("preserves multiline messages and blank lines", async () => {
    const content = [
      "[2026-08-22 10:00:00] local.ERROR: Exception",
      "Stack line one",
      "",
      "Stack line three",
    ].join("\n");

    const result = await parseLogs(content);

    assert.equal(result.logs[0].text, "Exception\nStack line one\n\nStack line three");
  });

  test("supports CR-only logs without adding a trailing newline", async () => {
    const content = "[2026-08-22 10:00:00] local.INFO: First\r[2026-08-22 10:01:00] local.INFO: Second\r";
    const result = await parseLogs(content);

    assert.equal(result.logs.length, 2);
    assert.equal(result.logs[0].text, "Second");
  });

  test("parses custom named groups", async () => {
    const pattern = "^(?<timestamp>[^,]+),(?<severity>[^,]+),(?<text>.*)$";
    const result = await parseLogs("2026-08-22,NOTICE,Custom format", pattern);

    assert.deepEqual(result.logs, [
      { timestamp: "2026-08-22", severity: "NOTICE", text: "Custom format" },
    ]);
  });

  test("rejects missing named groups", () => {
    assert.throws(
      () => createLogRegex("^(?<timestamp>.*)$"),
      /named groups for: severity, text/
    );
  });

  test("does not treat group-like character class text as a named group", () => {
    assert.throws(
      () => createLogRegex("^(?<timestamp>[^,]+),[(?<severity>)]+,(?<text>.*)$"),
      /named groups for: severity/
    );
  });

  test("rejects potentially unsafe regexes", () => {
    assert.throws(
      () => createLogRegex("^(?<timestamp>(a+)+),(?<severity>.*),(?<text>.*)$"),
      /potentially unsafe/
    );
  });

  test("rejects an unmatched required timestamp", async () => {
    const pattern = "^(?<timestamp>x)?,(?<severity>[^,]+),(?<text>.*)$";
    await assert.rejects(() => parseLogs(",INFO,Missing timestamp", pattern), /did not capture/);
  });
});

suite("Log file reading", () => {
  let temporaryDirectory: string;

  suiteSetup(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "log-to-table-"));
  });

  suiteTeardown(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  test("reads a small file completely", async () => {
    const filePath = join(temporaryDirectory, "small.log");
    await writeFile(filePath, "small log");

    const result = await getLogContent(filePath);

    assert.equal(result.contents, "small log");
    assert.equal(result.fileSize, 9);
  });

  test("reads a UTF-8-safe tail from a large file", async () => {
    const filePath = join(temporaryDirectory, "large.log");
    const repeatedCharacters = "é".repeat((MAX_BYTES_TO_READ + 98) / 2);
    const content = `a${repeatedCharacters}b`;
    await writeFile(filePath, content);

    const result = await getLogContent(filePath);

    assert.equal(result.fileSize, MAX_BYTES_TO_READ + 100);
    assert.ok(Buffer.byteLength(result.contents) <= MAX_BYTES_TO_READ);
    assert.ok(!result.contents.includes("�"));
    assert.ok(result.contents.endsWith("b"));
  });
});

suite("Extension", () => {
  test("activates and registers both commands", async () => {
    const extension = vscode.extensions.getExtension("nathanjames.laravel-log-viewer-table");
    assert.ok(extension);

    await extension.activate();
    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes("log-viewer.formatLogs"));
    assert.ok(commands.includes("log-viewer.findAndOpen"));
  });
});
