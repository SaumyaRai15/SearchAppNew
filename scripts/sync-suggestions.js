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
  connectionTimeoutSeconds: 10,
});

/* -----------------------------
   SEARCH SUGGESTIONS DATA
----------------------------- */

const SEARCH_SUGGESTIONS = [
  {
    id: "hair-fall",
    label: "Hair fall control products",
    query: "hair fall",
    filter_by: "concerns:=hairfall control && price:>=90",
    priority: 100,
  },
  {
    id: "hair-under-500",
    label: "Hair products under ₹500",
    query: "hair",
    filter_by: "categories:=hair-care && price:<=500 && price:>=90",
    priority: 95,
  },
  {
    id: "mens-facewash",
    label: "Face wash for men",
    query: "face wash",
    filter_by: "categories:=face-care && product_type:=wash && gender:=[men,man,male] && price:>=90",
    priority: 90,
  },
  {
    id: "gift-sets",
    label: "Gift sets & combos",
    query: "gift",
    filter_by: "categories:=gift && price:>=90",
    priority: 85,
  },
  {
    id: "face-care-glow",
    label: "Face care for glow & radiance",
    query: "face glow",
    filter_by: "categories:=face-care && concerns:=glow & radiance && price:>=90",
    priority: 80,
  },
  {
    id: "body-care",
    label: "Body care products",
    query: "body care",
    filter_by: "categories:=body-care && price:>=90",
    priority: 75,
  },
  {
    id: "hair-oils",
    label: "Hair oils",
    query: "hair oil",
    filter_by: "categories:=hair-care && product_type:=oil && price:>=90",
    priority: 70,
  },
  {
    id: "baby-care",
    label: "Baby care products",
    query: "baby care",
    filter_by: "categories:=baby-care && price:>=90",
    priority: 65,
  },
  {
    id: "face-pigmentation",
    label: "Pigmentation control products",
    query: "pigmentation",
    filter_by: "concerns:=pigmentation control && price:>=90",
    priority: 60,
  },
  {
    id: "affordable-under-300",
    label: "Products under ₹300",
    query: "affordable",
    filter_by: "price:<=300 && price:>=90",
    priority: 55,
  },
  {
    id: "ayurvedic-oils",
    label: "Ayurvedic & pure oils",
    query: "ayurvedic oil",
    filter_by: "categories:=ayurvedic-and-pure-oils && price:>=90",
    priority: 50,
  },
  {
    id: "tikta-facewash",
    label: "Tikta face wash collection",
    query: "tikta face wash",
    filter_by: "collections:=fresh-daily-tikta && product_type:=wash && price:>=90",
    priority: 45,
  },
  {
    id: "night-care",
    label: "Night care products",
    query: "night care",
    filter_by: "(categories:=night-care || concerns:=night care) && price:>=90",
    priority: 40,
  },
  {
    id: "combos",
    label: "Product combos",
    query: "combo",
    filter_by: "collections:=combos && price:>=90",
    priority: 35,
  },
  {
    id: "face-wash",
    label: "Face wash products",
    query: "face wash",
    filter_by: "categories:=face-care && product_type:=wash && price:>=90",
    priority: 30,
  },
  {
    id: "hair-growth",
    label: "Hair growth products",
    query: "hair growth",
    filter_by: "concerns:=hair growth && price:>=90",
    priority: 25,
  },
  {
    id: "eyes-lips",
    label: "Eyes & lips care",
    query: "eyes lips",
    filter_by: "categories:=eyes-and-lips && price:>=90",
    priority: 20,
  },
  {
    id: "hand-feet",
    label: "Hand & feet care",
    query: "hand feet",
    filter_by: "categories:=hand-and-feet && price:>=90",
    priority: 15,
  },
  {
    id: "mens-hair-products",
    label: "Hair products for men",
    query: "mens hair",
    filter_by: "categories:=hair-care && gender:=[men,man,male] && price:>=90",
    priority: 88,
  },
  {
    id: "face-care-under-300",
    label: "Face care under ₹300",
    query: "face care affordable",
    filter_by: "categories:=face-care && price:<=300 && price:>=90",
    priority: 82,
  },
  {
    id: "hair-products-under-300",
    label: "Hair products under ₹300",
    query: "hair products under ₹300",
    filter_by: "categories:=hair-care && price:<=300 && price:>=90",
    priority: 77,
  },
  {
    id: "gift-sets-under-1000",
    label: "Gift sets under ₹1000",
    query: "gift affordable",
    filter_by: "categories:=gift && price:<=1000 && price:>=90",
    priority: 72,
  },
  {
    id: "premium-over-500",
    label: "Premium products over ₹500",
    query: "premium",
    filter_by: "price:>=500",
    priority: 68,
  },
  {
    id: "mid-range-200-500",
    label: "Products ₹200-₹500",
    query: "mid range",
    filter_by: "price:>=200 && price:<=500",
    priority: 63,
  },
];

/* -----------------------------
   Import Function
----------------------------- */

async function syncSuggestions() {
  console.log("Importing search suggestions...");

  const result = await client
    .collections("search_suggestions")
    .documents()
    .import(SEARCH_SUGGESTIONS, { action: "upsert" });

  console.log("Done. Imported:", SEARCH_SUGGESTIONS.length);
}

syncSuggestions().catch(console.error);

//node scripts/sync-suggestions.js
