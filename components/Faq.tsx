"use client";
import { useState } from "react";

const FAQ_ITEMS = [
  { q: "How is Toxome different from a sustainability rating site?", a: "Sustainability ratings score brands. Toxome scores the actual garment in your hand, by reading its composition tag. Two shirts from the same 'ethical' brand can have wildly different fiber profiles. We measure what you'll be wearing, not what the company says it stands for." },
  { q: "Where does the scoring data come from?", a: "Peer-reviewed material science and toxicology, plus published lifecycle assessments. Each fiber has a source-linked dossier inside the app. We don't accept payment from brands to influence scores. Ever." },
  { q: "What if my tag is blurry or in another language?", a: "Toxome handles 28 languages and most degraded tags. If a tag is unreadable, you can search by brand and product name as a fallback. We're also working on care-symbol recognition for tags that have been worn off entirely." },
  { q: "Is my closet private?", a: "Yes. Scans live on-device by default. Optional iCloud sync is end-to-end encrypted. We never sell or share scan data, and you can wipe your closet at any time." },
  { q: "Is it free?", a: "Scanning is free, forever. The subscription ($2.99/mo or $14.99/yr, with a 14-day free trial) adds your full closet history, swap suggestions, and the article library. Cancel anytime." },
  { q: "When does Android land?", a: "iOS is live on the App Store today. Android is in active development. Drop your email below to get notified the day it ships." },
];

function FaqItem({ item, open, onToggle }: { item: { q: string; a: string }; open: boolean; onToggle: () => void }) {
  return (
    <div>
      <button onClick={onToggle} style={{
        width: "100%", padding: "28px 0",
        background: "transparent", border: 0,
        textAlign: "left", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        color: "var(--ink)",
      }}>
        <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em" }}>
          {item.q}
        </span>
        <span style={{
          width: 32, height: 32, borderRadius: 16, flexShrink: 0,
          background: open ? "var(--ink)" : "transparent",
          color: open ? "var(--bg-2)" : "var(--ink)",
          border: open ? "none" : "1px solid var(--hairline-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 220ms var(--ease)",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 220ms var(--ease)" }}>
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: "hidden",
        transition: "max-height 320ms var(--ease), padding 320ms var(--ease)",
        padding: open ? "0 0 28px" : "0",
      }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 680 }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" style={{ padding: "120px 0", background: "var(--bg-2)" }}>
      <div className="shell">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80, alignItems: "flex-start" }}>
          <div style={{ position: "sticky", top: 100 }}>
            <div className="eyebrow">FAQ</div>
            <h2 style={{
              fontFamily: "var(--sans)", fontWeight: 600,
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.02, letterSpacing: "-0.025em", margin: "20px 0 16px",
            } as React.CSSProperties}>
              Questions,{" "}
              <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>answered.</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink-3)", margin: 0 }}>
              Still curious? We answer everything in the app, with sources.
            </p>
          </div>
          <div>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
