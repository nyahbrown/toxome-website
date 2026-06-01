"use client";
import { useState } from "react";

type Level = "Low" | "Moderate" | "High";
type Impact = { key: string; label: string; level: Level; detail: string };
type Fiber = { id: string; name: string; formula: string; priority: Level; priorityColor: string; summary: string; impacts: Impact[] };

const GOOD_HIGH = new Set(["breath", "biod"]);

function semanticColor(key: string, level: Level): string {
  if (level === "Moderate") return "#E6A638";
  const goodIsHigh = GOOD_HIGH.has(key);
  if (goodIsHigh) return level === "High" ? "#7B9B69" : "#C84242";
  return level === "Low" ? "#7B9B69" : level === "High" ? "#C84242" : "#E6A638";
}

const FIBERS: Fiber[] = [
  {
    id: "cotton", name: "Cotton", formula: "100% Cotton", priority: "Moderate", priorityColor: "#E6A638",
    summary: "A natural fiber. Comfortable and breathable, but conventional cotton is one of the most pesticide-intensive crops on earth.",
    impacts: [
      { key: "endocrine", label: "Endocrine disruption", level: "Low", detail: "Cotton fiber itself is inert. Residues from finishing dyes and pesticide regulation vary by certification." },
      { key: "micro", label: "Microplastic shedding", level: "Low", detail: "Cellulose-based. Sheds fibers that biodegrade in soil and water within months." },
      { key: "breath", label: "Breathability", level: "High", detail: "Moisture-absorbent and air-permeable. Regulates body temperature naturally." },
      { key: "skin", label: "Skin irritation", level: "Low", detail: "Hypoallergenic for most. Watch for formaldehyde finishes in non-iron treatments." },
      { key: "biod", label: "Biodegradability", level: "High", detail: "Fully compostable when untreated and undyed. Returns to soil in 1–5 months." },
      { key: "climate", label: "Climate impact", level: "Moderate", detail: "Water-intensive. Organic & rain-fed varieties cut footprint by ~45%." },
    ],
  },
  {
    id: "polyester", name: "Polyester", formula: "100% Polyester (PET)", priority: "High", priorityColor: "#C84242",
    summary: "Plastic, spun. Polyester is petroleum-derived PET — durable and cheap, but it never stops shedding microfibers.",
    impacts: [
      { key: "endocrine", label: "Endocrine disruption", level: "Moderate", detail: "Antimony catalysts and finishing PFAS can leach with heat and sweat." },
      { key: "micro", label: "Microplastic shedding", level: "High", detail: "A single load can release 700,000+ microfibers into wastewater." },
      { key: "breath", label: "Breathability", level: "Low", detail: "Non-absorbent. Traps heat and moisture against skin." },
      { key: "skin", label: "Skin irritation", level: "Moderate", detail: "Higher rates of contact dermatitis vs. natural fibers, especially with dye sensitivities." },
      { key: "biod", label: "Biodegradability", level: "Low", detail: "Persists for 200+ years. Recycling extends but does not solve the lifecycle." },
      { key: "climate", label: "Climate impact", level: "High", detail: "Crude-oil feedstock. ~125M tons CO₂e from polyester garments annually." },
    ],
  },
  {
    id: "wool", name: "Wool", formula: "100% Merino Wool", priority: "Low", priorityColor: "#7B9B69",
    summary: "100% protein-based. Wool is naturally temperature-regulating, flame-resistant, and biodegrades like fallen leaves.",
    impacts: [
      { key: "endocrine", label: "Endocrine disruption", level: "Low", detail: "Untreated wool is inert. Watch for mothproofing pesticides on cheaper grades." },
      { key: "micro", label: "Microplastic shedding", level: "Low", detail: "Sheds keratin protein fibers, not plastic. Biodegrades in months." },
      { key: "breath", label: "Breathability", level: "High", detail: "Absorbs 30% of its weight in moisture before feeling wet. Regulates temperature both ways." },
      { key: "skin", label: "Skin irritation", level: "Low", detail: "Fine merino (<19μm) is non-prickly. Coarser wools may irritate sensitive skin." },
      { key: "biod", label: "Biodegradability", level: "High", detail: "Fully compostable. Releases nitrogen back into soil within 6 months." },
      { key: "climate", label: "Climate impact", level: "Moderate", detail: "Methane emissions from sheep are real; offset by long garment lifespan and natural end-of-life." },
    ],
  },
];

