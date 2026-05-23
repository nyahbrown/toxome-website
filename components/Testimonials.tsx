const testimonials = [
  {
    quote: "This app is a game changer! Had no idea how toxic my closet was.",
    name: "Kendall B.",
  },
  {
    quote:
      "As someone with PCOS and endometriosis, I have to be hyperaware of potential endocrine disruptors. This app is saving me from all the stress of figuring it out myself!",
    name: "Nyah B.",
  },
  {
    quote:
      "After learning about how polyester affects fertility, I decided to swap all my underwear for organic cotton.",
    name: "Connor B.",
  },
  {
    quote:
      "We all know that chemicals are everywhere. But why and what can we do? Scan the labels!!",
    name: "Katie H.",
  },
  {
    quote:
      "I've been eating organic food and using natural products for years now. But, I had no idea about how toxic clothing can be.",
    name: "Christina G.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-[#F0FDF4]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-white text-[#15803D] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 border border-[#BBF7D0]">
            Real Users
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1B4332]">
            People are waking up
          </h2>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="break-inside-avoid bg-white rounded-3xl p-7 border border-[#DCFCE7] shadow-sm"
            >
              <p className="text-gray-700 leading-relaxed mb-5 text-[15px]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#15803D] font-bold text-sm">
                  {t.name[0]}
                </div>
                <span className="text-sm font-semibold text-gray-800">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
