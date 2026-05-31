import { Fragment } from "react";

/**
 * Renders text that uses *asterisks* for emphasis as <em> spans. The research
 * copy in lib/fiberGuide.ts follows the brand voice rule of italics-for-emphasis
 * (never bold), written with markdown-style single asterisks. This is a pure,
 * server-renderable helper. No markdown library needed for a single pattern.
 */
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
