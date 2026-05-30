import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isBlacklisted } from "@/lib/brandBlacklist";
import { extractProductFromUrl } from "@/lib/extractProduct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "URL must be http or https" },
      { status: 400 }
    );
  }

  const result = await extractProductFromUrl(url);
  if (!result.ok || !result.product) {
    return NextResponse.json(
      { error: result.error || "Could not extract a product" },
      { status: 422 }
    );
  }
  const product = result.product;

  if (isBlacklisted(product.brand)) {
    return NextResponse.json(
      { error: `${product.brand} is blacklisted` },
      { status: 422 }
    );
  }

  // Dedupe on the source URL (the one we fetched, which we also store).
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("item_url", product.item_url)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Already in catalog", product: existing },
      { status: 409 }
    );
  }

  // Manual adds go live immediately (no pending review).
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      ...product,
      published: true,
      rejected: false,
      added_by: "manual",
      reviewed_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Make it appear on the shop grid right away.
  for (const p of ["/shop", "/shop/women", "/shop/men", "/shop/home"]) {
    revalidatePath(p);
  }
  if (data?.id) revalidatePath(`/shop/${data.id}`);

  return NextResponse.json({ product: data });
}
