import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Privacy",
  description:
    "How Toxome collects, uses, and protects your data — across the website and the iOS app.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "May 28, 2026";

export default async function PrivacyPage() {
  const taxonomy = await getShopTaxonomy();
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          paddingTop: 88,
          paddingBottom: 120,
        }}
      >
        <article
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 32px",
            color: "var(--ink)",
          }}
        >
          <Eyebrow>privacy</Eyebrow>
          <Title>Your data, in plain English.</Title>
          <UpdatedLine>Last updated {LAST_UPDATED}</UpdatedLine>

          <Intro>
            This is the privacy policy for the Toxome website at{" "}
            <a href="https://toxome.app">toxome.app</a> and the Toxome iOS app.
            Both are run by <strong>Toxome LLC</strong>, a New York
            limited-liability company (&ldquo;Toxome,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us&rdquo;). We&apos;re a clothing scanner
            and editorial shop for people who want to know what&apos;s
            actually in their clothes.
          </Intro>

          <Intro>
            We try to collect the minimum data needed to make Toxome work,
            we don&apos;t sell it, and you can ask us to delete it at any
            time. The rest of this page tells you exactly what we collect,
            why, who we share it with, and what your rights are.
          </Intro>

          <H2 id="data-we-collect">What we collect</H2>
          <P>We collect three kinds of data:</P>
          <H3>Account info</H3>
          <P>
            When you sign up on the website or the app, we collect your
            email address and, if you set one, your display name and photo.
            Authentication is handled by Firebase (Google). We use this to
            sign you in, recognize you across the web and the app, and send
            you transactional messages (sign-in links, important changes to
            your account or the service).
          </P>
          <H3>What you do in Toxome</H3>
          <P>
            On the <em>app</em>, when you scan a clothing label, we store
            the photo of the label, the fabric composition we extract from
            it, the brand and category we identify, and the Toxome Score we
            calculate. If you save a scan to your closet, that scan stays
            in your account until you delete it.
          </P>
          <P>
            On the <em>website</em>, we store the items you save to your
            wishlist and the filters you apply when browsing the shop. We
            also receive your subscription status from Apple via RevenueCat
            so we know whether to unlock premium features.
          </P>
          <P>
            During onboarding in the app you may share preferences
            (concerns, gender, budget, focus areas). We use these to
            personalize what you see; you can change or clear them anytime
            in the app.
          </P>
          <H3>Basic usage data</H3>
          <P>
            Like most websites and apps, we record basic technical
            information: device type, browser, approximate location (from
            your IP), and which pages or screens you visit. This is
            aggregate analytics to understand what works and what
            doesn&apos;t. It is not tied to advertising trackers and we do
            not enable third-party ad networks.
          </P>

          <H2 id="how-we-use-it">How we use it</H2>
          <P>We use your data to:</P>
          <Ul>
            <li>Run the service — show your closet, save your wishlist, sign you in.</li>
            <li>
              Personalize what you see — for example, suggesting cleaner
              alternatives in the categories where your closet leans
              high-risk.
            </li>
            <li>
              Process subscription payments through Apple and our
              subscription provider (RevenueCat).
            </li>
            <li>
              Send you transactional emails — account confirmations, sign-in
              codes, and important changes to the service. We do not send
              marketing emails without your explicit opt-in.
            </li>
            <li>
              Improve the product. We may look at de-identified, aggregated
              trends (e.g. &ldquo;30% of scans this month were polyester
              tops&rdquo;) to decide what to build next. Aggregated data
              cannot be tied back to you.
            </li>
            <li>
              Comply with the law and protect Toxome and our users from
              abuse.
            </li>
          </Ul>

          <H2 id="who-we-share-with">Who we share it with</H2>
          <P>
            We don&apos;t sell your data. We share it only with the
            companies we use to run Toxome, and only as much of it as they
            need to do their job:
          </P>
          <Ul>
            <li>
              <strong>Firebase (Google)</strong> — authentication, your
              closet, your wishlist, and the photos you upload.
            </li>
            <li>
              <strong>Supabase</strong> — our product catalog. You don&apos;t
              have an account here; Supabase only serves the items you
              browse on the shop.
            </li>
            <li>
              <strong>RevenueCat + Apple App Store</strong> — subscription
              management and payments. We never see your card details;
              Apple does.
            </li>
            <li>
              <strong>Vercel</strong> — the platform our website runs on.
              They handle hosting and basic request logs.
            </li>
            <li>
              <strong>Affiliate partners</strong> — when you click
              &ldquo;Buy at [brand]&rdquo; we send you to that brand&apos;s
              website. Some links contain an affiliate code so we earn a
              small commission. We don&apos;t share your Toxome account or
              closet data with them; they only see that the click came from
              us. We also keep our own anonymous record of which products and
              brands get viewed and clicked &mdash; tied to a random device id,
              never your name or email &mdash; so we can see what&apos;s
              resonating and show brands the interest we send their way. This
              stays inside Toxome; it isn&apos;t sold or handed to advertisers.
            </li>
            <li>
              Law enforcement, if we receive a valid legal request and we
              believe we have to comply.
            </li>
          </Ul>

          <H2 id="your-rights">Your data, your rights</H2>
          <P>
            You can see most of your data inside Toxome itself — your
            account page shows your closet score, fiber breakdown,
            wishlist, and email. If you want more:
          </P>
          <Ul>
            <li>
              <strong>Delete your account</strong> — in the app: Settings →
              Delete account. On the web: email{" "}
              <a href="mailto:nyah@toxome.app">nyah@toxome.app</a> from the
              email tied to your account. We&apos;ll delete your account and
              all associated data within 30 days, except where the law
              requires us to keep something (e.g. transaction records).
            </li>
            <li>
              <strong>Export your data</strong> — email us and we&apos;ll
              send you a copy of the data we have on you.
            </li>
            <li>
              <strong>Correct your data</strong> — most of it is editable
              in-app. For anything that isn&apos;t, email us.
            </li>
            <li>
              <strong>Opt out of analytics</strong> — if you don&apos;t want
              us to use even aggregated analytics, email us and we&apos;ll
              flag your account so we exclude it from product analytics.
            </li>
          </Ul>
          <P>
            If you live in California, you have additional rights under the
            CCPA, including the right not to be discriminated against for
            exercising any of the above. If you live in the EU/UK, you have
            additional rights under the GDPR. To exercise any of them,
            email{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a> from the
            email tied to your account.
          </P>

          <H2 id="cookies">Cookies and similar tech</H2>
          <P>
            The website uses essential cookies (to keep you signed in) and
            basic analytics. We do not use third-party advertising cookies
            and we do not enable cross-site tracking. The iOS app uses the
            standard Apple-provided identifiers governed by Apple&apos;s App
            Tracking Transparency rules; we do not request tracking
            permission because we don&apos;t need it.
          </P>

          <H2 id="children">Children</H2>
          <P>
            Toxome is not directed at children under 13 and we don&apos;t
            knowingly collect data from them. If you believe a child under
            13 has signed up, email us and we&apos;ll delete the account.
          </P>

          <H2 id="security">Security</H2>
          <P>
            Data is encrypted in transit between your device and our
            servers. Our storage providers (Firebase, Supabase) encrypt
            data at rest and follow industry-standard security practices.
            No system is bullet-proof; if we ever learn of a breach that
            affects you, we&apos;ll let you know.
          </P>

          <H2 id="international">Where your data lives</H2>
          <P>
            Our service providers store data in US-based data centers. If
            you&apos;re outside the US, your data is transferred to the US
            when you use Toxome. We rely on Standard Contractual Clauses
            and our providers&apos; data processing agreements for cross-
            border transfers as required by GDPR.
          </P>

          <H2 id="changes">Changes to this policy</H2>
          <P>
            If we make a material change, we&apos;ll let you know in-app or
            by email before the change takes effect. The &ldquo;Last
            updated&rdquo; date at the top of this page is the source of
            truth for the current version.
          </P>

          <H2 id="contact">Contact</H2>
          <P>
            For anything privacy-related — questions, requests, complaints
            — email{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>. The
            company behind Toxome is Toxome LLC, registered in New York.
          </P>

          <Related>
            See also: <Link href="/terms">Terms of Use</Link>.
          </Related>
        </article>
      </main>
      <Footer />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: "var(--serif)",
        fontWeight: 400,
        fontSize: "clamp(36px, 5vw, 56px)",
        lineHeight: 1.05,
        letterSpacing: "-0.025em",
        color: "var(--ink)",
        margin: "0 0 10px",
      }}
    >
      {children}
    </h1>
  );
}

function UpdatedLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        margin: "0 0 48px",
      }}
    >
      {children}
    </p>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 18,
        lineHeight: 1.6,
        color: "var(--ink)",
        letterSpacing: "-0.005em",
        margin: "0 0 24px",
      }}
    >
      {children}
    </p>
  );
}

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "var(--serif)",
        fontWeight: 500,
        fontSize: 26,
        lineHeight: 1.2,
        letterSpacing: "-0.015em",
        color: "var(--ink)",
        margin: "56px 0 16px",
        scrollMarginTop: 100,
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--sans)",
        fontWeight: 500,
        fontSize: 16,
        lineHeight: 1.4,
        letterSpacing: "-0.005em",
        color: "var(--ink)",
        margin: "20px 0 8px",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 16,
        lineHeight: 1.65,
        color: "var(--ink-2)",
        letterSpacing: "-0.005em",
        margin: "0 0 16px",
      }}
    >
      {children}
    </p>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        margin: "0 0 16px",
        paddingLeft: 22,
        color: "var(--ink-2)",
        fontSize: 16,
        lineHeight: 1.65,
        letterSpacing: "-0.005em",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {children}
    </ul>
  );
}

function Related({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        marginTop: 72,
        paddingTop: 32,
        borderTop: "1px solid var(--hairline)",
        fontSize: 14,
        color: "var(--ink-3)",
      }}
    >
      {children}
    </p>
  );
}
