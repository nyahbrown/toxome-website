import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Terms of Use",
  description:
    "The Terms of Use governing access to and use of the Toxome website, iOS application, and browser extension, provided by Toxome LLC.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "June 9, 2026";

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
            // Legal text renders in natural case (overriding the site-wide
            // lowercase rule) so defined terms, statutory references, and the
            // conventional all-caps disclaimers read correctly.
            textTransform: "none",
          }}
        >
          <Eyebrow>terms of use</Eyebrow>
          <Title>Terms of Use</Title>
          <UpdatedLine>Last updated {LAST_UPDATED}</UpdatedLine>

          <Intro>
            These Terms of Use (the &ldquo;Terms&rdquo;) constitute a legally
            binding agreement between you and Toxome LLC, a New York limited
            liability company (&ldquo;Toxome,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to and
            use of the website located at{" "}
            <a href="https://toxome.app">toxome.app</a> (the &ldquo;Site&rdquo;),
            the Toxome iOS application (the &ldquo;App&rdquo;), the Toxome
            browser extension (the &ldquo;Extension&rdquo;), and the related
            features and content we make available (collectively, the
            &ldquo;Services&rdquo;).
          </Intro>

          <Intro>
            By creating an account, downloading or using the App or the
            Extension, or accessing the Site, you acknowledge that you have read,
            understood, and agree to be bound by these Terms and by our{" "}
            <Link href="/privacy">Privacy Policy</Link>, which is incorporated
            herein by reference. If you do not agree to these Terms, you must not
            access or use the Services.
          </Intro>

          <H2 id="what-toxome-is">1. The Services</H2>
          <P>
            The App enables you to scan a garment label and view its fibre
            composition together with a Toxome Rating (the &ldquo;Rating&rdquo;)
            summarising the hazard profile of those fibres. The Site provides a
            curated retail selection of lower-toxicity apparel and home goods,
            together with editorial content, a closet dashboard, and related
            recommendations.
          </P>
          <P>
            The Rating represents Toxome&apos;s informed opinion, derived from
            published research concerning textile chemistry. The Rating does not
            constitute medical advice or diagnosis, does not represent a
            determination that any item is safe or unsafe for you, and is not a
            substitute for the advice of a qualified physician, dermatologist, or
            other professional. You should treat the Rating as one factor among
            others, and not as a definitive verdict.
          </P>

          <H2 id="eligibility">2. Eligibility</H2>
          <P>
            You must be at least thirteen (13) years of age, and of the age of
            majority and legal capacity to enter into a binding contract in your
            jurisdiction of residence (in most jurisdictions, eighteen (18)), in
            order to use the Services. If you use the Services on behalf of an
            entity, you represent and warrant that you are authorised to bind
            that entity to these Terms.
          </P>

          <H2 id="your-account">3. Accounts</H2>
          <P>
            You are responsible for all activity occurring under your account.
            You agree to provide accurate information, to maintain the
            confidentiality of your sign-in credentials, and not to permit any
            other person to use your account. Accounts are limited to one per
            person. You must promptly notify us at{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a> of any
            unauthorised use of your account.
          </P>

          <H2 id="acceptable-use">4. Acceptable Use</H2>
          <P>
            You may use the Services to scan garments, maintain your closet,
            browse the catalogue, follow affiliate links to participating brands,
            and share images of your closet score on social media. You shall not:
          </P>
          <Ul>
            <li>
              scrape, harvest, or extract the catalogue, editorial content, or
              Ratings in bulk, each of which is proprietary to Toxome;
            </li>
            <li>
              use the Services to impersonate any person, harass any user, or
              engage in any unlawful activity;
            </li>
            <li>
              reverse engineer, decompile, or disassemble the App or the scoring
              methodology, or probe, scan, or test the vulnerability of our
              systems without our prior written authorisation (security
              vulnerabilities may be reported to{" "}
              <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>, which we
              welcome); or
            </li>
            <li>
              resell, sublicense, rebrand, or otherwise commercialise the
              Services or any feature thereof as your own product.
            </li>
          </Ul>

          <H2 id="subscriptions">5. Premium Subscriptions</H2>
          <P>
            Certain features of the App (including the full closet score, fibre
            breakdown, and personalised recommendations) are available only
            through a paid subscription (&ldquo;Toxome Premium&rdquo;), sold
            through the Apple App Store. By purchasing a subscription, you agree
            that:
          </P>
          <Ul>
            <li>
              you will be charged the price displayed at checkout, billed to your
              Apple ID;
            </li>
            <li>
              your subscription will automatically renew at the end of each
              billing period until cancelled, and you may cancel only through
              your Apple ID subscription settings, and not through Toxome;
            </li>
            <li>
              any free trial offered will convert into a paid subscription unless
              cancelled before the trial period ends; and
            </li>
            <li>
              refunds are administered by Apple in accordance with App Store
              policy, and Toxome does not issue refunds directly.
            </li>
          </Ul>
          <P>
            We may modify subscription pricing or the features included in Toxome
            Premium. We will provide notice before any such change applies to
            your subscription.
          </P>

          <H2 id="affiliate">6. Affiliate Links</H2>
          <P>
            The Site contains affiliate links. Where you follow such a link and
            complete a purchase, the relevant brand may pay Toxome a commission
            at no additional cost to you. Such commissions do not influence the
            products we include, the Ratings we assign, or the order in which
            products are presented. We disclose affiliate links adjacent to the
            relevant purchase action.
          </P>

          <H2 id="user-content">7. User Content</H2>
          <P>
            As between you and Toxome, you retain ownership of the photographs
            you submit, the items in your closet, and your wishlist (&ldquo;User
            Content&rdquo;). You grant Toxome a non-exclusive, worldwide,
            royalty-free licence to host, store, process, and display User
            Content for the purpose of providing the Services to you, and to use
            de-identified, aggregated data derived from User Content to operate
            and improve the Services. We will not sell your User Content, and we
            will not use your likeness or identifiable images for marketing
            purposes without your express consent.
          </P>

          <H2 id="our-content">8. Intellectual Property</H2>
          <P>
            All right, title, and interest in and to the Services, including the
            Toxome name and logo, the Rating methodology, the editorial content,
            the design, and the curated catalogue (collectively, and excluding
            User Content), are owned by or licensed to Toxome and are protected
            by applicable intellectual property laws. You may access and share
            such content for personal, non-commercial purposes only. You shall
            not reproduce it in whole, use it to train machine-learning models,
            or represent it as your own.
          </P>

          <H2 id="third-party">9. Third-Party Brands and Products</H2>
          <P>
            Brands featured on the Site are independent of Toxome and are not
            operated by us. We curate, but do not warehouse or sell, their
            products. Where you purchase from a linked brand, your order,
            payment, shipping, returns, and warranties are governed by, and are
            the responsibility of, that brand. You should direct any issue with
            an order to the relevant brand in the first instance. We may, but are
            not obligated to, assist you, and we do not guarantee any resolution.
          </P>

          <H2 id="termination">10. Suspension and Termination</H2>
          <P>
            You may cease using the Services and delete your account at any time,
            as described in our <Link href="/privacy">Privacy Policy</Link>. We
            may suspend or terminate your access to the Services, with or without
            notice, if you breach these Terms, misuse the Services, or expose
            Toxome to legal or operational risk. Where reasonable, we will provide
            notice and an opportunity to cure. Those provisions that by their
            nature should survive termination (including Sections 8, 11, 12, 13,
            and 14) shall survive.
          </P>

          <H2 id="disclaimers">11. Disclaimer of Warranties</H2>
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE
            PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
            INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT. Toxome does not warrant that the
            Services will be uninterrupted, error-free, or accurate. The Rating
            is an opinion and not a guarantee; a lower Rating does not mean that
            an item is free of risk, and a higher Rating does not mean that an
            item is unsafe to wear.
          </P>

          <H2 id="liability">12. Limitation of Liability</H2>
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TOXOME AND ITS
            OFFICERS, MEMBERS, AND PERSONNEL SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING OUT
            OF OR RELATING TO YOUR USE OF THE SERVICES. TOXOME&apos;S TOTAL
            AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE
            SERVICES SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO
            TOXOME IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO
            THE CLAIM, OR (B) FIFTY UNITED STATES DOLLARS (US$50). Some
            jurisdictions do not permit the exclusion or limitation of certain
            damages; in such jurisdictions, the foregoing limitations apply to
            the fullest extent permitted by law.
          </P>

          <H2 id="indemnification">13. Indemnification</H2>
          <P>
            You agree to indemnify, defend, and hold harmless Toxome and its
            officers, members, and personnel from and against any claim,
            liability, damage, loss, or expense (including reasonable legal fees)
            arising out of or relating to your use of the Services or your breach
            of these Terms. This obligation does not apply to claims arising from
            Toxome&apos;s own wilful misconduct or gross negligence.
          </P>

          <H2 id="law-disputes">14. Governing Law and Dispute Resolution</H2>
          <P>
            These Terms are governed by the laws of the State of New York,
            without regard to its conflict-of-laws principles. In the event of a
            dispute, you agree first to attempt to resolve it informally by
            contacting us at{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>. If the dispute
            is not resolved within sixty (60) days, it shall be subject to the
            exclusive jurisdiction of the state and federal courts located in New
            York County, New York, and the parties consent to the personal
            jurisdiction of such courts.
          </P>

          <H2 id="apple">15. Apple-Specific Terms</H2>
          <P>
            The App is licensed, not sold, to you, and that licence is subject to
            these Terms. Toxome, and not Apple, is solely responsible for the App
            and its content. Apple has no obligation to furnish any maintenance or
            support services with respect to the App, and, to the maximum extent
            permitted by applicable law, Apple has no warranty obligation with
            respect to the App. Apple is a third-party beneficiary of these Terms
            and may enforce them against you as a third-party beneficiary. Your
            use of the App must comply with the Apple Media Services Terms and
            Conditions, which apply in addition to these Terms.
          </P>

          <H2 id="general">16. General</H2>
          <P>
            These Terms, together with the Privacy Policy, constitute the entire
            agreement between you and Toxome regarding the Services and supersede
            all prior agreements and understandings. If any provision of these
            Terms is held to be invalid or unenforceable, the remaining
            provisions shall remain in full force and effect. Our failure to
            enforce any provision shall not constitute a waiver of that provision.
            You may not assign these Terms without our prior written consent; we
            may assign these Terms in connection with a merger, acquisition, or
            sale of assets. Toxome shall not be liable for any failure or delay in
            performance resulting from causes beyond its reasonable control. Any
            notice to Toxome under these Terms must be sent to{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>.
          </P>

          <H2 id="changes">17. Changes to these Terms</H2>
          <P>
            We may amend these Terms from time to time. Where we make a material
            change, we will notify you through the Services or by email before the
            change takes effect. The &ldquo;Last updated&rdquo; date at the top of
            this page indicates the current version. Your continued use of the
            Services following the effective date of any change constitutes your
            acceptance of the amended Terms.
          </P>

          <H2 id="contact">18. Contact</H2>
          <P>
            These Terms are issued by Toxome LLC, a limited liability company
            registered in the State of New York. Questions, requests, and legal
            notices may be directed to{" "}
            <a href="mailto:nyah@toxome.app">nyah@toxome.app</a>.
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
        fontFamily: "var(--sans)",
        fontWeight: 500,
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
        fontSize: 14,
        color: "var(--ink-3)",
      }}
    >
      {children}
    </p>
  );
}
