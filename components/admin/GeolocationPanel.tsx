"use client";

import { useEffect, useMemo, useState } from "react";

// Where Toxome's people actually are, from two independent sources:
//
//   - Website visits  → Vercel Web Analytics (toxome-website, production)
//   - App profiles    → the Mixpanel user export
//
// Both are a snapshot written to /public/admin/geolocation.json, not a live
// query. Vercel's Web Analytics REST API is gated to Pro (Hobby 404s on it),
// and the Hobby plan only retains 31 days, so the two sources cover different
// windows on purpose — each panel states its own.
//
// To refresh: regenerate public/admin/geolocation.json and redeploy. Nothing
// in here needs to change as long as the shape holds.

type Point = {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  approx: boolean;
  i: number; // import-stamped
  r: number; // residual Encinitas
  c: number; // verified
};

type Named = { name: string; i: number; r: number; c: number };
type VCountry = { code: string; a3: string; views: number; visitors: number };
type VRow = { name: string; views: number; visitors: number };

type Bundle = {
  generatedAt: string;
  geometry: { world: string; countries: Record<string, string> };
  profiles: {
    meta: Record<string, number | string>;
    points: Point[];
    weekly: { week: string; import: number; residual: number; clean: number }[];
    countries: Named[];
    states: Named[];
  };
  vercel: {
    since: string;
    until: string;
    days: number;
    totals: { views: number; visitors: number; bounceRate: number; countries: number };
    countries: VCountry[];
    devices: VRow[];
    os: VRow[];
    referrers: VRow[];
    pages: { path: string; views: number; visitors: number }[];
    daily: { d: string; views: number; visitors: number }[];
  };
  gsc: {
    since: string;
    until: string;
    totals: { clicks: number; impr: number; countries: number; withClicks: number };
    daily: { d: string; clicks: number; impr: number }[];
    countries: { code: string; clicks: number; impr: number }[];
  };
};

const SANS = "var(--sans)";
const fmt = (n: number) => n.toLocaleString("en-US");

// Equirectangular, matching the baked path data (1000x500 viewBox).
const px = (lon: number) => ((lon + 180) / 360) * 1000;
const py = (lat: number) => ((90 - lat) / 180) * 500;
const WORLD_VB = "0 32 1000 384";
const US_VB = "148 104 175 86";

// Sequential ramp, light to dark, one hue the whole way. --blue and --ink-2 are
// both slate, so stepping from one into the other reads as a single scale that
// actually gets darker. Straight opacity on --blue alone tops out too pale to
// tell the top two buckets apart.
const RAMP: { token: string; opacity: number }[] = [
  { token: "var(--blue)", opacity: 0.3 },
  { token: "var(--blue)", opacity: 0.62 },
  { token: "var(--blue)", opacity: 1 },
  { token: "var(--ink-2)", opacity: 0.62 },
  { token: "var(--ink-2)", opacity: 0.92 },
];
const BINS = { visitors: [1, 5, 20, 60, 200], views: [1, 10, 40, 150, 500] };

function bucket(v: number, bins: number[]) {
  let i = -1;
  for (let k = 0; k < bins.length; k++) if (v >= bins[k]) i = k;
  return i;
}

/* ---------------------------------------------------------------- shared UI */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: ".13em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        margin: "0 0 8px",
      }}
    >
      {children}
    </h2>
  );
}

