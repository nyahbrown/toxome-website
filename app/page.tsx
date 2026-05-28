import HomeClient from "./HomeClient";
import { getShopTaxonomy } from "@/lib/supabase";

export default async function Home() {
  const taxonomy = await getShopTaxonomy();
  return <HomeClient taxonomy={taxonomy} />;
}
