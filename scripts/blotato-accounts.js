#!/usr/bin/env node
/**
 * blotato-accounts — discover the IDs the scheduler needs.
 *
 * After you connect Instagram, X, and Pinterest inside the Blotato dashboard,
 * run this once. It lists every connected account (with its accountId) and your
 * Pinterest boards (with boardId), then prints the exact env lines to paste into
 * .env.local so the content dashboard can auto-publish on approve.
 *
 * Usage:
 *   node scripts/blotato-accounts.js
 *
 * Env: reads BLOTATO_API_KEY from the environment or from .env.local
 * (auto-loaded — no dotenv dependency), same as the other scripts here.
 */

const fs = require("fs");
const path = require("path");

const BASE = "https://backend.blotato.com/v2";

const ACCOUNT_ENV = {
  instagram: "BLOTATO_INSTAGRAM_ACCOUNT_ID",
  twitter: "BLOTATO_TWITTER_ACCOUNT_ID",
  pinterest: "BLOTATO_PINTEREST_ACCOUNT_ID",
  tiktok: "BLOTATO_TIKTOK_ACCOUNT_ID",
};

function loadEnvLocal() {
  if (process.env.BLOTATO_API_KEY || process.env.BLOTATO_API_TOKEN) return;
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

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) die(`${url} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function main() {
  loadEnvLocal();
  const key = process.env.BLOTATO_API_KEY || process.env.BLOTATO_API_TOKEN;
  if (!key) die("Missing BLOTATO_API_KEY (not in env or .env.local)");
  const headers = { "blotato-api-key": key };

  const { items: accounts = [] } = await getJson(`${BASE}/users/me/accounts`, headers);
  if (!accounts.length) {
    console.log("No connected accounts yet. Connect Instagram, X, and Pinterest");
    console.log("in the Blotato dashboard first, then re-run this.");
    return;
  }

  const envLines = ["SCHEDULER_PROVIDER=blotato"];
  let pinterestAccountId = null;

  console.log(`\nConnected accounts (${accounts.length}):\n`);
  for (const a of accounts) {
    const who = a.username || a.fullname || "";
    console.log(`  ${String(a.platform).padEnd(11)} ${who.padEnd(24)} id ${a.id}`);
    if (ACCOUNT_ENV[a.platform]) envLines.push(`${ACCOUNT_ENV[a.platform]}=${a.id}`);
    if (a.platform === "pinterest") pinterestAccountId = a.id;
  }

  if (pinterestAccountId) {
    const { items: boards = [] } = await getJson(
      `${BASE}/social/pinterest/boards?accountId=${pinterestAccountId}`,
      headers
    );
    if (boards.length) {
      console.log(`\nPinterest boards (${boards.length}) — pick the one you post to:\n`);
      for (const b of boards) console.log(`  ${String(b.name).padEnd(28)} board id ${b.id}`);
      envLines.push(`BLOTATO_PINTEREST_BOARD_ID=${boards[0].id}`);
    }
  }

  console.log(`\nPaste into .env.local (confirm the Pinterest board, then redeploy):\n`);
  console.log("  BLOTATO_API_KEY=<the key you already have>");
  for (const l of envLines) console.log(`  ${l}`);
  console.log("  NEXT_PUBLIC_SITE_URL=https://toxome.app");
  console.log("");
}

main().catch((e) => die(e.stack || String(e)));
