import HomeClient from "./HomeClient";
import { getShopTaxonomy, getPublishedProducts } from "@/lib/supabase";
import { getAllArticles } from "@/lib/journal";

export default async function Home() {
  const [taxonomy, products] = await Promise.all([
    getShopTaxonomy(),
    getPublishedProducts(),
  ]);

  // The Clean Edit: the cleanest pieces that have a usable image. Lower Toxome
  // Score = cleaner, so ascending surfaces the ones that "earned their place".
  const cleanEdit = products
    .filter((p) => p.item_image)
    .sort((a, b) => (a.toxome_score ?? 999) - (b.toxome_score ?? 999))
    .slice(0, 4);

  // Three most recent Journal pieces for the homepage reading-room block.
  const articles = getAllArticles().slice(0, 3);

  return (
    <HomeClient taxonomy={taxonomy} articles={articles} products={cleanEdit} />
  );
}
