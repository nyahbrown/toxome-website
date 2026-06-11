import fs from "node:fs";
import path from "node:path";

// Maps a cert slug to its logo file in /public/certs, if one exists. Drop a file
// named after the slug (e.g. `gots.svg`, `oeko-tex-standard-100.png`) into
// public/certs and the circular badge swaps the monogram for the real logo with
// no code change. Checked at build time so the badge stays pure server-rendered.
export function availableLogos(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const dir = path.join(process.cwd(), "public", "certs");
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(.+)\.(svg|png|webp|avif|jpg|jpeg)$/i);
      if (m) map.set(m[1].toLowerCase(), `/certs/${f}`);
    }
  } catch {
    // No /public/certs yet — every badge falls back to its monogram.
  }
  return map;
}
