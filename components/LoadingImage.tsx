"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

// next/image with a loading animation: a shimmer skeleton holds the space, then
// the image blur-ups and crossfades in once its bytes land. Purpose is to mask
// the jarring pop of a large asset arriving (a valid reason to animate per the
// framework), not decoration. GPU-only (opacity + filter), and reduced-motion
// drops the shimmer and blur travel (see .limg rules in globals.css).
type Props = ImageProps & {
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

export default function LoadingImage({
  wrapperClassName,
  wrapperStyle,
  onLoad,
  ...imageProps
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // A cached image can already be complete before hydration, so its onLoad
    // never fires and the skeleton would stick forever. Resolve it up front.
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <span
      className={`limg${loaded ? " limg--in" : ""}${
        wrapperClassName ? ` ${wrapperClassName}` : ""
      }`}
      style={wrapperStyle}
    >
      <span className="limg__skel" aria-hidden="true" />
      <Image
        ref={ref}
        // alt="" is overridden by imageProps.alt (spread below); it exists only
        // so jsx-a11y sees a literal alt, since it can't trace the spread.
        alt=""
        {...imageProps}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    </span>
  );
}
