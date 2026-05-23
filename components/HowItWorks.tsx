const steps = [
  {
    number: "01",
    title: "Scan a clothing label",
    description:
      "Open the app and photograph any clothing tag. Toxome reads the fibers, materials, and chemical treatments listed.",
  },
  {
    number: "02",
    title: "Save to your closet",
    description:
      "Every scan is stored in your digital closet. Build a full picture of your wardrobe's hazard profile over time.",
  },
  {
    number: "03",
    title: "Discover alternatives",
    description:
      "Get personalized recommendations for safer, cleaner alternatives based on what's already in your closet.",
  },
];

export default function HowItWorks() {
  return (
    <section id="howitworks" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-[#DCFCE7] text-[#15803D] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            How it works
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1B4332]">
            Three steps to a cleaner closet
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-[#DCFCE7] -translate-x-1/2 z-0" />
              )}
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center mb-6">
                  <span className="text-white font-extrabold text-lg">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-[#1B4332] mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
