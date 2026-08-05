// Renders a schema.org JSON-LD block. Answer engines and search crawlers read
// these to resolve what a page IS, rather than inferring it from markup.
//
// JSON.stringify already escapes the only character that could break out of a
// <script> block in practice; "</" is neutralised below so a stray closing tag
// inside any string value (a course description, an FAQ answer) can never end
// the script early.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
