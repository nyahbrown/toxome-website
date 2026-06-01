import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Terms of Use",
  description:
    "The rules that apply when you use the Toxome website or iOS app — written in plain English.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "May 28, 2026";

export default async function TermsPage() {
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
          <Eyebrow>terms of use</Eyebrow>
          <Title>The deal between us.</Title>
          <UpdatedLine>Last updated {LAST_UPDATED}</UpdatedLine>

          <Intro>
            These terms apply when you use the Toxome website at{" "}
            <a href="https://toxome.app">toxome.app</a> or the Toxome iOS
            app. By creating an account, downloading the app, or browsing
            the site, you&apos;re agreeing to them. The service is run by{" "}
            <strong>Toxome LLC</strong>, a New York limited-liability
            company (&ldquo;Toxome,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;).
          </Intro>

          <Intro>
            We&apos;ve written this in plain English. The legal bits are
            real, but we want you to actually be able to read them.
          </Intro>

          <H2 id="what-toxome-is">What Toxome is</H2>
          <P>
            Toxome is two things in one product. The iOS app lets you scan
            a clothing label and see what fibers it contains, plus a Toxome
            Score that summarizes the hazard profile of those fibers. The
            website is a curated shop of low-toxin clothing and home goods,
            plus an editorial layer (the journal, the closet dashboard,
            cleaner-alternative recommendations).
          </P>
          <P>
            The Toxome Score is <em>our informed opinion</em> based on
            published research about textile chemistry. It is not a medical
            diagnosis, not a verdict on whether something is safe for you
            personally, and not a substitute for advice from a doctor,
            dermatologist, or other professional. Different bodies react to
            different things; use Toxome as one input, not the only one.
          </P>

          <H2 id="eligibility">Who can use Toxome</H2>
          <P>
            You need to be at least 13 to use Toxome, and old enough where
            you live to enter into a contract (in most places, 18). If
            you&apos;re using Toxome on behalf of a company or
            organization, you confirm you have authority to bind them.
          </P>

          <H2 id="your-account">Your account</H2>
          <P>
            You&apos;re responsible for what happens under your account.
            Keep your sign-in credentials safe, give us accurate
            information, and don&apos;t let other people use your login.
            One account per person. If you think someone else has access to
            your account, email{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>.
          </P>

          <H2 id="acceptable-use">How you can and can&apos;t use Toxome</H2>
          <P>You can:</P>
          <Ul>
            <li>Scan your clothes, save them to your closet, browse the shop.</li>
            <li>Click affiliate links and buy things from the brands we link to.</li>
            <li>Share screenshots of your closet score on social media — please tag us.</li>
          </Ul>
          <P>You can&apos;t:</P>
          <Ul>
            <li>
              Scrape the catalog, the journal, or the Toxome Scores in bulk.
              The data and scoring are ours and they took real work.
            </li>
            <li>
              Use Toxome to impersonate someone else, harass other users,
              or do anything illegal.
            </li>
            <li>
              Reverse-engineer the app, decompile the scoring model, or
              probe our systems for vulnerabilities without permission. If
              you find a security issue, please report it to{" "}
              <a href="mailto:nyah@toxome.app">nyah@toxome.app</a> — we
              welcome that.
            </li>
            <li>Resell or rebrand Toxome features as your own product.</li>
          </Ul>

          <H2 id="subscriptions">Premium subscriptions</H2>
          <P>
            Some features in the app (full closet score, fiber breakdown,
            personalized alternatives) are available only on Toxome
            Premium. Premium is sold through the Apple App Store. By
            subscribing:
          </P>
          <Ul>
            <li>
              You agree to be charged the price Apple shows at checkout,
              billed via your Apple ID.
            </li>
            <li>
              Your subscription <em>auto-renews</em> at the end of each
              period until you cancel. You cancel through your Apple ID
              subscription settings, not through Toxome.
            </li>
            <li>
              If a free trial is offered, it converts into a paid
              subscription unless you cancel before it ends.
            </li>
            <li>
              Refunds are handled by Apple under their App Store policy. We
              don&apos;t issue refunds directly.
            </li>
          </Ul>
          <P>
            We may change subscription prices or what&apos;s included in
            Premium over time. If we do, we&apos;ll give you notice before
            the change applies to your subscription.
          </P>

          <H2 id="affiliate">Affiliate links</H2>
          <P>
            Some links on the shop are affiliate links. If you click one
            and buy something, the brand pays us a small commission, at no
            extra cost to you. Commissions <em>do not</em> affect what
            products we choose to include, what Toxome Score we give them,
            or how we rank them. We will always disclose affiliate links
            (look for the &ldquo;affiliate link&rdquo; disclosure near the
            Buy button).
          </P>

          <H2 id="user-content">Your scans and content</H2>
          <P>
            The photos you scan, the items in your closet, and your
            wishlist belong to you. By using Toxome you give us a limited
            license to store, process, and display that content back to
            you, and to use de-identified, aggregated insights from it to
            improve the product. We won&apos;t sell your scans or photos,
            and we won&apos;t use your face or identifiable images in
            marketing without your explicit permission.
          </P>

          <H2 id="our-content">Our content</H2>
          <P>
            Everything else — the Toxome name, logo, design, the Toxome
            Score methodology, the journal articles, the curated catalog —
            is ours (or licensed to us). You can read it, link to it, and
            share screenshots, but you can&apos;t copy it wholesale, train
            machine-learning models on it, or pass it off as your own.
          </P>

          <H2 id="third-party">Products from other brands</H2>
          <P>
            The brands we sell are not affiliated with Toxome and we
            don&apos;t run their stores. We curate them; we don&apos;t
            warehouse them. When you buy from a brand we link to, your
            order, payment, shipping, returns, and warranties go through
            that brand. If something goes wrong with an order, contact the
            brand first. If they don&apos;t help, email us — we&apos;ll
            advocate for you where we can, but we can&apos;t guarantee a
            resolution.
          </P>

          <H2 id="termination">Leaving Toxome</H2>
          <P>
            You can stop using Toxome at any time. To delete your account
            and all associated data, follow the steps in our{" "}
            <Link href="/privacy">privacy policy</Link>. We may suspend or
            terminate your account if you break these terms, abuse the
            service, or expose us to legal risk. If we do, we&apos;ll let
            you know and (where reasonable) give you a chance to fix it.
          </P>

          <H2 id="disclaimers">Disclaimers</H2>
          <P>
            Toxome is provided <em>as is</em>. We do our best, but we
            don&apos;t warrant that the service will be uninterrupted,
            bug-free, or perfectly accurate. The Toxome Score is an
            opinion, not a guarantee. Textile chemistry is complex, brand
            disclosures vary in quality, and a low score doesn&apos;t mean
            an item is risk-free; a high score doesn&apos;t mean it&apos;s
            unsafe to wear. Use Toxome as a tool, not a verdict.
          </P>

          <H2 id="liability">Limits on our liability</H2>
          <P>
            To the maximum extent allowed by law, Toxome and our team are
            not liable for indirect, incidental, special, or consequential
            damages arising from your use of the service. Our total
            liability for any claim related to Toxome is capped at the
            amount you paid us in the twelve months before the claim, or
            <strong> US$50</strong>, whichever is greater. Some
            jurisdictions don&apos;t allow these limits; in that case, the
            limits apply to the extent they&apos;re allowed.
          </P>

          <H2 id="indemnification">You cover us if you break the rules</H2>
          <P>
            If your use of Toxome (or your breach of these terms) causes a
            legal claim against us, you agree to defend us, pay our
            reasonable costs, and hold us harmless from that claim. This
            doesn&apos;t apply to claims arising from our own wrongful
            conduct.
          </P>

          <H2 id="law-disputes">Governing law and disputes</H2>
          <P>
            These terms are governed by the laws of the State of New York,
            without regard to its conflict-of-laws rules. If we have a
            dispute, you agree to try to resolve it informally first by
            emailing{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>. If that
            doesn&apos;t work within 60 days, the dispute will be resolved
            in the state or federal courts located in New York County, New
            York, and we both consent to that jurisdiction.
          </P>

          <H2 id="changes">Changes to these terms</H2>
          <P>
            We may update these terms over time. If we make a material
            change, we&apos;ll let you know in-app or by email before the
            change takes effect. The &ldquo;Last updated&rdquo; date at the
            top of this page is the source of truth for the current
            version. If you keep using Toxome after a change, you&apos;re
            accepting the new version.
          </P>

          <H2 id="apple">App Store terms</H2>
          <P>
            The iOS app is licensed to you by Toxome under these terms; we
            (not Apple) are responsible for the app and for these terms.
            Apple is a third-party beneficiary of these terms and can
            enforce them against you. The app must comply with Apple&apos;s
            App Store Terms of Service, which apply in addition to ours.
          </P>

          <H2 id="contact">Contact</H2>
          <P>
            Questions, requests, or legal notices: email{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>. The
            company behind Toxome is Toxome LLC, registered in New York.
          </P>

          <Related>
            See also: <Link href="/privacy">Privacy Policy</Link>.
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
        fontWeight: 300,
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
        fontSize: 16,
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
        fontFamily: "var(--sans)",
        fontWeight: 600,
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
