// Renders a JSON-LD structured-data block. Server-rendered into the page HTML
// so crawlers (Google, etc.) see it without executing JavaScript.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Schema is built from our own trusted data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