function Dek({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: 16,
        color: "var(--ink-2)",
        margin: "0 0 22px",
        maxWidth: "68ch",
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section style={{ marginBottom: 64 }}>{children}</section>;
}

function Card({ children, pad = 20 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 4,
        padding: pad,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: "var(--ink)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
        {note}
      </div>
    </Card>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              fontFamily: SANS,
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: `1px solid ${on ? "var(--ink)" : "var(--hairline-strong)"}`,
              background: on ? "var(--ink)" : "var(--white)",
              color: on ? "var(--white)" : "var(--ink-2)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function BarList({
  rows,
  max,
}: {
  rows: { label: string; bar: number; value: string }[];
  max: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(90px,190px) 1fr minmax(40px,auto)",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span
            title={r.label}
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: "var(--ink-2)",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.label}
          </span>
          <span style={{ height: 14, background: "var(--tan)", borderRadius: 2, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                height: "100%",
                width: `${(r.bar / max) * 100}%`,
                background: "var(--blue)",
              }}
            />
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
              textAlign: "right",
            }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto", border: "1px solid var(--hairline-strong)", borderRadius: 4 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420, fontFamily: SANS, fontSize: 13 }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--tan)",
                  color: "var(--ink-3)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".11em",
                  textTransform: "uppercase",
                  textAlign: i === 0 ? "left" : "right",
                  padding: "8px 14px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? "var(--cream)" : "var(--white)" }}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "7px 14px",
                    color: ci === 0 ? "var(--ink)" : "var(--ink-2)",
                    textAlign: ci === 0 ? "left" : "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tip({ text, x, y }: { text: string[]; x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%,-115%)",
        pointerEvents: "none",
        background: "var(--ink)",
        color: "var(--white)",
        borderRadius: 3,
        padding: "7px 10px",
        fontFamily: SANS,
        fontSize: 11.5,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        zIndex: 4,
      }}
    >
      {text.map((t, i) => (
        <div key={i} style={{ opacity: i ? 0.75 : 1 }}>
          {t}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- panel */

export default function GeolocationPanel() {
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"visitors" | "views">("visitors");
  const [cohort, setCohort] = useState<"organic" | "all" | "clean">("organic");
  const [scope, setScope] = useState<"world" | "us">("world");
  const [tip, setTip] = useState<{ text: string[]; x: number; y: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/admin/geolocation.json")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((j: Bundle) => alive && setData(j))
      .catch((e) => alive && setError(String(e.message || e)));
    return () => {
      alive = false;
    };
  }, []);

  const vByA3 = useMemo(() => {
    const m: Record<string, VCountry> = {};
    for (const c of data?.vercel.countries ?? []) if (c.a3) m[c.a3] = c;
    return m;
  }, [data]);

  if (error) {
    return (
      <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--ink-2)" }}>
        Couldn&rsquo;t load the geolocation snapshot ({error}). Check that
        /admin/geolocation.json deployed.
      </p>
    );
  }
  if (!data) {
    return <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--ink-3)" }}>Loading&hellip;</p>;
  }

  const V = data.vercel;
  const G = data.gsc;
  const P = data.profiles;

  /* ---- website visits: choropleth ---- */
  const bins = BINS[metric];
  const mappedTotal = V.countries.reduce((s, c) => s + c[metric], 0);
  const noShape = V.countries.filter((c) => !data.geometry.countries[c.a3]);
  const noShapeTotal = noShape.reduce((s, c) => s + c[metric], 0);

  /* ---- the spike ---- */
  const burst = V.daily.filter((d) => d.d >= "2026-07-20" && d.d <= "2026-07-26");
  const burstVisitors = burst.reduce((s, d) => s + d.visitors, 0);
  const rest = V.daily.filter((d) => !(d.d >= "2026-07-20" && d.d <= "2026-07-26"));
  const restMedian = [...rest.map((d) => d.visitors)].sort((a, b) => a - b)[Math.floor(rest.length / 2)];
  const gscWindow = G.daily.filter((d) => d.d >= V.since && d.d <= V.until);
  const gscClicks = gscWindow.reduce((s, d) => s + d.clicks, 0);
  const googleRef = V.referrers.find((r) => r.name === "google.com");
  const linux = V.os.find((o) => o.name === "GNU/Linux");

  /* ---- app profiles ---- */
  const keys = { all: ["i", "r", "c"], organic: ["r", "c"], clean: ["c"] } as const;
  const nOf = (o: Point | Named) =>
    keys[cohort].reduce((s, k) => s + ((o as unknown as Record<string, number>)[k] || 0), 0);
  const vb = scope === "world" ? WORLD_VB : US_VB;
  const k = scope === "world" ? 1 : 175 / 1000;
  const shownPoints = P.points.filter((p) => nOf(p) > 0);
  const profileTotal = shownPoints.reduce((s, p) => s + nOf(p), 0);
  const [vx, vy, vw, vh] = vb.split(" ").map(Number);
  const offFrame = shownPoints
    .filter((p) => {
      const x = px(p.lon);
      const y = py(p.lat);
      return x < vx || x > vx + vw || y < vy || y > vy + vh;
    })
    .reduce((s, p) => s + nOf(p), 0);

  const maxDaily = Math.max(...V.daily.map((d) => d.visitors));

  return (
    <div>
      {/* ===================== WEBSITE VISITS ===================== */}
      <Section>
        <Eyebrow>Website visits &middot; Vercel Web Analytics</Eyebrow>
        <H2>Where toxome.app traffic comes from</H2>
        <Dek>
          {V.days} days, {V.since} to {V.until}. {fmt(V.totals.views)} pageviews from{" "}
          {fmt(V.totals.visitors)} visitors across {V.totals.countries} countries, bounce rate{" "}
          {V.totals.bounceRate}%. Hobby only retains 31 days, so this window is shorter than the
          app-profile window below.
        </Dek>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
            marginBottom: 28,
          }}
        >
          <Stat label="Pageviews" value={fmt(V.totals.views)} note={`${V.days} days of production traffic`} />
          <Stat
            label="Visitors"
            value={fmt(V.totals.visitors)}
            note={`${Math.round((V.countries[0].visitors / V.totals.visitors) * 100)}% of them from the United States`}
          />
          <Stat label="Bounce rate" value={`${V.totals.bounceRate}%`} note="Sessions that viewed exactly one page" />
          <Stat
            label="Countries"
            value={fmt(V.totals.countries)}
            note={`${V.countries.filter((c) => c.visitors >= 5).length} of them sent 5 or more visitors`}
          />
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <Eyebrow>Shade by</Eyebrow>
            <Pills
              value={metric}
              onChange={setMetric}
              options={[
                { key: "visitors", label: "Visitors" },
                { key: "views", label: "Pageviews" },
              ]}
            />
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: "var(--ink-2)",
              fontVariantNumeric: "tabular-nums",
              paddingBottom: 7,
            }}
          >
            {fmt(mappedTotal)} {metric} mapped
          </div>
        </div>

        <div style={{ position: "relative", border: "1px solid var(--hairline-strong)", borderRadius: 4, overflow: "hidden", background: "var(--white)" }}>
          <svg
            viewBox={WORLD_VB}
            style={{ display: "block", width: "100%", height: "auto" }}
            role="img"
            aria-label="World map shaded by website visitors per country. The same numbers are in the table below."
          >
            {Object.entries(data.geometry.countries).map(([a3, d]) => {
              const row = vByA3[a3];
              const b = bucket(row ? row[metric] : 0, bins);
              return (
                <path
                  key={a3}
                  d={d}
                  fill={b < 0 ? "var(--tan)" : RAMP[b].token}
                  fillOpacity={b < 0 ? 1 : RAMP[b].opacity}
                  stroke="var(--hairline-strong)"
                  strokeWidth={0.35}
                  strokeLinejoin="round"
                  style={{ cursor: row ? "pointer" : "default" }}
                  onMouseEnter={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    const r = e.currentTarget.getBoundingClientRect();
                    setTip({
                      text: row
                        ? [row.code, `${fmt(row.visitors)} visitors`, `${fmt(row.views)} pageviews`]
                        : [a3, "no recorded visits"],
                      x: r.left - box.left + r.width / 2,
                      y: r.top - box.top,
                    });
                  }}
                  onMouseLeave={() => setTip(null)}
                />
              );
            })}
          </svg>
          {tip && <Tip {...tip} />}
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
              padding: "10px 14px",
              fontFamily: SANS,
              fontSize: 11.5,
              color: "var(--ink-2)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 11, height: 11, background: "var(--tan)", borderRadius: 2 }} /> none
            </span>
            <span style={{ display: "flex", alignItems: "center" }}>
              {RAMP.map((r, i) => (
                <span
                  key={i}
                  title={`${fmt(bins[i])} or more`}
                  style={{ width: 30, height: 11, background: r.token, opacity: r.opacity }}
                />
              ))}
              <span style={{ marginLeft: 9, color: "var(--ink-3)" }}>
                {fmt(bins[0])} to {fmt(bins[bins.length - 1])}+ {metric}
              </span>
            </span>
          </div>
        </div>

        {noShape.length > 0 && (
          <p style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--ink-3)", margin: "10px 0 0", lineHeight: 1.6 }}>
            {noShape.length} small territories have no outline at this map scale, so they aren&rsquo;t shaded:{" "}
            {fmt(noShapeTotal)} {metric}, {((noShapeTotal / mappedTotal) * 100).toFixed(1)}% of the total. All of
            them are in the table below.
          </p>
        )}

        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 32 }}>
          <div>
            <Eyebrow>Top countries by visitors</Eyebrow>
            <BarList
              max={V.countries[0].visitors}
              rows={[...V.countries]
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 12)
                .map((c) => ({ label: c.code, bar: c.visitors, value: fmt(c.visitors) }))}
            />
          </div>
          <div>
            <Eyebrow>Referrers by visitors</Eyebrow>
            <BarList
              max={V.referrers[0].visitors}
              rows={V.referrers.slice(0, 12).map((r) => ({
                label: r.name,
                bar: r.visitors,
                value: fmt(r.visitors),
              }))}
            />
          </div>
        </div>

        <details style={{ marginTop: 20 }}>
          <summary style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer", padding: "8px 0" }}>
            All {V.totals.countries} countries
          </summary>
          <div style={{ marginTop: 10 }}>
            <Table
              head={["Country", "Visitors", "Pageviews", "Views / visitor"]}
              rows={[...V.countries]
                .sort((a, b) => b[metric] - a[metric])
                .map((c) => [c.code, fmt(c.visitors), fmt(c.views), (c.views / c.visitors).toFixed(1)])}
            />
          </div>
        </details>
      </Section>

      {/* ===================== THE SPIKE ===================== */}
      <Section>
        <Eyebrow>Read this before trusting the visitor count</Eyebrow>
        <H2>59% of those visitors arrived in one week and behaved like bots</H2>
        <Dek>
          Visitors sat at a median of {restMedian} a day, then jumped to {fmt(Math.max(...burst.map((d) => d.visitors)))} on
          21 July and stayed high for a week before collapsing back. That week alone is{" "}
          {fmt(burstVisitors)} of the {fmt(V.totals.visitors)} visitors in the whole window.
        </Dek>

        <Card pad={22}>
          <div style={{ position: "relative" }}>
            <svg viewBox="0 0 760 190" style={{ display: "block", width: "100%", height: "auto" }} role="img"
              aria-label="Daily visitors, showing a one-week spike between 20 and 26 July.">
              {[0, 0.5, 1].map((t) => {
                const y = 20 + 130 - t * 130;
                return (
                  <g key={t}>
                    <line x1={44} x2={748} y1={y} y2={y} stroke="var(--hairline)" strokeWidth={1} />
                    <text x={38} y={y + 3.5} textAnchor="end" fontSize={9.5} fill="var(--ink-3)" fontFamily={SANS}>
                      {Math.round(maxDaily * t)}
                    </text>
                  </g>
                );
              })}
              {V.daily.map((d, i) => {
                const iw = (748 - 44) / V.daily.length;
                const h = (d.visitors / maxDaily) * 130;
                const inBurst = d.d >= "2026-07-20" && d.d <= "2026-07-26";
                return (
                  <rect
                    key={d.d}
                    x={44 + i * iw + iw * 0.16}
                    y={20 + 130 - h}
                    width={iw * 0.68}
                    height={h}
                    rx={1}
                    fill="var(--blue)"
                    fillOpacity={inBurst ? 1 : 0.45}
                  >
                    <title>{`${d.d}: ${d.visitors} visitors, ${d.views} pageviews`}</title>
                  </rect>
                );
              })}
              {V.daily.map((d, i) =>
                i % 7 ? null : (
                  <text
                    key={d.d}
                    x={44 + i * ((748 - 44) / V.daily.length) + (748 - 44) / V.daily.length / 2}
                    y={168}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="var(--ink-3)"
                    fontFamily={SANS}
                  >
                    {d.d.slice(5)}
                  </text>
                ),
              )}
              <text x={44} y={13} fontSize={9.5} fill="var(--ink-3)" fontFamily={SANS}>
                visitors / day &middot; solid = 20&ndash;26 july
              </text>
            </svg>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 20 }}>
          <Stat
            label="Top OS by visitors"
            value={linux ? fmt(linux.visitors) : "—"}
            note={`GNU/Linux, ${linux ? Math.round((linux.visitors / V.totals.visitors) * 100) : 0}% of all visitors. Desktop Linux is a rounding error in real consumer traffic.`}
          />
          <Stat
            label="Google referrals, Vercel"
            value={googleRef ? fmt(googleRef.visitors) : "—"}
            note={`Visitors Vercel attributes to google.com over these ${V.days} days`}
          />
          <Stat
            label="Google clicks, Search Console"
            value={fmt(gscClicks)}
            note={`Clicks Google itself reports for the same window, ${googleRef ? (googleRef.visitors / gscClicks).toFixed(1) : "?"}x fewer`}
          />
        </div>

        <p style={{ fontFamily: SANS, fontSize: 16, color: "var(--ink-2)", marginTop: 20, maxWidth: "68ch", lineHeight: 1.55 }}>
          Google reports {fmt(gscClicks)} search clicks in this window. Vercel counts{" "}
          {googleRef ? fmt(googleRef.visitors) : "?"} visitors arriving from google.com, and Search Console shows no
          click spike at all on 20&ndash;26 July. Traffic Google never sent, on an operating system real shoppers
          don&rsquo;t use, landing for one page and leaving. Treat the visitor number as inflated and use Search Console
          clicks as the honest floor.
        </p>
      </Section>

      {/* ===================== PAGES ===================== */}
      <Section>
        <Eyebrow>Pages</Eyebrow>
        <H2>What people actually opened</H2>
        <Dek>Bar length is visitors. Pageviews are on the right, so a short bar with a big number is a page people reload or loop through.</Dek>
        <BarList
          max={V.pages[0].visitors}
          rows={[...V.pages]
            .sort((a, b) => b.visitors - a.visitors)
            .map((p) => ({ label: p.path, bar: p.visitors, value: fmt(p.views) }))}
        />
        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", marginTop: 32 }}>
          <div>
            <Eyebrow>Device</Eyebrow>
            <Table
              head={["Device", "Visitors", "Pageviews"]}
              rows={V.devices.map((d) => [d.name, fmt(d.visitors), fmt(d.views)])}
            />
          </div>
          <div>
            <Eyebrow>Operating system</Eyebrow>
            <Table
              head={["OS", "Visitors", "Pageviews"]}
              rows={V.os.map((d) => [d.name, fmt(d.visitors), fmt(d.views)])}
            />
          </div>
        </div>
      </Section>

      {/* ===================== APP PROFILES ===================== */}
      <Section>
        <Eyebrow>App profiles &middot; Mixpanel export</Eyebrow>
        <H2>Where the app&rsquo;s registered users are</H2>
        <Dek>
          {fmt(P.meta.total as number)} profiles, last seen {String(P.meta.firstSeen).slice(0, 10)} to{" "}
          {String(P.meta.lastSeen).slice(0, 10)}. {fmt(P.meta.importCount as number)} of them were stamped in a single
          hour on 20 June by a bulk import, and every one geolocates to Encinitas, California. That is the importing
          server&rsquo;s IP, not a user location. Another {fmt(P.meta.residualCount as number)} still resolve to
          Encinitas on ordinary timestamps, so the same egress is still leaking.
        </Dek>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <Eyebrow>Filter</Eyebrow>
            <Pills
              value={cohort}
              onChange={setCohort}
              options={[
                { key: "all", label: "Everything" },
                { key: "organic", label: "Drop the import" },
                { key: "clean", label: "Drop all Encinitas" },
              ]}
            />
          </div>
          <div>
            <Eyebrow>View</Eyebrow>
            <Pills
              value={scope}
              onChange={setScope}
              options={[
                { key: "world", label: "World" },
                { key: "us", label: "United States" },
              ]}
            />
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: "var(--ink-2)",
              fontVariantNumeric: "tabular-nums",
              paddingBottom: 7,
            }}
          >
            {fmt(profileTotal)} profiles &middot; {fmt(shownPoints.length)} cities
            {offFrame > 0 ? ` · ${fmt(offFrame)} outside this view` : ""}
          </div>
        </div>

        <div style={{ position: "relative", border: "1px solid var(--hairline-strong)", borderRadius: 4, overflow: "hidden", background: "var(--white)" }}>
          <svg
            viewBox={vb}
            style={{ display: "block", width: "100%", height: "auto" }}
            role="img"
            aria-label="Map of app profile density by city, with the suspect Encinitas cluster marked."
          >
            <path d={data.geometry.world} fill="var(--tan)" stroke="var(--hairline-strong)" strokeWidth={0.4} strokeLinejoin="round" />
            {shownPoints.map((p) => {
              const n = nOf(p);
              const suspect = p.city === "Encinitas";
              const r = Math.min(38, 2.4 + Math.sqrt(n) * 1.5) * k;
              return (
                <circle
                  key={`${p.city}|${p.region}|${p.country}`}
                  cx={px(p.lon)}
                  cy={py(p.lat)}
                  r={r}
                  fill={suspect ? "var(--orange)" : "var(--blue)"}
                  fillOpacity={suspect ? 0.3 : 0.75}
                  stroke={suspect ? "var(--orange)" : "var(--ink-2)"}
                  strokeWidth={0.9 * k}
                  strokeDasharray={suspect ? `${2.5 * k} ${2 * k}` : undefined}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    const b = e.currentTarget.getBoundingClientRect();
                    setTip({
                      text: [
                        [p.city, p.region, p.country].filter(Boolean).join(", "),
                        `${fmt(n)} profile${n === 1 ? "" : "s"}`,
                        ...(suspect ? ["import / proxy artifact"] : []),
                      ],
                      x: b.left - box.left + b.width / 2,
                      y: b.top - box.top,
                    });
                  }}
                  onMouseLeave={() => setTip(null)}
                />
              );
            })}
          </svg>
          {tip && <Tip {...tip} />}
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
              padding: "10px 14px",
              fontFamily: SANS,
              fontSize: 11.5,
              color: "var(--ink-2)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: 999, background: "var(--blue)" }} /> verified geography
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: 999, border: "1.5px dashed var(--orange)" }} /> encinitas, suspect
            </span>
            <span style={{ color: "var(--ink-3)" }}>circle area scales with profile count, largest is capped</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", marginTop: 32 }}>
          <div>
            <Eyebrow>Countries, verified only</Eyebrow>
            <BarList
              max={Math.max(...P.countries.map((c) => c.c))}
              rows={P.countries
                .filter((c) => c.c > 0)
                .slice(0, 12)
                .map((c) => ({ label: c.name, bar: c.c, value: fmt(c.c) }))}
            />
          </div>
          <div>
            <Eyebrow>US states, verified only</Eyebrow>
            <BarList
              max={Math.max(...P.states.map((s) => s.c))}
              rows={P.states
                .filter((s) => s.c > 0)
                .slice(0, 12)
                .map((s) => ({ label: s.name, bar: s.c, value: fmt(s.c) }))}
            />
          </div>
        </div>
      </Section>

      <p style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.7, maxWidth: "80ch" }}>
        Snapshot generated {data.generatedAt}. Website visits: Vercel Web Analytics, toxome-website production,{" "}
        {V.since} to {V.until}. Search comparison: Google Search Console, {G.since} to {G.until}. App profiles:
        Mixpanel user export. Country outlines and city coordinates are baked into
        /admin/geolocation.json, so this page makes no third-party requests. To refresh, regenerate that file and
        redeploy.
      </p>
    </div>
  );
}
