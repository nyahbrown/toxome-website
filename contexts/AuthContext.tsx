"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signOut as firebaseSignOut,
  User,
  AuthError,
  AuthCredential,
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

// Thrown when a social sign-in (Google/Apple) uses an email that already
// belongs to an account created with a different method. The UI catches this
// to prompt the user to link instead of showing a raw error.
export class AccountLinkRequiredError extends Error {
  email: string;
  methods: string[];
  constructor(email: string, methods: string[]) {
    super("ACCOUNT_LINK_REQUIRED");
    this.name = "AccountLinkRequiredError";
    this.email = email;
    this.methods = methods;
  }
}

// Details of an in-progress link the UI needs to complete.
export interface PendingLink {
  email: string;
  methods: string[];
}

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
  // Account-linking: set when a social sign-in collides with an existing
  // account using another method. The UI shows a prompt and calls
  // completePendingLink to finish, or clearPendingLink to abandon.
  pendingLink: PendingLink | null;
  completePendingLink: (password?: string) => Promise<void>;
  clearPendingLink: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  // The credential from the social provider that was blocked — held until the
  // user proves ownership of the existing account, then linked onto it.
  const pendingCredRef = useRef<AuthCredential | null>(null);

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

  // Runs a social sign-in. If the email already belongs to an account created
  // with a different method, Firebase blocks it; we stash the blocked
  // credential and surface AccountLinkRequiredError so the UI can ask the user
  // to link rather than dead-ending on a raw error.
  const runOAuthSignIn = useCallback(
    async (
      provider: GoogleAuthProvider | OAuthProvider,
      credentialFromError: (e: AuthError) => AuthCredential | null,
    ) => {
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const err = e as AuthError;
        if (err.code === "auth/account-exists-with-different-credential") {
          const pendingCred = credentialFromError(err);
          const email = (err.customData?.email as string) ?? "";
          let methods: string[] = [];
          if (email) {
            try {
              methods = await fetchSignInMethodsForEmail(auth, email);
            } catch {
              methods = [];
            }
          }
          pendingCredRef.current = pendingCred;
          setPendingLink({ email, methods });
          throw new AccountLinkRequiredError(email, methods);
        }
        throw e;
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await runOAuthSignIn(provider, (e) =>
      GoogleAuthProvider.credentialFromError(e),
    );
  }, [runOAuthSignIn]);

  const signInWithApple = useCallback(async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await runOAuthSignIn(provider, (e) => OAuthProvider.credentialFromError(e));
  }, [runOAuthSignIn]);

  // Finishes a pending link: sign into the existing account (password by
  // default, or the existing OAuth provider), then attach the blocked
  // credential so both methods open the same account going forward.
  const completePendingLink = useCallback(
    async (password?: string) => {
      const cred = pendingCredRef.current;
      const link = pendingLink;
      if (!cred || !link) throw new Error("No account to connect.");

      let signedIn;
      if (password) {
        signedIn = await signInWithEmailAndPassword(auth, link.email, password);
      } else if (link.methods.includes("google.com")) {
        signedIn = await signInWithPopup(auth, new GoogleAuthProvider());
      } else if (link.methods.includes("apple.com")) {
        const p = new OAuthProvider("apple.com");
        p.addScope("email");
        p.addScope("name");
        signedIn = await signInWithPopup(auth, p);
      } else {
        throw new Error("Enter your password to continue.");
      }

      await linkWithCredential(signedIn.user, cred);
      pendingCredRef.current = null;
      setPendingLink(null);
    },
    [pendingLink],
  );

  const clearPendingLink = useCallback(() => {
    pendingCredRef.current = null;
    setPendingLink(null);
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
        pendingLink,
        completePendingLink,
        clearPendingLink,
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