function ImpactCard({ impact, hovered, onEnter, onLeave }: { impact: Impact; hovered: boolean; onEnter: () => void; onLeave: () => void }) {
  const color = semanticColor(impact.key, impact.level);
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: "20px 22px", borderRadius: 16,
        background: hovered ? "var(--bg)" : "transparent",
        border: "1px solid " + (hovered ? "transparent" : "var(--hairline)"),
        boxShadow: hovered ? "0 0 0 1px var(--hairline-strong) inset, 0 6px 22px rgba(59,60,58,.06)" : "none",
        transition: "all 220ms var(--ease)", cursor: "default",
        display: "flex", flexDirection: "column", gap: 8, minHeight: 116,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{impact.label}</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px 4px", borderRadius: 999,
          fontSize: 11, fontWeight: 600, color,
          background: color + "18", flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
          {impact.level}
        </span>
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)",
        opacity: hovered ? 1 : 0.7, transition: "opacity 220ms var(--ease)",
      }}>
        {impact.detail}
      </div>
    </div>
  );
}

export default function ScanPreview() {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const fiber = FIBERS[selected];

  return (
    <section style={{ padding: "120px 0", background: "var(--bg-2)" }}>
      <div className="shell">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "flex-start", marginBottom: 56 }}>
          <div>
            <div className="eyebrow reveal">Sample result · scrub fibers below</div>
            <h2 className="reveal" style={{
              fontFamily: "var(--sans)", fontWeight: 600,
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.02, letterSpacing: "-0.04em", margin: "20px 0 0",
            } as React.CSSProperties}>
              The same shirt,{" "}
              <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>three different fibers.</em>
            </h2>
          </div>
          <p className="reveal" style={{ fontSize: 17, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, paddingTop: 36 }}>
            What feels identical on the hanger reads very differently to your endocrine system.
            Toxome surfaces the six axes that matter — and ranks them.
          </p>
        </div>

        {/* Fiber selector */}
        <div className="reveal" style={{
          display: "flex", gap: 8, padding: 6,
          background: "rgba(59,60,58,0.04)", borderRadius: 14, marginBottom: 28, maxWidth: 460,
        }}>
          {FIBERS.map((f, i) => (
            <button key={f.id} onClick={() => setSelected(i)} style={{
              flex: 1, padding: "11px 18px", borderRadius: 10,
              background: selected === i ? "var(--bg)" : "transparent",
              color: selected === i ? "var(--ink)" : "var(--ink-2)",
              fontSize: 14, fontWeight: 500, border: 0,
              boxShadow: selected === i ? "0 1px 3px rgba(59,60,58,.08), 0 0 0 1px var(--hairline)" : "none",
              transition: "all 220ms var(--ease)", cursor: "pointer", letterSpacing: "-0.005em",
            }}>
              {f.name}
            </button>
          ))}
        </div>

        {/* Scan card */}
        <div className="reveal" style={{
          background: "var(--bg)", borderRadius: 24, padding: "40px 44px 44px",
          boxShadow: "0 0 0 1px var(--hairline) inset, 0 18px 60px rgba(59,60,58,.05)",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40,
            paddingBottom: 32, marginBottom: 32,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Composition breakdown</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 30, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)", marginBottom: 14 }}>
                {fiber.name}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 18 }}>
                {fiber.formula}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink-2)", maxWidth: 420 }}>
                {fiber.summary}
              </div>
            </div>
            <div style={{ textAlign: "right", paddingTop: 4 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Detox priority</div>
              <div style={{
                fontFamily: "var(--sans)", fontSize: 35, lineHeight: 0.95, letterSpacing: "-0.04em",
                color: fiber.priorityColor, transition: "color 320ms var(--ease)",
              }}>
                {fiber.priority}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>weighted across six axes</div>
            </div>
          </div>

          {/* Impact grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {fiber.impacts.map((impact) => (
              <ImpactCard
                key={impact.key}
                impact={impact}
                hovered={hovered === impact.key}
                onEnter={() => setHovered(impact.key)}
                onLeave={() => setHovered(null)}
              />
            ))}
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 28, paddingTop: 24,
            fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)",
            letterSpacing: ".06em", textTransform: "uppercase",
          }}>
            <span>Hover any card for the why</span>
            <span>Saved to closet · 00:01.8</span>
          </div>
        </div>
      </div>
    </section>
  );
}
