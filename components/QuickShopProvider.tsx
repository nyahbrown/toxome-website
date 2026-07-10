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

export function QuickShopProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const open = useCallback((p: Product) => setProduct(p), []);
  const close = useCallback(() => setProduct(null), []);

  return (
    <QuickShopContext.Provider value={{ open }}>
      {children}
      <QuickShopSheet product={product} onClose={close} />
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
