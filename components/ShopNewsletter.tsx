import NewsletterCard from "./NewsletterCard";

// Email capture band for the shop department pages (all/women/men/kids/home).
// Matches the ShopIntro container above it so the card lines up with the copy
// and the grid. `section` tags which department converted, so the shop pages can
// be compared against the guides and the homepage.
export default function ShopNewsletter({ section }: { section?: string }) {
  return (
    <section style={{ background: "var(--bg)", padding: "0 0 72px" }}>
      <div className="shell" style={{ padding: "0 21px" }}>
        <div style={{ maxWidth: 560 }}>
          <NewsletterCard source={section ? `shop_${section}` : "shop"} />
        </div>
      </div>
    </section>
  );
}
