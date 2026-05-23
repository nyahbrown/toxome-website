export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 bg-gradient-to-b from-[#F0FDF4] to-white"
    >
      <span className="inline-block bg-[#DCFCE7] text-[#15803D] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
        Know what you&apos;re wearing
      </span>

      <h1 className="text-5xl md:text-7xl font-extrabold text-[#1B4332] leading-tight max-w-4xl">
        Discover the hidden impacts of your clothes
      </h1>

      <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
        Detox your closet, one scan at a time.
      </p>

      <p className="mt-3 text-base text-gray-500 max-w-lg">
        No greenwashing. No fluff. Just facts — backed by peer-reviewed research.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <a
          href="https://apps.apple.com"
          className="inline-flex items-center gap-3 bg-[#1B4332] text-white font-semibold px-8 py-4 rounded-full text-base hover:bg-[#2D6A4F] transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Download on the App Store
        </a>
        <a
          href="#features"
          className="text-[#1B4332] font-semibold text-base underline underline-offset-4 hover:text-[#2D6A4F] transition-colors"
        >
          See how it works →
        </a>
      </div>

      {/* Hazard badges preview */}
      <div className="mt-16 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <HazardCard label="Striped Long Sleeve" level="moderate" />
        <HazardCard label="Pink Sports Bra" level="high" />
        <HazardCard label="Linen Button-Down" level="low" />
      </div>
    </section>
  );
}

function HazardCard({ label, level }: { label: string; level: "low" | "moderate" | "high" }) {
  const config = {
    low: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "Low Hazard", color: "text-green-700" },
    moderate: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500", text: "Moderate Hazard", color: "text-yellow-700" },
    high: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "High Hazard", color: "text-red-700" },
  }[level];

  return (
    <div className={`${config.bg} ${config.border} border rounded-2xl px-5 py-4 flex items-center gap-3 w-64`}>
      <span className={`w-3 h-3 rounded-full ${config.dot} shrink-0`} />
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className={`text-xs font-medium ${config.color}`}>{config.text}</p>
      </div>
    </div>
  );
}
