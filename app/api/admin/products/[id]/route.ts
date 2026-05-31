import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calcToxomeScore, scoreToRiskLevel } from "@/lib/fabricScores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action =
  | "approve"
  | "reject"
  | "restore"
  | "publish"
  | "unpublish"
  | "edit";

// Only these fields may be set via an `edit` action.
const EDITABLE_FIELDS = [
  "item_name",
  "brand",
  "item_price",
  "budget",
  "category",
  "gender",
  "item_image",
  "images",
  "item_url",
  "affiliate_url",
  "fabric_composition",
  "materials_text",
  "description",
  "certifications",
  "tags",
  "occasion",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: { action?: Action; fields?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const now = new Date().toISOString();
  let update: Record<string, unknown> = {};

  switch (body.action) {
    case "approve":
      update = {
        published: true,
        rejected: false,
        unpublish_reason: null,
        reviewed_at: now,
      };
      break;
    case "reject":
      update = { rejected: true, published: false, reviewed_at: now };
      break;
    case "restore":
      update = {
        rejected: false,
        published: false,
        unpublish_reason: null,
        reviewed_at: now,
      };
      break;
    case "publish":
      update = { published: true, unpublish_reason: null };
      break;
    case "unpublish":
      update = { published: false, unpublish_reason: "manual" };
      break;
    case "edit": {
      const fields = body.fields || {};
      for (const key of EDITABLE_FIELDS) {
        if (key in fields) {
          update[key] = fields[key];
        }
      }
      if (Object.keys(update).length === 0) {
        return NextResponse.json(
          { error: "No editable fields provided" },
          { status: 400 }
        );
      }
      // Recompute the score whenever the composition changes.
      if ("fabric_composition" in fields) {
        const comp = fields.fabric_composition as
          | Record<string, number>
          | null
          | undefined;
        const score = calcToxomeScore(comp);
        update.toxome_score = score;
        update.risk_level = scoreToRiskLevel(score);
      }
      update.reviewed_at = now;
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Any successful mutation can change a product's visibility, so refresh the
  // ISR-cached shop grid pages and the product detail page immediately.
  revalidatePath("/shop");
  revalidatePath("/shop/women");
  revalidatePath("/shop/men");
  revalidatePath("/shop/home");
  revalidatePath(`/shop/${id}`);

  return NextResponse.json({ product: data });
}
