import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { Product } from "@/types/product";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  subscriptionStatus: "free" | "trial" | "monthly" | "annual";
  scanCount: number;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      // Web-only signup with no iOS-side users/{uid} doc yet.
      return null;
    }
    const d = snap.data() as Record<string, unknown>;
    const status =
      (d.subscriptionStatus as UserProfile["subscriptionStatus"]) || "free";
    return {
      uid,
      email: (d.email as string) || null,
      displayName: (d.displayName as string) || null,
      photoUrl: (d.photo_url as string) || null,
      isPremium:
        d.isPremium === true ||
        // The RevenueCat webhook writes snake_case `is_premium` (this is what
        // a web/app purchase sets). Read both so web purchases reflect here.
        d.is_premium === true ||
        status === "monthly" ||
        status === "annual" ||
        status === "trial",
      subscriptionStatus: status,
      scanCount: Number(d.scanCount ?? 0),
    };
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
}

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
