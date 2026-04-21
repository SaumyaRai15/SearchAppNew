import Typesense from "typesense";
import dotenv from "dotenv";

dotenv.config();

const CURATION_SET_NAME = "product_combo_search_rules";

/** Multi-way: any of these tokens in `q` also match the others in indexed text (e.g. malai ↔ cream ↔ moisturiser). */
const SKIN_CREAM_SYNONYM_SET_NAME = "skin_cream_synonyms";

/** Multi-way: cleanser / face wash phrasing. */
const FACE_CLEANSER_SYNONYM_SET_NAME = "face_cleanser_synonyms";

const PRODUCT_SYNONYM_SETS = [SKIN_CREAM_SYNONYM_SET_NAME, FACE_CLEANSER_SYNONYM_SET_NAME];

/** Intent tokens; stripping "combo"/"combos" can leave q empty (e.g. "female combo" → ""). */
const COMBO_OVERRIDE_TERMS = ["gift", "gifts", "kit", "kits", "set", "sets", "pack", "packs", "combo", "combos"];
const GENDER_OVERRIDE_RULES = [
  {
    id: "gender-unisex",
    terms: ["unisex"],
    filter_by: "gender:=[unisex]",
  },
  {
    id: "gender-men",
    terms: ["men", "man", "male", "him", "boy"],
    filter_by: "gender:=[men,man,male,him,boy]",
  },
  {
    id: "gender-women",
    terms: ["women", "woman", "female", "her", "girl"],
    filter_by: "gender:=[women,woman,female,her,girl]",
  },
];

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_KEY,
  connectionTimeoutSeconds: 5,
});

//delete collections
async function resetCollections() {
  const collections = ["products", "combo_products", "search_suggestions", "product_popularity"];

  for (const name of collections) {
    try {
      await client.collections(name).delete();
      console.log(`Deleted collection: ${name}`);
    } catch (err) {
      console.log(`Collection ${name} did not exist`);
    }
  }
}

//create collections
async function createCollections() {
  // PRODUCTS
  await client.collections().create({
    name: "products",
    curation_sets: [CURATION_SET_NAME],
    synonym_sets: PRODUCT_SYNONYM_SETS,
    enable_nested_fields: true,
    fields: [
      { name: "id", type: "string" },
      { name: "title", type: "string" },
      { name: "short_code", type: "string", optional: true },
      { name: "subtitle", type: "string", optional: true },
      { name: "url", type: "string", optional: true },
      { name: "featured_image", type: "string", optional: true },
      { name: "rating", type: "float", optional: true },
      { name: "collections", type: "string[]", facet: true, optional: true },
      { name: "categories", type: "string[]", facet: true, optional: true },
      { name: "concerns", type: "string[]", facet: true, optional: true },
      { name: "sku", type: "string", optional: true },
      { name: "ingredients", type: "string[]", optional: true },
      { name: "additional_ingredients", type: "string[]", optional: true },
      { name: "gender", type: "string[]", facet: true, optional: true },
      { name: "skin_hair_type", type: "string[]", facet: true, optional: true },
      { name: "seasonality", type: "string[]", facet: true, optional: true },
      { name: "target_age_group", type: "string[]", facet: true, optional: true },
      { name: "benefits", type: "string[]", optional: true },
      { name: "safety_callouts", type: "string[]", optional: true },
      { name: "product_type", type: "string[]", facet: true, optional: true },
      { name: "price", type: "float", facet: true, optional: true },
      { name: "compare_at_price", type: "float", facet: true, optional: true },
      { name: "variants", type: "object[]", optional: true, facet: true },
      { name: "popularity_score", type: "int32", optional: true },
      { name: "updated_at", type: "int64" },
    ],
    default_sorting_field: "updated_at",
  });

  console.log("Created products collection");

  // COMBO PRODUCTS
  await client.collections().create({
    name: "combo_products",
    curation_sets: [CURATION_SET_NAME],
    synonym_sets: PRODUCT_SYNONYM_SETS,
    enable_nested_fields: true,
    fields: [
      { name: "id", type: "string" },
      { name: "title", type: "string" },
      { name: "short_code", type: "string", optional: true },
      { name: "subtitle", type: "string", optional: true },
      { name: "url", type: "string", optional: true },
      { name: "featured_image", type: "string", optional: true },
      { name: "rating", type: "float", optional: true },
      { name: "collections", type: "string[]", facet: true, optional: true },
      { name: "categories", type: "string[]", facet: true, optional: true },
      { name: "concerns", type: "string[]", facet: true, optional: true },
      { name: "sku", type: "string", optional: true },
      { name: "ingredients", type: "string[]", optional: true },
      { name: "additional_ingredients", type: "string[]", optional: true },
      { name: "gender", type: "string[]", facet: true, optional: true },
      { name: "skin_hair_type", type: "string[]", facet: true, optional: true },
      { name: "seasonality", type: "string[]", facet: true, optional: true },
      { name: "target_age_group", type: "string[]", facet: true, optional: true },
      { name: "product_type", type: "string[]", facet: true, optional: true },
      { name: "price", type: "float", facet: true, optional: true },
      { name: "compare_at_price", type: "float", facet: true, optional: true },
      { name: "variants", type: "object[]", optional: true, facet: true },
      { name: "popularity_score", type: "int32", optional: true },
      { name: "updated_at", type: "int64" },
    ],
    default_sorting_field: "updated_at",
  });

  console.log("Created combo_products collection");

  // SEARCH SUGGESTIONS
  await client.collections().create({
    name: "search_suggestions",
    fields: [
      { name: "id", type: "string" },
      { name: "label", type: "string" },
      { name: "query", type: "string" },
      { name: "filter_by", type: "string", optional: true },
      { name: "priority", type: "int32" },
    ],
    default_sorting_field: "priority",
  });

  console.log("Created search_suggestions collection");

  // POPULARITY
  // await client.collections().create({
  //   name: "product_popularity",
  //   fields: [
  //     { name: "id", type: "string" },
  //     { name: "product_id", type: "string" },
  //     { name: "DEL", type: "int32" },
  //     { name: "BOM", type: "int32" },
  //     { name: "BLR", type: "int32" },
  //     { name: "GGN", type: "int32" },
  //     { name: "title", type: "string", optional: true },
  //   ],
  // });

  // console.log("Created product_popularity collection");
}

