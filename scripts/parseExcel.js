import XLSX from "xlsx";

// ---------- HELPERS ----------

const split = (val, limit) =>
  val && val !== "#N/A"
    ? val
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, limit ?? Infinity)
    : [];

const UNISEX_GENDER_TOKEN = "unisex";
const MEN_GENDER_TOKENS = ["men", "man", "male", "him", "boy"];
const WOMEN_GENDER_TOKENS = ["women", "woman", "female", "her", "girl"];

function normalizeGender(v = "") {
  v = v.toLowerCase();
  if (v.includes("all") || v.includes("unisex")) return [UNISEX_GENDER_TOKEN, ...MEN_GENDER_TOKENS, ...WOMEN_GENDER_TOKENS];
  if (v.match(/men|male|man|boy/)) return MEN_GENDER_TOKENS;
  if (v.match(/women|woman|female|girl/)) return WOMEN_GENDER_TOKENS;
  return [];
}

function normalizeSkinHair(v = "") {
  const value = v.toLowerCase().replace(/&/g, ",").replace(/-/g, " ");
  const res = new Set();

  if (
    value.includes("all skin and hair type") ||
    value.includes("all skin and hair types") ||
    value.includes("all hair and skin type") ||
    value.includes("all hair and skin types")
  ) {
    res.add("all_skin");
    res.add("all_hair");
  }

  if (value.includes("for all hair type") || value.includes("all hair type") || value.includes("all hair types")) {
    res.add("all_hair");
  }

  if (value.includes("all skin type") || value.includes("all skin types")) {
    res.add("all_skin");
  }

  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  tokens.forEach((token) => {
    if (token.includes("all")) {
      res.add("all_skin");
    }

    if (token.includes("dry")) {
      res.add("dry");
    }

    if (token.includes("oily")) {
      res.add("oily");
    }

    if (token.includes("sensitive")) {
      res.add("sensitive");
    }

    if (token.includes("acne")) {
      res.add("acne_prone");
    }

    if (token.includes("combination")) {
      res.add("combination");
    }

    if (token.includes("sunburnt")) {
      res.add("sunburnt");
    }

    if (token.includes("long hair")) {
      res.add("long_hair");
    }

    if (token.includes("short hair")) {
      res.add("short_hair");
    }

    if (token.includes("thick hair")) {
      res.add("thick_hair");
    }

    if (token.includes("voluminous hair")) {
      res.add("voluminous_hair");
    }
  });

  return [...res];
}

function normalizeSeason(v = "") {
  v = v.toLowerCase();
  const res = [];

  if (v.includes("all")) res.push("all_season");
  if (v.includes("summer")) res.push("summer");
  if (v.includes("winter")) res.push("winter");
  if (v.includes("monsoon") || v.includes("humid")) res.push("monsoon");

  return res;
}

function normalizeAge(v = "") {
  const value = v
    .toLowerCase()
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (value.includes("teen")) return ["teen"];
  if (value.includes("35+")) return ["mature"];
  if (value.includes("20-35")) return ["adult"];
  if (
    value.includes("0+") ||
    value.includes("0-5") ||
    value.includes("0-8") ||
    value.includes("upto") ||
    value.includes("month") ||
    /(^|\D)1\+/.test(value) ||
    /(^|\D)2\+/.test(value) ||
    /(^|\D)3\+/.test(value) ||
    /(^|\D)5\+/.test(value) ||
    /(^|\D)6\+/.test(value) ||
    /(^|\D)8\+/.test(value)
  ) {
    return ["baby"];
  }
  if (value.includes("all") || value.includes("na") || value.includes("12+")) return ["adult"];
  return ["adult"];
}

// ---------- MAIN ----------

export function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range: 3,
    defval: "",
  });

  if (rows.length === 0) {
    return {};
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => String(header || "").trim());
  const json = dataRows.map((row) =>
    headers.reduce((acc, header, index) => {
      if (!header) return acc;
      acc[header] = row[index];
      return acc;
    }, {}),
  );

  const map = {};

  json.forEach((row) => {
    const sku = row["SKU"];
    if (!sku) return;

    map[sku] = {
      ingredients: split(row["Ingredients"], 5),
      additional_ingredients: split(row["Additional Ingreds Callout - Beyond Top 4-5"]),

      gender: normalizeGender(row["Gender"]),
      skin_hair_type: normalizeSkinHair(row["Skin/Hair Type"]),
      seasonality: normalizeSeason(row["Seasonality"]),
      target_age_group: normalizeAge(row["Target Age Group"]),

      concerns_excel: split(row["Concerns"]),
      benefits: split(row["Benefits"]),
      safety_callouts: split(row["Safety/Negative Call Outs"]),
    };
  });

  return map;
}
