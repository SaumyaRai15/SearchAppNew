import Typesense from "typesense";
import dotenv from "dotenv";

dotenv.config();

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
  const collections = ["products", "search_suggestions", "product_popularity"];

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
    enable_nested_fields: true,
    fields: [
      { name: "id", type: "string" },
      { name: "title", type: "string" },
      { name: "subtitle", type: "string", optional: true },
      { name: "url", type: "string", optional: true },
      { name: "featured_image", type: "string", optional: true },
      { name: "rating", type: "float", optional: true },
      { name: "collections", type: "string[]", facet: true, optional: true },
      { name: "categories", type: "string[]", facet: true, optional: true },
      { name: "concerns", type: "string[]", facet: true, optional: true },
      { name: "audience", type: "string[]", facet: true, optional: true },
      { name: "product_type", type: "string[]", facet: true, optional: true },
      { name: "price", type: "float", facet: true, optional: true },
      { name: "compare_at_price", type: "float", facet: true, optional: true },
      { name: "variants", type: "object[]", optional: true, facet: true },
      { name: "updated_at", type: "int64" },
    ],
    default_sorting_field: "updated_at",
  });

  console.log("Created products collection");

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
  await client.collections().create({
    name: "product_popularity",
    fields: [
      { name: "id", type: "string" },
      { name: "product_id", type: "string" },
      { name: "DEL", type: "int32" },
      { name: "BOM", type: "int32" },
      { name: "BLR", type: "int32" },
      { name: "GGN", type: "int32" },
      { name: "title", type: "string", optional: true },
    ],
  });

  console.log("Created product_popularity collection");
}

async function run() {
  await resetCollections();
  await createCollections();
  console.log("Typesense setup complete");
}

run();
