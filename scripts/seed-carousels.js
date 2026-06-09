#!/usr/bin/env node
/**
 * seed-carousels — one-time migration of the hardcoded CAROUSELS into the
 * `carousels` table. Upserts by slug, so it's safe to re-run. After this,
 * /studio/carousel reads slides from the DB, not from code.
 *
 *   node scripts/seed-carousels.js
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY from env or .env.local.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xclvodbmllglmharezqa.supabase.co";

function loadEnvLocal() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
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

const CAROUSELS = [
  {
    slug: "plastic-closet",
    title: "60% plastic closet",
    slides: [
      { kind: "cover", hook: "Up to 60% of the average closet is made from plastic.", stat: "60%", image: "/hero-field.jpg" },
      { kind: "statement", paras: ["Polyester is plastic, spun from petroleum.", "And most of us wear it against our skin, all day."] },
      { kind: "statement", paras: ["It traps heat and sweat, and sheds microplastics as it wears down.", "Some finishes are even linked to hormone disruption."] },
      { kind: "quote", quote: "“why is it so hard to find a plain shirt that isn’t made of plastic?”" },
      { kind: "statement", paras: ["So we built the check.", "Scan any clothing label and see what’s really in it."] },
      { kind: "close", headline: "Learn more about how your clothes are made.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "microplastics-blood",
    title: "Microplastics in blood",
    slides: [
      { kind: "cover", hook: "Scientists found microplastics in the blood of nearly 8 in 10 people they tested.", stat: "77%", image: "/hero-field.jpg" },
      { kind: "statement", paras: ["In 2022, researchers tested blood from 22 healthy adults.", "They found plastic particles in 77% of them."] },
      { kind: "statement", paras: ["One of the most common plastics was PET,", "the same material spun into polyester clothing."] },
      { kind: "quote", quote: "“we are wearing plastic, washing plastic, and now carrying it inside us.”" },
      { kind: "statement", paras: ["Your clothes are the plastic you touch most.", "So we built a way to check them."] },
      { kind: "close", headline: "See what your clothes are really made of.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "microfiber-shedding",
    title: "Microfiber shedding",
    slides: [
      { kind: "cover", hook: "A single load of synthetic laundry can release hundreds of thousands of plastic microfibers.", stat: "730K", image: "/fibers/wool-2.jpg" },
      { kind: "statement", paras: ["One synthetic wash load can shed up to 730,000 microfibers.", "Most are too small for any filter to catch."] },
      { kind: "statement", paras: ["They travel from your laundry to the ocean,", "and back to you, through water and food."] },
      { kind: "quote", quote: "“every time you wash polyester, it sheds a little more of itself.”" },
      { kind: "statement", paras: ["Natural fibers don’t shed plastic.", "Knowing what you own is where it starts."] },
      { kind: "close", headline: "Know what’s in your clothes.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "polyester-fertility",
    title: "Polyester & fertility",
    slides: [
      { kind: "cover", hook: "In one early study, every man who switched to polyester underwear saw his fertility fall.", stat: "100%", image: "/fibers/silk-1.jpg" },
      { kind: "statement", paras: ["In the early 1990s, Dr. Ahmed Shafik tracked men who wore polyester, cotton, or wool underwear."] },
      { kind: "statement", paras: ["Every man in the polyester group saw his sperm count fall, some to zero, within months."] },
      { kind: "statement", paras: ["The cotton and wool groups saw no change.", "And when the men stopped, their fertility came back."] },
      { kind: "quote", quote: "“it was a small, early study, but it asks a question worth sitting with.”" },
      { kind: "close", headline: "What you wear touches more than your skin.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "toxin-you-forgot",
    title: "The toxin you forgot",
    slides: [
      { kind: "cover", hook: "You cleaned up your skincare, your food, your water. Your clothes are the toxin you forgot.", stat: "60%", image: "/hero-field.jpg" },
      { kind: "statement", paras: ["Polyester is plastic, spun from petroleum.", "And it sits against your skin all day, every day."] },
      { kind: "statement", paras: ["It traps heat and sweat as you wear it,", "and sheds microplastics you breathe in and absorb."] },
      { kind: "statement", paras: ["You can't out-supplement what you wear.", "Removing toxins from your life has to include your closet."] },
      { kind: "quote", quote: "“you detoxed everything but the thing touching you 24/7.”" },
      { kind: "close", headline: "Know what's in your clothes. Scan any label, free.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "clothes-and-hormones",
    title: "Your clothes & your hormones",
    slides: [
      { kind: "cover", hook: "The clothes touching your skin all day could be disrupting your hormones.", stat: "100%", image: "/fibers/silk-1.jpg" },
      { kind: "statement", paras: ["The fabric against your skin doesn't just sit there.", "Synthetic finishes can carry endocrine disruptors."] },
      { kind: "statement", paras: ["In one early study, every man who switched to polyester underwear saw his fertility fall.", "It came back when he stopped."] },
      { kind: "statement", paras: ["If you're working on your hormones,", "your closet is part of the equation."] },
      { kind: "quote", quote: "“you'd never eat an endocrine disruptor. you're wearing one.”" },
      { kind: "close", headline: "Know what's in your clothes.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "read-a-label",
    title: "Read a label in 10 seconds",
    slides: [
      { kind: "cover", hook: "How to read a clothing label in 10 seconds, and spot plastic instantly.", stat: "10s", image: "/fibers/linen.jpg" },
      { kind: "statement", paras: ["Flip past the brand tag to the fiber tag.", "That's where the truth is."] },
      { kind: "statement", paras: ["Polyester, nylon, acrylic, elastane: that's plastic.", "Cotton, linen, wool, silk, hemp: that's natural."] },
      { kind: "statement", paras: ["Anything mostly synthetic", "is plastic against your skin all day."] },
      { kind: "quote", quote: "“the tag tells you more than the price ever will.”" },
      { kind: "close", headline: "Or scan it and let Toxome read it for you, free.", image: "/app-screenshot.png" },
    ],
  },
  {
    slug: "sustainable-decoded",
    title: "'Sustainable' materials decoded",
    slides: [
      { kind: "cover", hook: "5 'sustainable' materials that are actually plastic.", stat: "5", image: "/fibers/wool-2.jpg" },
      { kind: "statement", paras: ["Recycled polyester.", "Still plastic, still shedding microplastics into your skin and the ocean."] },
      { kind: "statement", paras: ["Vegan leather.", "Almost always plastic, usually polyurethane or PVC."] },
      { kind: "statement", paras: ["Bamboo viscose.", "Bamboo dissolved in harsh chemicals and re-spun into rayon."] },
      { kind: "statement", paras: ["“Eco,” “conscious,” “responsible” blends.", "Marketing words, not materials. Check the fiber tag."] },
      { kind: "close", headline: "Don't trust the claim. Scan the tag, free.", image: "/app-screenshot.png" },
    ],
  },
];

async function main() {
  loadEnvLocal();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("✗ Missing SUPABASE_SERVICE_ROLE_KEY (env or .env.local)");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, key);

  const rows = CAROUSELS.map((c) => ({ slug: c.slug, title: c.title, slides: c.slides }));
  const { data, error } = await supabase
    .from("carousels")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");
  if (error) {
    console.error(`✗ Upsert failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ Seeded ${data.length} carousels:`);
  for (const r of data) console.log(`  • ${r.slug}`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exit(1);
});
