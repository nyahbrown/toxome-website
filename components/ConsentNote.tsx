import Link from "next/link";

/**
 * Small legal consent line shown under email-collection forms (newsletter,
 * account signup). `lead` is the sentence up to the links, e.g.
 *   'By clicking "subscribe," you agree to receive emails from Toxome and accept our'
 * The component appends the linked "web terms of use" + "privacy and cookie
 * policy" and an optional "*Terms apply." line.
 */
export default function ConsentNote({
  lead,
  color = "var(--ink-3)",
  linkColor = "var(--ink-2)",
  align = "center",
  showTermsApply = false,
  style,
}: {
  lead: string;
  color?: string;
  linkColor?: string;
  align?: "left" | "center";
  showTermsApply?: boolean;
  style?: React.CSSProperties;
}) {
  const linkStyle: React.CSSProperties = {
    color: linkColor,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  };
  return (
    <p
      style={{
        fontFamily: "var(--sans)",
        fontSize: 11,
        lineHeight: 1.5,
        letterSpacing: "-0.005em",
        color,
        textAlign: align,
        margin: 0,
        ...style,
      }}
    >
      {lead}{" "}
      <Link href="/terms" style={linkStyle}>
        web terms of use
      </Link>{" "}
      and{" "}
      <Link href="/privacy" style={linkStyle}>
        privacy and cookie policy
      </Link>
      .
      {showTermsApply && (
        <span style={{ display: "block", marginTop: 6 }}>*Terms apply.</span>
      )}
    </p>
  );
}
