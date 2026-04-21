import Typesense from "typesense";
import axios from "axios";
import dotenv from "dotenv";
import os from "node:os";
import path from "node:path";
import { isBlankOrNaIngredientValue, parseExcel } from "./parseExcel.js";
import {
  parseComboBundleItemSkus,
  parseComboProductShortCodes,
  parseOrderGroupedSalesData,
  parseSingleProductShortCodes,
} from "./parseShortCodes.js";

dotenv.config();

/* -----------------------------
   Typesense Client
----------------------------- */

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_KEY,
  connectionTimeoutSeconds: 10,
});

const excelFilePath =
  process.env.EXCEL_FILE_PATH || path.join(os.homedir(), "Downloads", "D2C SEO - Search Keyword Mapping.xlsx");
const excelMap = parseExcel(excelFilePath);
const singleProductShortCodePath = path.join(os.homedir(), "Downloads", "single_product_sku.csv");
const comboProductShortCodePath = path.join(os.homedir(), "Downloads", "combo_products_with_different_skus.csv");
const comboBundleItemsPath =
  process.env.COMBO_BUNDLE_ITEMS_CSV_PATH ||
  path.join(os.homedir(), "Downloads", "combo_products_with_rent_skus_and_no_join.csv");
const singleProductShortCodeMap = parseSingleProductShortCodes(singleProductShortCodePath);
const comboProductShortCodeMap = parseComboProductShortCodes(comboProductShortCodePath);
const comboSkuToBundleItemSkus = parseComboBundleItemSkus(comboBundleItemsPath);
const orderGroupedSalesPath =
  process.env.ORDER_GROUPED_SALES_CSV_PATH || path.join(os.homedir(), "Downloads", "order_grouped_sales_data.csv");
const popularityByVariantId = parseOrderGroupedSalesData(orderGroupedSalesPath);

/* -----------------------------
   CMS Query
----------------------------- */

