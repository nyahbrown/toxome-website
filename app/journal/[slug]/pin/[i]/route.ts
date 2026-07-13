import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getArticle } from "@/lib/journal";
import { articlePhotoPool } from "@/lib/journal-products";

// A BARE 1000×1500 (2:3) photograph. No logo, no wordmark, no score ring, no
// scrim, no headline, no CTA — nothing overlaid at all.
//
// This is deliberate, and it replaces the old branded "teaser card" pin. We
// audited The Good Trade's Pinterest (56.3k followers, 2M monthly views,
// Pinterest is their #1 traffic source): every pin they create is a plain
// lifestyle/product photo linking to a roundup article, with the SEO headline
// as the pin title. Our branded template earned 7–11 impressions a pin. The
// keyword now lives in the pin TITLE (set by the journal-pinterest cron), not
// on the image.
//
// `[i]` indexes the article's photo pool (hero, then each Shop-the-edit product
// shot), so one article drips out as several distinct pins over time.
//
// This route deliberately does NOT use next/og — Satori can't decode WebP, and
// several catalog photos are WebP, which hard-fails the static export. sharp
// (already a Next dependency) does the cover-crop and handles every format.
//
// ── Why this is DYNAMIC, not force-static ────────────────────────────────────
// It used to be `force-static` + generateStaticParams. That froze the photo pool
// at build time while the cron kept computing it from LIVE product data at run
// time, and the two drifted. Worse: when a product host refused the build
// container's fetch (eileenfisher.com refused two photos on the Vercel builder
// that fetch fine everywhere else), this route returned its own 404 and Next
// froze THAT 404 as the prerendered body — /journal/linen-vs-cotton/pin/3 and
// /pin/4 served a permanent `404 Not found` in production even though the photos
// were live. A pin the cron queues must always render, so the pool is now
// resolved per request from the same live data the cron reads, and a failed
// photo fetch returns an UNCACHED 404 that heals on the next request instead of
// being frozen forever.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1000;
const H = 1500;

// Some catalog hosts (Salesforce Commerce Cloud in particular) reject requests
// with no browser identity, which is how the two Eileen Fisher photos went dark.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// The hero is a site-relative /public path; product shots are remote https URLs.
async function loadPhoto(src: string): Promise<Buffer | null> {
  try {
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src, {
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": UA, accept: "image/*,*/*" },
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return await fs.readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  } catch {
    return null;
  }
}

// A photo that can't be fetched right now is a TRANSIENT failure, so its 404 is
// never cached — the next request (and the cron's pre-flight) re-tries it.
function notFound(reason: string) {
  return new Response(reason, {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; i: string }> }
) {
  const { slug, i } = await params;
  const article = getArticle(slug);
  if (!article) return notFound("Not found");

  const pool = await articlePhotoPool(article);
  const idx = Number.parseInt(i, 10);
  // Out of range is a real 404, not a silent fall back to the hero: an index the
  // cron never queues must not quietly serve photo 0 as if it were its own pin.
  if (!Number.isInteger(idx) || idx < 0 || idx >= pool.length) {
    return notFound("Not found");
  }

  const photo = await loadPhoto(pool[idx]);
  if (!photo) return notFound("Photo unavailable");

  const jpeg = await sharp(photo)
    .rotate() // honor EXIF orientation before cropping
    .resize(W, H, { fit: "cover", position: "centre" })
    // Cutout product shots ship as transparent PNGs; flatten onto the brand
    // cream so the pin never renders on black.
    .flatten({ background: "#FCFBF7" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      // Pinterest fetches a pin's image once, and readers save it rarely, so the
      // CDN carries essentially all of the traffic and the render cost is a
      // rounding error. Cached for a day at the edge (a month while stale) —
      // long enough to be free, short enough that a catalog change reaching the
      // photo pool shows up on the pin instead of being pinned to a stale photo
      // for a year.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=2592000",
    },
  });
}
