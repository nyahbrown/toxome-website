"use client";

import { HeartFilled, HeartOutline } from "./icons";

type Props = {
  isWishlisted: boolean;
  onClick: () => void;
  stopPropagation?: boolean;
};

export default function WishlistHeart({
  isWishlisted,
  onClick,
  stopPropagation = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        onClick();
      }}
      aria-label={isWishlisted ? "Remove from saved" : "Save item"}
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        width: 28,
        height: 28,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isWishlisted ? "var(--ink)" : "rgba(255,255,255,0.96)",
        filter: isWishlisted
          ? "drop-shadow(0 1px 2px rgba(255,255,255,0.45))"
          : "drop-shadow(0 1px 3px rgba(59,60,58,0.45))",
        zIndex: 2,
      }}
    >
      <span style={{ transform: "scale(1.5)", display: "inline-flex" }}>
        {isWishlisted ? <HeartFilled /> : <HeartOutline />}
      </span>
    </button>
  );
}
