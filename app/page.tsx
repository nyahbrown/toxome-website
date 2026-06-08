import HomeClient from "./HomeClient";
import { getShopTaxonomy, getPublishedProducts } from "@/lib/supabase";
import { getAllArticles } from "@/lib/journal";
import { EDITORS_PICKS } from "@/lib/editorsPicks";

export default async function Home() {
  const [taxonomy, products] = await Promise.all([
    getShopTaxonomy(),
    getPublishedProducts(),
  ]);

  // Editor's Picks, hand-selected, featured in this exact order (lib/editorsPicks).
  const editorsPicks = EDITORS_PICKS.map((name) =>
    products.find((p) => p.item_name === name)
  ).filter((p): p is (typeof products)[number] => Boolean(p));

  // Three most recent Journal pieces for the homepage reading-room block.
  const articles = getAllArticles().slice(0, 3);

  return (
    <HomeClient taxonomy={taxonomy} articles={articles} products={editorsPicks} />
  );
}
