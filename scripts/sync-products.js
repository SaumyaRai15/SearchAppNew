import Typesense from "typesense";
import axios from "axios";
import dotenv from "dotenv";
import os from "node:os";
import path from "node:path";
import { parseExcel } from "./parseExcel.js";

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
console.log("excelFilePath: ", excelFilePath);
const excelMap = parseExcel(excelFilePath);
console.log("excelMap", excelMap);
console.log("excelMap length", Object.keys(excelMap).length);

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

function transformProduct(product) {
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

  const audience = [];
  if (titleLower.includes("men")) audience.push("men");
  if (titleLower.includes("women")) audience.push("women");

  const productType = [];
  ["wash", "cleanser", "serum", "oil", "cream"].forEach((k) => {
    if (titleLower.includes(k)) productType.push(k);
  });

  const variants = attrs.variants.data.map((v) => v);

  // 🔥 GET SKU (first variant or fallback)
  const sku = variants.find((v) => v.attributes?.sku)?.attributes?.sku || variants[0]?.attributes?.sku || null;

  // 🔥 GET EXCEL DATA
  const excel = sku ? excelMap[sku] || {} : {};

  return {
    id: product.id,
    product_id: attrs.shopifyProductId,

    sku: sku,
    ingredients: excel.ingredients || [],
    additional_ingredients: excel.additional_ingredients || [],
    gender: excel.gender || [],
    skin_hair_type: excel.skin_hair_type || [],
    seasonality: excel.seasonality || [],
    target_age_group: excel.target_age_group || [],
    benefits: excel.benefits || [],
    safety_callouts: excel.safety_callouts || [],

    title: normalizedTitle,
    subtitle: attrs.subtitle || "",
    url: attrs.url,
    featured_image: featured,
    rating: attrs.rating,
    collections,
    categories: [...categories],
    concerns,
    audience,
    product_type: productType,
    compare_at_price: compareAtPrices.length ? Math.min(...compareAtPrices) : null,
    variants,
    price: prices.length ? Math.min(...prices) : null,
    updated_at: isoToUnix(attrs.updatedAt),
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
  const docs = products.map(transformProduct);

  console.log("Importing into Typesense...");
  const result = await client.collections("products").documents().import(docs, { action: "upsert" });

  console.log("Done. Imported:", docs.length);
}

syncProducts().catch(console.error);
