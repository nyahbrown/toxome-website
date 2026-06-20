import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "brand-disclosures";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 8;

const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "doc", "docx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_CLAIMS = new Set([
  "PFAS-free",
  "Azo-dye-free",
  "Formaldehyde-free",
  "Low-impact / OEKO-TEX-equivalent dyes",
  "Organic / GOTS-equivalent",
]);

// Loose but real email shape check.
function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Best-effort Telegram ping via the Pikey bot. Reuses Pikey's TELEGRAM_TOKEN /
// TELEGRAM_CHAT_ID. Never throws and never blocks the submission: if the vars
// are missing or Telegram is down, the brand's request still succeeds.
async function notifyTelegram(p: {
  brand_name: string;
  contact_email: string;
  product_name: string | null;
  product_url: string | null;
  claims: string[];
  fileCount: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    "🔬 New verification request",
    `Brand: ${p.brand_name}`,
    `Email: ${p.contact_email}`,
  ];
  if (p.product_name) lines.push(`Product: ${p.product_name}`);
  if (p.product_url) lines.push(`URL: ${p.product_url}`);
  lines.push(`Claims: ${p.claims.length ? p.claims.join(", ") : "none"}`);
  lines.push(`Files: ${p.fileCount}`);
  lines.push("Review: https://toxome.app/admin/disclosures");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // best-effort: swallow
  }
}

// Strip path traversal + keep a readable, safe filename.
function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

function ext(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

// POST /api/brand-disclosures
// Public multipart intake: a brand sends its own documentation to request a
// Verified rung. No paid certification required.
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const brand_name = String(form.get("brand_name") ?? "").trim();
  const contact_email = String(form.get("contact_email") ?? "").trim();
  const product_name = String(form.get("product_name") ?? "").trim() || null;
  const product_url = String(form.get("product_url") ?? "").trim() || null;
  const message = String(form.get("message") ?? "").trim() || null;

  if (!brand_name) {
    return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
  }
  if (!contact_email || !isEmail(contact_email)) {
    return NextResponse.json(
      { error: "A valid contact email is required" },
      { status: 400 }
    );
  }

  // Claims: accept repeated "claims" entries, keep only allowed values.
  const claims = form
    .getAll("claims")
    .map((c) => String(c).trim())
    .filter((c) => ALLOWED_CLAIMS.has(c));

  // Files: accept repeated "files" entries.
  const rawFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 }
    );
  }

  const document_paths: string[] = [];

  for (const file of rawFiles) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is over the 10MB limit` },
        { status: 400 }
      );
    }
    const fileExt = ext(file.name);
    const mimeOk = ALLOWED_MIME.has(file.type);
    const extOk = ALLOWED_EXT.has(fileExt);
    if (!extOk || (file.type && !mimeOk)) {
      return NextResponse.json(
        { error: `"${file.name}" is not an allowed file type` },
        { status: 400 }
      );
    }

    const path = `${crypto.randomUUID()}/${safeName(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to store an uploaded file" },
        { status: 500 }
      );
    }
    document_paths.push(path);
  }

  const { error: insertError } = await supabaseAdmin
    .from("brand_disclosures")
    .insert({
      brand_name,
      product_name,
      product_url,
      contact_email,
      claims,
      message,
      document_paths,
      status: "pending",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await notifyTelegram({
    brand_name,
    contact_email,
    product_name,
    product_url,
    claims,
    fileCount: document_paths.length,
  });

  return NextResponse.json({ ok: true });
}
