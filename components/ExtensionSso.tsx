"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Keeps the site and the Chrome extension signed in as the same person.
 *
 * The extension injects a content script on toxome.app that relays messages
 * between this page and its background worker (toxome-extension/src/web-sso.js).
 * This component is the page's half of that conversation. It renders nothing.
 *
 *   web → extension   hand over our tokens; the extension adopts them.
 *   extension → web   take the extension's ID token, trade it for a custom
 *                     token via the exchangeExtensionToken function, sign in.
 *
 * When the two sides disagree, whoever acted last wins: a `fresh` message means
 * the person just signed in or out on the extension, so we follow it. An
 * unmarked message is only a status report, so an existing web session stands.
 *
 * With no extension installed nothing ever answers and this stays inert.
 */

const WEB = "toxome-web";
const EXT = "toxome-ext";

type ExtState =
  | { signedIn: true; uid: string; idToken: string; fresh: boolean; seq: number }
  | { signedIn: false; fresh: boolean; seq: number };

function post(message: Record<string, unknown>) {
  try {
    window.postMessage({ source: WEB, ...message }, window.location.origin);
  } catch {
    // no extension listening, or a hostile CSP — nothing to do either way
  }
}

// Trade the extension's ID token for a session this page can hold. The Web SDK
// won't install raw tokens, but it will sign in with a custom token.
async function adoptExtensionSession(idToken: string) {
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const fn = httpsCallable<{ idToken: string }, { customToken: string }>(
    getFunctions(auth.app, "us-central1"),
    "exchangeExtensionToken",
  );
  const { data } = await fn({ idToken });
  if (!data?.customToken) throw new Error("No token returned");
  await signInWithCustomToken(auth, data.customToken);
}

export default function ExtensionSso() {
  const { user, loading } = useAuth();
  const [ext, setExt] = useState<ExtState | null>(null);

  // The uid we last handed to the extension, so we don't push the same session
  // over and over on every re-render.
  const pushedUid = useRef<string | null>(null);
  // Guards against running two exchanges at once, and against retrying an ID
  // token the function already rejected.
  const exchanging = useRef(false);
  const rejectedToken = useRef<string | null>(null);
  // Whether a real session has existed on this page yet, so we can tell a
  // genuine sign-out from the signed-out moment before Firebase restores one.
  const hadSession = useRef(false);
  // The uid the page just signed out of. The extension keeps reporting that
  // session until it processes the sign-out, and adopting it in the meantime
  // would sign the person straight back in.
  const signedOutUid = useRef<string | null>(null);

  // ── listen ────────────────────────────────────────────────────────────────
  // Only records what the extension reports. Nothing is acted on here, because
  // Firebase may not have restored this page's own session yet; reconciling
  // happens in the effect below, once we know both sides.
  useEffect(() => {
    let seq = 0;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      const d = event.data;
      if (!d || d.source !== EXT || !d.type) return;

      seq += 1;
      if (d.type === "EXT_HELLO") {
        post({ type: "WEB_READY" });
      } else if (d.type === "EXT_SIGNED_IN" && d.idToken && d.uid) {
        setExt({ signedIn: true, uid: d.uid, idToken: d.idToken, fresh: !!d.fresh, seq });
      } else if (d.type === "EXT_SIGNED_OUT") {
        setExt({ signedIn: false, fresh: !!d.fresh, seq });
      }
    };

    window.addEventListener("message", onMessage);
    // Announce ourselves — the content script may have loaded before React did,
    // in which case its own opening message went out before we were listening.
    post({ type: "WEB_READY" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // ── reconcile ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !ext) return; // wait until both sides are known
    let cancelled = false;

    (async () => {
      if (user) {
        hadSession.current = true;
        signedOutUid.current = null;
      }

      // 1. The page signed out for real. Tell the extension to drop its session
      //    too, and remember whose it was: until the extension confirms, it's
      //    still reporting that session, and adopting it here would undo the
      //    sign-out the person just asked for.
      if (!user && hadSession.current) {
        hadSession.current = false;
        signedOutUid.current = pushedUid.current ?? (ext.signedIn ? ext.uid : null);
        pushedUid.current = null;
        post({ type: "WEB_SIGNED_OUT" });
        return;
      }

      // 2. The extension was signed out on purpose. Follow it.
      if (!ext.signedIn) {
        if (ext.fresh && user) await firebaseSignOut(auth);
        return;
      }

      // 3. The extension has a session the page doesn't share. A signed-in page
      //    only yields to a sign-in that just happened on the extension;
      //    otherwise the page is the newer truth and pushes its own session
      //    over at step 4.
      if (user?.uid !== ext.uid && (!user || ext.fresh)) {
        if (ext.fresh) signedOutUid.current = null; // a new sign-in overrides
        if (signedOutUid.current === ext.uid) return; // stale, mid sign-out
        if (exchanging.current || rejectedToken.current === ext.idToken) return;
        exchanging.current = true;
        try {
          await adoptExtensionSession(ext.idToken);
        } catch {
          // Expired token, revoked session, or the function is unreachable.
          // Don't retry this one; a newer token will arrive later.
          rejectedToken.current = ext.idToken;
        } finally {
          exchanging.current = false;
        }
        return;
      }

      // 4. The page holds the session the extension is missing. Hand it over.
      if (!user) return;
      if (pushedUid.current === user.uid) return;
      try {
        const { token, expirationTime } = await user.getIdTokenResult();
        if (cancelled) return;
        pushedUid.current = user.uid;
        post({
          type: "WEB_SIGNED_IN",
          session: {
            uid: user.uid,
            email: user.email ?? "",
            idToken: token,
            // A public field on the User object. The extension needs it to keep
            // the session alive on its own once we hand it over.
            refreshToken: user.refreshToken,
            expiresAt: Date.parse(expirationTime) || 0,
          },
        });
      } catch {
        // Couldn't mint a token; the next auth change or page load retries.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ext, user, loading]);

  return null;
}