async function createCurationSet() {
  const items = [];

  for (const term of COMBO_OVERRIDE_TERMS) {
    items.push({
      id: `combo-intent-${term}`,
      rule: {
        query: term,
        match: "contains",
      },
      remove_matched_tokens: true,
    });
  }

  // for (const ruleConfig of GENDER_OVERRIDE_RULES) {
  //   for (const term of ruleConfig.terms) {
  //     items.push({
  //       id: `${ruleConfig.id}-${term}`,
  //       rule: {
  //         query: term,
  //         match: "contains",
  //       },
  //       filter_by: ruleConfig.filter_by,
  //       remove_matched_tokens: false,
  //     });
  //   }
  // }

  await client.curationSets(CURATION_SET_NAME).upsert({
    name: CURATION_SET_NAME,
    items,
  });

  console.log(`Created/updated curation set: ${CURATION_SET_NAME}`);
}

async function createSkinCreamSynonymSet() {
  await client.synonymSets(SKIN_CREAM_SYNONYM_SET_NAME).upsert({
    items: [
      {
        id: "cream-malai-moisturiser",
        synonyms: ["cream", "malai", "moisturiser", "moisturizer"],
      },
    ],
  });

  console.log(`Created/updated synonym set: ${SKIN_CREAM_SYNONYM_SET_NAME}`);
}

async function createFaceCleanserSynonymSet() {
  await client.synonymSets(FACE_CLEANSER_SYNONYM_SET_NAME).upsert({
    items: [
      {
        id: "cleanser-face-wash",
        synonyms: ["cleanser", "face wash", "facial cleanser", "face cleanser"],
      },
    ],
  });

  console.log(`Created/updated synonym set: ${FACE_CLEANSER_SYNONYM_SET_NAME}`);
}

async function run() {
  await resetCollections();
  await createCurationSet();
  await createSkinCreamSynonymSet();
  await createFaceCleanserSynonymSet();
  await createCollections();
  console.log("Typesense setup complete");
}

run();
