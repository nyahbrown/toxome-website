import { getPublishedProducts } from "@/lib/supabase";
import HomeClient from "./HomeClient";

export const revalidate = 3600;

export default async function Home() {
  const products = await getPublishedProducts();
  return <HomeClient products={products} />;
}
