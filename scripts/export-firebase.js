/**
 * Export Toxome recommendations from Firebase → recommendations.json
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → Service accounts
 *   2. Click "Generate new private key" → save as scripts/serviceAccountKey.json
 *   3. Run: node scripts/export-firebase.js
 *
 * Output: scripts/recommendations.json (ready to import to Supabase)
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const KEY_PATH = path.join(__dirname, "serviceAccountKey.json");
if (!fs.existsSync(KEY_PATH)) {
  console.error(
    "Missing scripts/serviceAccountKey.json\n" +
    "Get it from Firebase Console → Project Settings → Service accounts → Generate new private key"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(KEY_PATH)),
});

const db = admin.firestore();

async function exportRecommendations() {
  console.log("Fetching recommendations from Firebase...");
  const snapshot = await db.collection("recommendations").get();

  const items = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      item_name: d.item_name ?? null,
      brand: d.brand ?? null,
      item_price: typeof d.item_price === "number" ? d.item_price : null,
      budget: d.budget ?? null,
      category: d.category ?? null,
      gender: d.gender ?? null,
      region: d.reigon ?? d.region ?? null, // fix original typo
      item_image: d.item_image ?? null,
      item_url: d.item_url ?? null,
      affiliate_url: null,
      published: true,
      added_by: "editor",
    };
  });

  const outPath = path.join(__dirname, "recommendations.json");
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
  console.log(`Exported ${items.length} items → ${outPath}`);
}

exportRecommendations().catch(console.error);
