import { supabase } from "@/lib/supabase";

// Count of published products added in the last 7 days. The Toxome app's push
// Cloud Function reads this to send the weekly "N new items added this week"
// browse nudge. Computed live (not cached) so the number is always current.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .gte("created_at", since);

  if (error) {
    return Response.json({ count: 0, since, error: error.message });
  }
  return Response.json({ count: count ?? 0, since });
}
