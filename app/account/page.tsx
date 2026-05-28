import { Suspense } from "react";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "Account — Toxome",
};

// useSearchParams() inside AccountClient bails out of static rendering.
// Wrapping in Suspense lets Next.js prerender the shell and resolve the
// search-params-dependent UI at request time.
export default function AccountPage() {
  return (
    <Suspense fallback={<AccountFallback />}>
      <AccountClient />
    </Suspense>
  );
}

function AccountFallback() {
  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <Nav />
    </main>
  );
}
