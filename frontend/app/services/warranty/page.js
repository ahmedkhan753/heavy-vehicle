// Warranty is dealer-provided (badge model); HeavyWheels does not sell warranty.
import Link from "next/link";
import DealerWarrantyRequest from "@/components/services/DealerWarrantyRequest";

export const metadata = {
  title: "Warranty Program — HeavyWheels",
  description: "Dealer-provided warranty on heavy vehicles. Look for the Verified Warranty badge, or — if you're a dealer — get your own warranty badge.",
};

export default function WarrantyPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Service</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Warranty Program</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-muted)]">
          Some dealers back their vehicles with their own warranty. Those dealers can earn a
          <span className="font-bold text-[var(--hw-green)]"> Verified Warranty</span> badge — shown on
          their profile and listings — after our team reviews their warranty terms.
        </p>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl border border-[var(--hw-border-strong)] bg-[var(--hw-soft-panel)] p-4 text-sm text-[var(--hw-text-secondary)]">
          <strong className="text-[var(--hw-text-primary)]">Important:</strong> the warranty is offered
          and honoured <strong>directly by the dealer</strong>. HeavyWheels only verifies that a dealer
          offers a warranty — we do not provide, underwrite, or take responsibility for any warranty.
        </div>

        {/* For buyers */}
        <div className="mt-8">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Buying a vehicle?</h2>
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
            Look for the <span className="font-bold text-[var(--hw-green)]">🛡️ Verified Warranty</span> badge
            on listings and dealer profiles. Always confirm the exact terms with the dealer before you buy.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/vehicles" className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Browse vehicles</Link>
            <Link href="/dealers" className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">Browse dealers</Link>
          </div>
        </div>

        {/* For dealers */}
        <div className="mt-10">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Are you a dealer who offers warranty?</h2>
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
            Tell us your warranty terms and request the badge. Once approved, it appears on your dealer
            profile and all your listings.
          </p>
          <div className="mt-5">
            <DealerWarrantyRequest />
          </div>
        </div>
      </div>
    </main>
  );
}
