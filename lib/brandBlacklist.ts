// Brands Toxome will never list. Single source of truth shared by the discovery
// agent (scripts/agent.js) and the admin "add by URL" feature. Edit the JSON.
import brands from "./brandBlacklist.json";

export const BRAND_BLACKLIST: string[] = brands;

export function isBlacklisted(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const b = brand.toLowerCase().trim();
  return BRAND_BLACKLIST.some((x) => b.includes(x.toLowerCase().trim()));
}