const PRODUCTS_QUERY = `
  query Products($publicationState: PublicationState!) {
    products(
      publicationState: $publicationState
      pagination: { limit: 1000 }
      filters: {
        categories: { not: null }
        collections: { url: { notNull: true } }
      }
    ) {
      data {
        id
        attributes {
          title
          subtitle
          url
          updatedAt
          shopifyProductId
          rating
          featuredImage {
            data {
              attributes {
                url
              }
            }
          }

          concerns {
            data {
              attributes {
                displayTitle
              }
            }
          }

          variants {
            data {
              attributes {
                price
                compareAtPrice
                shopifyVariantId
                sku
                title
                measurementUnit
                measurementValue
              }
            }
          }

          collections {
            data {
              attributes {
                url
                category {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
/* -----------------------------
   Helpers
----------------------------- */

function isoToUnix(ts) {
  return Math.floor(new Date(ts).getTime() / 1000);
}

const UNISEX_GENDER_TOKEN = "unisex";
const MEN_GENDER_TOKENS = ["men", "man", "male"];
const WOMEN_GENDER_TOKENS = ["women", "woman", "female"];

function normalizeTitle(title = "") {
  let wordIndex = 0;

  return title
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) {
        return token;
      }

      if (wordIndex === 0) {
        wordIndex += 1;
        return token;
      }

      wordIndex += 1;

      const uppercaseWordMatch = token.match(/^([^A-Za-z]*)([A-Z]+)([^A-Za-z]*)$/);
      if (!uppercaseWordMatch) {
        return token;
      }

      const [, prefix, word, suffix] = uppercaseWordMatch;
      return `${prefix}${word.charAt(0)}${word.slice(1).toLowerCase()}${suffix}`;
    })
    .join("");
}

function getProductSku(variants) {
  return variants.find((v) => v.attributes?.sku)?.attributes?.sku || variants[0]?.attributes?.sku || null;
}

/** Normalize CMS shopifyVariantId to the numeric id string used in order_grouped_sales_data. */
function normalizeShopifyVariantId(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  const gidMatch = s.match(/ProductVariant\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return s || null;
}

/** Sum CSV `sum` values for each variant on the document (variant_id → popularity). */
function getDocumentPopularityScore(variantNodes) {
  let total = 0;
  for (const v of variantNodes) {
    const id = normalizeShopifyVariantId(v.attributes?.shopifyVariantId);
    if (!id) continue;
    const n = Number(id);
    const key = Number.isFinite(n) ? String(n) : id;
    const score = popularityByVariantId[key] ?? popularityByVariantId[id] ?? 0;
    total += score;
  }
  return total;
}

/** Merge ingredients from D2C sheet for each bundle line-item SKU (SQL export → combo_products_with_rent_skus_and_no_join.csv). */
function mergeComboIngredientsFromBundleSkus(comboSku, bundleSkuMap) {
  const componentSkus = bundleSkuMap.get(String(comboSku || "").trim()) || [];
  const ingredients = [];
  const additional_ingredients = [];
  const seenI = new Set();
  const seenA = new Set();

  for (const itemSku of componentSkus) {
    const key = String(itemSku || "").trim();
    const row = key ? excelMap[key] : null;
    if (!row) continue;

    for (const x of row.ingredients || []) {
      if (isBlankOrNaIngredientValue(x)) continue;
      const k = String(x).toLowerCase();
      if (!k || seenI.has(k)) continue;
      seenI.add(k);
      ingredients.push(x);
    }
    for (const x of row.additional_ingredients || []) {
      if (isBlankOrNaIngredientValue(x)) continue;
      const k = String(x).toLowerCase();
      if (!k || seenA.has(k)) continue;
      seenA.add(k);
      additional_ingredients.push(x);
    }
  }

  return { ingredients, additional_ingredients };
}

function getTitleGender(title = "") {
  const normalizedTitle = title.toLowerCase();
  const gender = new Set();

  if (normalizedTitle.match(/\bunisex\b/)) {
    gender.add(UNISEX_GENDER_TOKEN);
  }

  if (normalizedTitle.match(/\b(?:men|male|man|boy)\b/)) {
    MEN_GENDER_TOKENS.forEach((token) => gender.add(token));
  }

  if (normalizedTitle.match(/\b(?:women|woman|female|girl)\b/)) {
    WOMEN_GENDER_TOKENS.forEach((token) => gender.add(token));
  }

  if (gender.size < 1) {
    MEN_GENDER_TOKENS.forEach((token) => gender.add(token));
    WOMEN_GENDER_TOKENS.forEach((token) => gender.add(token));
  }

  return [...gender];
}

function transformProduct(product, { shortCode, includeExcelData = true } = {}) {
  const attrs = product.attributes;
  const normalizedTitle = normalizeTitle(attrs.title || "");

  const collections = [];
  const categories = new Set();

  attrs.collections.data.forEach((c) => {
    collections.push(c.attributes.url);

    const cat = c.attributes.category?.data;
    if (cat) {
      categories.add(cat.attributes.url);
    }
  });

  const featured = attrs.featuredImage?.data?.attributes?.url || null;

  const prices = attrs.variants.data.map((v) => parseFloat(v.attributes.price)).filter(Boolean);
  const compareAtPrices = attrs.variants.data.map((v) => parseFloat(v.attributes.compareAtPrice)).filter(Boolean);

  const concerns = attrs.concerns.data
    .filter((c) => c.attributes?.displayTitle)
    .map((c) => c.attributes.displayTitle.toLowerCase());

  const titleLower = normalizedTitle.toLowerCase();

  const productType = [];
  ["wash", "cleanser", "serum", "oil", "cream"].forEach((k) => {
    if (titleLower.includes(k)) productType.push(k);
  });

  const variants = attrs.variants.data.map((v) => v);
  const sku = getProductSku(variants);
  const excel = includeExcelData && sku ? excelMap[sku] || {} : {};
  const gender = [...new Set([...(excel.gender || []), ...getTitleGender(normalizedTitle)])];
  const popularity_score = getDocumentPopularityScore(attrs.variants.data);

  return {
    id: product.id,
    product_id: attrs.shopifyProductId,

    sku: sku,
    title: normalizedTitle,
    short_code: shortCode || normalizedTitle,
    subtitle: attrs.subtitle || "",
    url: attrs.url,
    featured_image: featured,
    rating: attrs.rating,
    collections,
    categories: [...categories],
    concerns,
    gender,
    product_type: productType,
    compare_at_price: compareAtPrices.length ? Math.min(...compareAtPrices) : null,
    variants,
    price: prices.length ? Math.min(...prices) : null,
    popularity_score,
    updated_at: isoToUnix(attrs.updatedAt),
    ...(includeExcelData
      ? {
          ingredients: excel.ingredients || [],
          additional_ingredients: excel.additional_ingredients || [],
          skin_hair_type: excel.skin_hair_type || [],
          seasonality: excel.seasonality || [],
          target_age_group: excel.target_age_group || [],
          benefits: excel.benefits || [],
          safety_callouts: excel.safety_callouts || [],
        }
      : {}),
  };
}

/* -----------------------------
   Main Sync Function
----------------------------- */

async function syncProducts() {
  console.log("Fetching CMS products...");

  const res = await axios.post(
    process.env.CMS_GRAPHQL_URL,
    {
      query: PRODUCTS_QUERY,
      variables: { publicationState: "LIVE" },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CMS_TOKEN}`,
      },
    },
  );

  const products = res.data.data.products.data;

  console.log("Transforming products...");
  const docs = products.map((product) => {
    const variants = product.attributes.variants.data.map((v) => v);
    const sku = getProductSku(variants);
    const isComboProduct = Boolean(sku && Object.hasOwn(comboProductShortCodeMap, sku));
    const comboShortCode = isComboProduct ? comboProductShortCodeMap[sku] : "";
    const shortCode =
      (isComboProduct ? comboShortCode : sku ? singleProductShortCodeMap[sku] : "") ||
      normalizeTitle(product.attributes.title || "");

    const doc = transformProduct(product, {
      shortCode,
      includeExcelData: !isComboProduct,
    });

    if (isComboProduct && sku) {
      const merged = mergeComboIngredientsFromBundleSkus(sku, comboSkuToBundleItemSkus);
      doc.ingredients = merged.ingredients;
      doc.additional_ingredients = merged.additional_ingredients;
    }

    return {
      isComboProduct,
      doc,
    };
  });
  const productDocs = docs.filter((entry) => !entry.isComboProduct).map((entry) => entry.doc);
  const comboDocs = docs.filter((entry) => entry.isComboProduct).map((entry) => entry.doc);

  console.log("Importing products into Typesense...");
  if (productDocs.length > 0) {
    await client.collections("products").documents().import(productDocs, { action: "upsert" });
  }

  console.log("Importing combos into Typesense...");
  if (comboDocs.length > 0) {
    await client.collections("combo_products").documents().import(comboDocs, { action: "upsert" });
  }

  console.log("Done. Imported products:", productDocs.length);
  console.log("Done. Imported combos:", comboDocs.length);
}

syncProducts().catch(console.error);
