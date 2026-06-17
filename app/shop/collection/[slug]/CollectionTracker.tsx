"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Fires a first-party `collection_view` event on mount so we can measure which
// programmatic collection pages actually draw traffic (and how many items they
// surfaced). Consent-gated and localhost-skipped inside track(). Renders nothing.
export default function CollectionTracker({
  slug,
  itemCount,
}: {
  slug: string;
  itemCount: number;
}) {
  useEffect(() => {
    track("collection_view", { category: slug, metadata: { itemCount } });
  }, [slug, itemCount]);
  return null;
}
