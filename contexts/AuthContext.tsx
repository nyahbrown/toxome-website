"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { track } from "@/lib/track";
import type { Product } from "@/types/product";
import type { WishlistItem } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  wishlist: Set<string>;
  wishlistItems: WishlistItem[];
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setWishlist(new Set());
        setWishlistItems([]);
      }
    });
    return unsubAuth;
  }, []);

  // Real-time wishlist listener
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "wishlist");
    const unsubSnap = onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => d.data() as WishlistItem);
      setWishlistItems(items);
      setWishlist(new Set(items.map((i) => i.productId)));
    });
    return unsubSnap;
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithApple = useCallback(async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "wishlist", product.id);
    if (wishlist.has(product.id)) {
      await deleteDoc(ref);
    } else {
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
      // Track the like (adds only, not removals) so the dashboard sees what
      // people bookmark. Centralized here so every surface — product page and
      // grid cards — is covered in one place.
      track("item_liked", {
        brand: product.brand,
        productId: product.id,
        productName: product.item_name,
        category: product.category,
        scoreAtTime: product.toxome_score,
        userId: user.uid,
      });
    }
  }, [user, wishlist]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        wishlist,
        wishlistItems,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOut,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
