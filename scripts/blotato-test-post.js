#!/usr/bin/env node
/**
 * blotato-test-post — one-off verification.
 *
 * Publishes a PRIVATE (SELF_ONLY) 2-slide TikTok carousel through Blotato,
 * mirroring exactly what the dashboard's Approve does — only private, so nobody
 * but you sees it. Proves the whole chain: key → account id → media → Blotato →
 * TikTok. Delete the post in the TikTok app after.
 *
 *   node scripts/blotato-test-post.js
 *
 * Local-only helper. Not committed. Safe to delete after verifying.
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvLocal();
const key = process.env.BLOTATO_API_KEY;
const acct = process.env.BLOTATO_TIKTOK_ACCOUNT_ID;

const body = {
  post: {
    accountId: acct,
    content: {
      text: "Toxome pipeline test (private). Verifying TikTok carousel publishing. Will delete.",
      mediaUrls: [
        "https://toxome.app/fibers/cotton.jpg",
        "https://toxome.app/fibers/linen.jpg",
      ],
      platform: "tiktok",
    },
    target: {
      targetType: "tiktok",
      privacyLevel: "SELF_ONLY", // private — only you can see it
      isDraft: false,
      imageCoverIndex: 0,
      autoAddMusic: true,
      disabledComments: false,
      disabledDuet: false,
      disabledStitch: false,
      isBrandedContent: false,
      isYourBrand: false,
      isAiGenerated: false,
      title: "Toxome pipeline test",
    },
  },
};

(async () => {
  if (!key || !acct) {
    console.error("✗ Missing BLOTATO_API_KEY or BLOTATO_TIKTOK_ACCOUNT_ID in .env.local");
    process.exit(1);
  }
  console.log(`Posting a PRIVATE 2-slide TikTok carousel to account ${acct} …`);
  const res = await fetch("https://backend.blotato.com/v2/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "blotato-api-key": key },
    body: JSON.stringify(body),
  });
  console.log("HTTP", res.status, res.ok ? "OK ✓" : "FAIL ✗");
  console.log("Response:", (await res.text()).slice(0, 500));
  if (res.ok) {
    console.log("\nNow open TikTok → your profile. The private slideshow should appear");
    console.log('(visibility "Only you"). Delete it once you have confirmed. Then we know the chain works.');
  }
})();
