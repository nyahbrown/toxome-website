import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getArticle, getAllArticles } from "@/lib/journal";
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

export const runtime = "nodejs";
export const dynamic = "force-static";

const W = 1000;
const H = 1500;

export async function generateStaticParams() {
  const params: Array<{ slug: string; i: string }> = [];
  for (const article of getAllArticles()) {
    let pool: string[];
    try {
      pool = await articlePhotoPool(article);
    } catch {
      // Product lookup unavailable at build: still ship the hero pin.
      pool = article.hero ? [article.hero] : [];
    }
    pool.forEach((_, i) => params.push({ slug: article.slug, i: String(i) }));
  }
  return params;
}

// The hero is a site-relative /public path; product shots are remote https URLs.
async function loadPhoto(src: string): Promise<Buffer | null> {
  try {
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return await fs.readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; i: string }> }
) {
  const { slug, i } = await params;
  const article = getArticle(slug);
  if (!article) return new Response("Not found", { status: 404 });

  const pool = await articlePhotoPool(article);
  const idx = Number.parseInt(i, 10);
  const src = pool[Number.isFinite(idx) ? idx : 0] ?? pool[0] ?? article.hero;

  const photo = await loadPhoto(src);
  if (!photo) return new Response("Not found", { status: 404 });

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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
