import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { Product } from "@/types/product";

export interface WishlistItem {
  productId: string;
  addedAt: unknown;
  item_name: string;
  brand: string;
  item_price: number | null;
  item_image: string | null;
  affiliate_url: string | null;
  item_url: string | null;
  brand_verified: boolean;
}

export async function addToWishlist(uid: string, product: Product) {
  const ref = doc(db, "users", uid, "wishlist", product.id);
  await setDoc(ref, {
    productId: product.id,
    addedAt: serverTimestamp(),
    item_name: product.item_name,
    brand: product.brand,
    item_price: product.item_price,
    item_image: product.item_image,
    affiliate_url: product.affiliate_url,
    item_url: product.item_url,
    brand_verified: product.brand_verified,
  });
}

export async function removeFromWishlist(uid: string, productId: string) {
  await deleteDoc(doc(db, "users", uid, "wishlist", productId));
}

export async function getWishlist(uid: string): Promise<WishlistItem[]> {
  const snap = await getDocs(collection(db, "users", uid, "wishlist"));
  return snap.docs.map((d) => d.data() as WishlistItem);
}
