// Dummy account data for the `?dev=1` preview of the account dashboard, the
// past-scans page, and the saved-items page. Lets every panel render fully
// populated without a signed-in user or an App Store subscription. Not used in
// production paths.
import type { WishlistItem } from "@/lib/firestore";
import type { ClosetScan } from "@/lib/closet";

// 20 saved items, clean-fiber pieces from real brands in the catalog's voice.
export const DEV_WISHLIST: WishlistItem[] = (
  [
    { name: "Erma Drop Waist Linen Dress", brand: "Boden", price: 260 },
    { name: "Mai Cashmere Hoodie Pullover", brand: "Naked Cashmere", price: 350 },
    { name: "Niko Scoop Tank", brand: "Leset", price: 160 },
    { name: "The Bateau: White Pointelle", brand: "Cou Cou", price: 85 },
    { name: "Organic Cotton Crew Tee", brand: "Everlane", price: 35 },
    { name: "Silk Slip Skirt", brand: "Quince", price: 70 },
    { name: "Linen Wide-Leg Pant", brand: "Jenni Kayne", price: 245 },
    { name: "Merino Crewneck", brand: "Babaà", price: 290 },
    { name: "Hemp Canvas Tote", brand: "Outerknown", price: 98 },
    { name: "Tencel Shirt Dress", brand: "Christy Dawn", price: 218 },
    { name: "Wool Felt Clog", brand: "Nisolo", price: 145 },
    { name: "Cotton Poplin Blouse", brand: "Two Days Off", price: 175 },
    { name: "Alpaca Knit Cardigan", brand: "Harvest & Mill", price: 320 },
    { name: "Organic Denim Jean", brand: "DL1961", price: 198 },
    { name: "Ribbed Bralette", brand: "Pact", price: 28 },
    { name: "Silk Charmeuse Cami", brand: "Lunya", price: 128 },
    { name: "Linen Boxer Short", brand: "Subset", price: 42 },
    { name: "Cashmere Beanie", brand: "Quince", price: 50 },
    { name: "Cotton Gauze Robe", brand: "Coyuchi", price: 168 },
    { name: "Wool Trouser", brand: "Sézane", price: 230 },
  ] as const
).map((it, i) => ({
  productId: `dev-wish-${i + 1}`,
  addedAt: null,
  item_name: it.name,
  brand: it.brand,
  item_price: it.price,
  item_image: `https://picsum.photos/seed/wish${i + 1}/300/375`,
  affiliate_url: null,
  item_url: null,
  brand_verified: i % 3 === 0,
}));

// 30 closet scans, cycles a set of base items, each with a unique image+date.
export const DEV_SCANS: ClosetScan[] = (() => {
  const today = Date.now();
  const d = (daysAgo: number) => new Date(today - daysAgo * 86_400_000);
  const fakes: Array<Omit<ClosetScan, "id" | "scanImageUrl" | "scanDate">> = [
    { itemDescription: "Linen midi dress", brandName: "Reformation", category: "Dresses", overallHazardScore: 14, overallHazardLevel: "low", naturalFiberPercentage: 100, composition: [{ fiber: "linen", percentage: 100 }] },
    { itemDescription: "Cotton tee", brandName: "Everlane", category: "Tops", overallHazardScore: 22, overallHazardLevel: "low", naturalFiberPercentage: 100, composition: [{ fiber: "organic_cotton", percentage: 100 }] },
    { itemDescription: "Workout legging", brandName: "Lululemon", category: "Activewear", overallHazardScore: 62, overallHazardLevel: "moderate", naturalFiberPercentage: 0, composition: [{ fiber: "nylon", percentage: 73 }, { fiber: "elastane", percentage: 27 }] },
    { itemDescription: "Wool blend coat", brandName: "Aritzia", category: "Outerwear", overallHazardScore: 28, overallHazardLevel: "low", naturalFiberPercentage: 88, composition: [{ fiber: "wool", percentage: 88 }, { fiber: "polyester", percentage: 12 }] },
    { itemDescription: "Polyester blouse", brandName: "Zara", category: "Tops", overallHazardScore: 78, overallHazardLevel: "high", naturalFiberPercentage: 5, composition: [{ fiber: "polyester", percentage: 95 }, { fiber: "elastane", percentage: 5 }] },
    { itemDescription: "Denim jeans", brandName: "Levi's", category: "Bottoms", overallHazardScore: 24, overallHazardLevel: "low", naturalFiberPercentage: 98, composition: [{ fiber: "cotton", percentage: 98 }, { fiber: "elastane", percentage: 2 }] },
    { itemDescription: "Silk pajama set", brandName: "Printfresh", category: "Pajamas", overallHazardScore: 16, overallHazardLevel: "low", naturalFiberPercentage: 100, composition: [{ fiber: "silk", percentage: 100 }] },
    { itemDescription: "Sports bra", brandName: "Nike", category: "Activewear", overallHazardScore: 72, overallHazardLevel: "high", naturalFiberPercentage: 0, composition: [{ fiber: "polyester", percentage: 82 }, { fiber: "elastane", percentage: 18 }] },
    { itemDescription: "Hemp tee", brandName: "Outerknown", category: "Tops", overallHazardScore: 10, overallHazardLevel: "low", naturalFiberPercentage: 100, composition: [{ fiber: "hemp", percentage: 55 }, { fiber: "cotton", percentage: 45 }] },
    { itemDescription: "Cashmere sweater", brandName: "Quince", category: "Sweaters", overallHazardScore: 15, overallHazardLevel: "low", naturalFiberPercentage: 100, composition: [{ fiber: "wool", percentage: 100 }] },
    { itemDescription: "Fleece pullover", brandName: "Patagonia", category: "Outerwear", overallHazardScore: 55, overallHazardLevel: "moderate", naturalFiberPercentage: 0, composition: [{ fiber: "recycled_polyester", percentage: 100 }] },
    { itemDescription: "Underwear set", brandName: "Pact", category: "Undergarments", overallHazardScore: 20, overallHazardLevel: "low", naturalFiberPercentage: 95, composition: [{ fiber: "organic_cotton", percentage: 95 }, { fiber: "elastane", percentage: 5 }] },
  ];
  return Array.from({ length: 30 }, (_, i) => {
    const f = fakes[i % fakes.length];
    return {
      ...f,
      id: `dev-${i + 1}`,
      scanImageUrl: `https://picsum.photos/seed/scan${i + 1}/300/300`,
      scanDate: d(i + 1),
    };
  });
})();
