import fs from "node:fs";

function parseCsv(fileContents) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < fileContents.length; i += 1) {
    const char = fileContents[i];
    const nextChar = fileContents[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function readRows(filePath) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const [headerRow = [], ...dataRows] = parseCsv(fileContents);
  const headers = headerRow.map((header) => String(header || "").trim().toLowerCase());

  return dataRows
    .filter((row) => row.some((value) => String(value || "").trim()))
    .map((row) =>
      headers.reduce((acc, header, index) => {
        if (!header) return acc;
        acc[header] = String(row[index] || "").trim();
        return acc;
      }, {}),
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

export function parseSingleProductShortCodes(filePath) {
  return parseShortCodeRows(readRows(filePath));
}

export function parseComboProductShortCodes(filePath) {
  return parseShortCodeRows(readRows(filePath));
}
