"use client";

import { useEffect, useState } from "react";

type ShareBarProps = {
  /** Absolute canonical URL of the article. */
  url: string;
  title: string;
  description?: string;
  /** Absolute image URL used as the Pinterest pin media. */
  image?: string;
};

function openPopup(href: string) {
  // Centered popup on desktop; falls back to a normal tab on mobile.
  window.open(href, "_blank", "noopener,noreferrer,width=640,height=640");
}

export default function ShareBar({ url, title, description, image }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const enc = encodeURIComponent;
  const shareText = description || title;

  const pinterest = `https://www.pinterest.com/pin/create/button/?url=${enc(
    url
  )}&description=${enc(`${title}: ${shareText}`)}${image ? `&media=${enc(image)}` : ""}`;
  const twitter = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
  const email = `mailto:?subject=${enc(title)}&body=${enc(`${shareText}\n\n${url}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context), open the email fallback.
      window.location.href = email;
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      /* user dismissed, no-op */
    }
  }

  return (
    <div className="share-bar" role="group" aria-label="Share this article">
      <span className="share-bar__label">Share</span>

      {canNativeShare && (
        <button type="button" className="share-btn" onClick={nativeShare} aria-label="Share">
          <ShareIcon />
        </button>
      )}

      <button
        type="button"
        className="share-btn"
        onClick={() => openPopup(pinterest)}
        aria-label="Save to Pinterest"
      >
        <PinterestIcon />
      </button>

      <button
        type="button"
        className="share-btn"
        onClick={() => openPopup(twitter)}
        aria-label="Share on X"
      >
        <XIcon />
      </button>

      <button
        type="button"
        className="share-btn"
        onClick={() => openPopup(facebook)}
        aria-label="Share on Facebook"
      >
        <FacebookIcon />
      </button>

      <a className="share-btn" href={email} aria-label="Share by email">
        <MailIcon />
      </a>

      <button
        type="button"
        className="share-btn"
        onClick={copyLink}
        aria-label="Copy link"
      >
        <LinkIcon />
      </button>

      {copied && (
        <span className="share-btn__copied" role="status">
          Link copied
        </span>
      )}
    </div>
  );
}

/* ── Icons (currentColor) ─────────────────────────────────────────────── */

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44.22-.93 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.18-2.92 1.03 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.18 1.79 2.18 2.15 0 3.8-2.27 3.8-5.54 0-2.9-2.08-4.92-5.05-4.92-3.44 0-5.46 2.58-5.46 5.25 0 1.04.4 2.16.9 2.76.1.12.11.23.08.35l-.33 1.36c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.4 2.96 7.4 6.92 0 4.13-2.61 7.46-6.23 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.97 6.817H1.683l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7.5l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 13.5l5-5M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
