const features = [
  {
    icon: "🔍",
    title: "Instant Label Scanner",
    description:
      "Photograph any clothing label and instantly detect chemicals, synthetic fibers, and hidden materials that could affect your health.",
  },
  {
    icon: "🧬",
    title: "Health + Environmental Insights",
    description:
      "Get actionable insights on chemical exposure, endocrine disruptors, and environmental impact — all backed by peer-reviewed research.",
  },
  {
    icon: "👗",
    title: "Closet Analytics",
    description:
      "Track your entire wardrobe, see your hazard score over time, and get personalized swap recommendations for safer alternatives.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-[#DCFCE7] text-[#15803D] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1B4332]">
            Everything you need to detox your wardrobe
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Transparency about what you wear — simplified.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#F0FDF4] rounded-3xl p-8 hover:shadow-lg transition-shadow border border-[#DCFCE7]"
            >
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-3">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
