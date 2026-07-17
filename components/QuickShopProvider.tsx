"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Product } from "@/types/product";
import QuickShopSheet from "@/components/QuickShopSheet";

// Reusable Quick Shop host. Wrap any product grid in <QuickShopProvider> and its
// cards can call useQuickShop().open(product) to reveal a right-side quick-view
// sheet. Built standalone so it can later be enabled on /shop, but currently
// wired only into the Journal trend-edit grids (TrendEditSections).
type QuickShopContextValue = { open: (product: Product) => void };

const QuickShopContext = createContext<QuickShopContextValue | null>(null);

export function QuickShopProvider({
  children,
  outboundHrefs = {},
}: {
  children: ReactNode;
  // Buy hrefs keyed by product id, resolved by the SERVER component hosting this
  // provider (lib/affiliatePrograms.outboundHrefMap). Passed down rather than
  // computed here because the sheet is a client component and cannot read
  // brand_affiliate_programs — and guessing wrong silently costs the commission.
  // Missing key falls back to a direct merchant link, which is the safe default:
  // Skimlinks still earns on it.
  outboundHrefs?: Record<string, string | null>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const open = useCallback((p: Product) => setProduct(p), []);
  const close = useCallback(() => setProduct(null), []);

  return (
    <QuickShopContext.Provider value={{ open }}>
      {children}
      <QuickShopSheet
        product={product}
        onClose={close}
        outboundHref={product ? outboundHrefs[product.id] ?? null : null}
      />
    </QuickShopContext.Provider>
  );
}

export function useQuickShop(): QuickShopContextValue {
  const ctx = useContext(QuickShopContext);
  if (!ctx) {
    throw new Error("useQuickShop must be used within a QuickShopProvider");
  }
  return ctx;
}
