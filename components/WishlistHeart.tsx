"use client";

import { useState } from "react";
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
  const [hovered, setHovered] = useState(false);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        transform: hovered ? "scale(1.18)" : "scale(1)",
        transition:
          "transform 220ms cubic-bezier(.22,.61,.36,1), color 180ms ease",
        zIndex: 2,
      }}
    >
      {isWishlisted ? <HeartFilled /> : <HeartOutline />}
    </button>
  );
}
