#!/usr/bin/env node
/**
 * One-time backfill: push every email already in Supabase `newsletter_signups`
 * into beehiiv. Run this ONCE after your beehiiv account + keys are set up, so
 * the people who signed up before beehiiv existed land in your sending list.
 *
 * Usage (from toxome-website/):
 *   node --env-file=.env.local scripts/sync-supabase-to-beehiiv.mjs
 *
 * Safe to re-run: beehiiv dedupes by email, and we send no welcome email here
 * (these people already opted in — don't re-greet them).
 */
import { createClient } from "@supabase/supabase-js";
import { subscribeToBeehiiv } from "../lib/beehiiv.mjs";

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BEEHIIV_API_KEY,
  BEEHIIV_PUBLICATION_ID,
} = process.env;

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BEEHIIV_API_KEY,
  BEEHIIV_PUBLICATION_ID,
})) {
  if (!val) {
    console.error(`Missing env var: ${name}. Set it in .env.local first.`);
    process.exit(1);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("newsletter_signups")
    .select("email, source");
  if (error) {
    console.error("Supabase read failed:", error.message);
    process.exit(1);
  }

  // Dedupe locally to avoid redundant API calls.
  const emails = [...new Set((data ?? []).map((r) => r.email?.trim().toLowerCase()).filter(Boolean))];
  console.log(`Found ${emails.length} unique emails to sync to beehiiv.`);

  let ok = 0;
  let failed = 0;
  for (const email of emails) {
    // These people already opted in via Supabase — don't re-greet them or
    // reactivate an intentional unsubscribe.
    const result = await subscribeToBeehiiv(email, {
      source: "supabase_backfill",
      sendWelcomeEmail: false,
      reactivateExisting: false,
    });
    if (result.ok) {
      ok++;
    } else {
      failed++;
      console.warn(`  ✗ ${email} (${result.status ?? "error"}): ${result.error ?? ""}`);
    }
    // Gentle on beehiiv's rate limit.
    await sleep(250);
  }

  console.log(`\nDone. Synced ${ok}, failed ${failed}, total ${emails.length}.`);
}

main();
