import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import XLSX from "xlsx";

function readRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value])),
  );
}

function parseShortCodeRows(rows) {
  return rows.reduce((map, row) => {
    const sku = String(row.sku || "").trim();
    if (!sku) return map;

    map[sku] = String(row.short_code || "").trim();
    return map;
  }, {});
}

function exportNumbersToCsv(filePath) {
  const csvFilePath = path.join(os.tmpdir(), `${path.basename(filePath, path.extname(filePath))}.csv`);

  execFileSync("osascript", [
    "-e",
    'tell application "Numbers"',
    "-e",
    `set theDoc to open POSIX file "${filePath}"`,
    "-e",
    "delay 1",
    "-e",
    `export theDoc to POSIX file "${csvFilePath}" as CSV`,
    "-e",
    "close theDoc saving no",
    "-e",
    "end tell",
  ]);

  return csvFilePath;
}

export function parseSingleProductShortCodes(filePath) {
  return parseShortCodeRows(readRows(filePath));
}

export function parseComboProductShortCodes(filePath) {
  const csvFilePath = exportNumbersToCsv(filePath);
  return parseShortCodeRows(readRows(csvFilePath));
}
